/*jslint
node, nomen, this
*/
const fs = require("fs");
const {DataTypes, Op} = require("sequelize");
const {uuidType, enumType, required} = require("../utils/db-connector");
const {contentStatuses} = require("../utils/config");
const {fileExists, pathToURL, propertiesPicker} = require("../utils/helpers");

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const schema = {
    audience: DataTypes.STRING,
    audienceEn: DataTypes.STRING,
    authorId: DataTypes.UUID,
    coverImage: DataTypes.STRING,
    description: DataTypes.TEXT,
    descriptionEn: DataTypes.TEXT,
    duration: DataTypes.STRING,
    durationEn: DataTypes.STRING,
    endDate: DataTypes.DATE,
    id: uuidType(),
    location: DataTypes.STRING,
    locationEn: DataTypes.STRING,
    registrationLink: DataTypes.STRING,
    seats: DataTypes.STRING,
    seatsEn: DataTypes.STRING,
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    startDate: required(DataTypes.DATE),
    status: enumType(contentStatuses, contentStatuses.active),
    title: required(DataTypes.STRING),
    titleEn: DataTypes.STRING,
    type: DataTypes.STRING,
    typeEn: DataTypes.STRING
};

const allowedProps = Object.keys(schema);

function defineAgendaModel(connection) {
    const agenda = connection.define("agenda", schema, {
        hooks: {
            beforeValidate: function (record) {
                if (record.title && !record.slug) {
                    record.slug = slugify(record.title) + "-" + Date.now().toString(36);
                }
            },
            beforeUpdate: async function (record) {
                const {
                    dataValues: current,
                    _previousDataValues: previous = {},
                    _changed: updates = new Set()
                } = record;

                if (updates.has("coverImage") && previous.coverImage) {
                    const previousImageExists = await fileExists(previous.coverImage);
                    if (previousImageExists) {
                        fs.unlink(previous.coverImage, () => {});
                    }
                }
            }
        },
        paranoid: true
    });

    agenda.prototype.toResponse = function () {
        let result = Object.assign({}, this.dataValues);
        if (result.coverImage) {
            result.coverImage = pathToURL(result.coverImage);
        }
        return propertiesPicker(result)(allowedProps);
    };

    agenda.getAll = async function ({
        limit = 10,
        offset = 0,
        search,
        status,
        type,
        upcoming
    }) {
        let query = {
            limit: parseInt(limit, 10) || 10,
            offset: parseInt(offset, 10) || 0,
            order: [["startDate", "ASC"]],
            where: {}
        };

        const clauses = [];
        if (status) {
            clauses.push({status});
        }
        if (type) {
            clauses.push({type});
        }
        if (upcoming === true || upcoming === "true") {
            clauses.push({
                startDate: {
                    [Op.gte]: new Date()
                }
            });
        } else if (upcoming === false || upcoming === "false") {
            clauses.push({
                startDate: {
                    [Op.lt]: new Date()
                }
            });
            query.order = [["startDate", "DESC"]];
        }

        if (typeof search === "string" && search.trim().length > 0) {
            const pattern = "%" + search.trim() + "%";
            clauses.push({
                [Op.or]: [
                    {title: {[Op.like]: pattern}},
                    {titleEn: {[Op.like]: pattern}},
                    {description: {[Op.like]: pattern}},
                    {descriptionEn: {[Op.like]: pattern}},
                    {location: {[Op.like]: pattern}},
                    {locationEn: {[Op.like]: pattern}},
                    {type: {[Op.like]: pattern}},
                    {typeEn: {[Op.like]: pattern}}
                ]
            });
        }

        if (clauses.length > 0) {
            query.where = {[Op.and]: clauses};
        }

        const {count, rows} = await agenda.findAndCountAll(query);
        return {
            total: count,
            page: Math.floor(offset / limit) + 1,
            limit,
            values: rows.map((item) => item.toResponse())
        };
    };

    agenda.getByIdOrSlug = async function (identifier, onlyActive = false) {
        const clauses = [
            {
                [Op.or]: [
                    {id: identifier},
                    {slug: identifier}
                ]
            }
        ];
        if (onlyActive) {
            clauses.push({status: contentStatuses.active});
        }
        return await agenda.findOne({
            where: {[Op.and]: clauses}
        });
    };

    return agenda;
}

module.exports = defineAgendaModel;
