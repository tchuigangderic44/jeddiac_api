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
    audioUrl: DataTypes.STRING,
    author: DataTypes.STRING,
    authorEn: DataTypes.STRING,
    authorId: DataTypes.UUID,
    cover: DataTypes.STRING,
    description: DataTypes.TEXT,
    descriptionEn: DataTypes.TEXT,
    duration: DataTypes.STRING,
    id: uuidType(),
    order: {
        defaultValue: 0,
        type: DataTypes.INTEGER
    },
    publishedAt: {
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE
    },
    series: DataTypes.STRING,
    seriesEn: DataTypes.STRING,
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    status: enumType(contentStatuses, contentStatuses.active),
    title: required(DataTypes.STRING),
    titleEn: DataTypes.STRING,
    topic: DataTypes.STRING,
    topicEn: DataTypes.STRING
};

const allowedProps = Object.keys(schema).concat(["coverImage", "createdAt", "updatedAt"]);

function definePodcastModel(connection) {
    const podcast = connection.define("podcast", schema, {
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

                if (updates.has("cover") && previous.cover && previous.cover.startsWith("public/")) {
                    const previousImageExists = await fileExists(previous.cover);
                    if (previousImageExists) {
                        fs.unlink(previous.cover, () => {});
                    }
                }
            }
        },
        paranoid: true
    });

    podcast.prototype.toResponse = function () {
        let result = Object.assign({}, this.dataValues);
        if (result.cover && result.cover.startsWith("public/")) {
            result.cover = pathToURL(result.cover);
        }
        if (result.audioUrl && result.audioUrl.startsWith("public/")) {
            result.audioUrl = pathToURL(result.audioUrl);
        }
        result.coverImage = result.cover;
        return propertiesPicker(result)(allowedProps);
    };

    podcast.getAll = async function ({
        limit = 10,
        offset = 0,
        order = [["order", "ASC"], ["publishedAt", "DESC"], ["createdAt", "DESC"]],
        search,
        status,
        topic
    }) {
        let query = {
            limit: parseInt(limit, 10) || 10,
            offset: parseInt(offset, 10) || 0,
            order,
            where: {}
        };

        const clauses = [];
        if (status) {
            clauses.push({status});
        }
        if (topic) {
            clauses.push({
                [Op.or]: [
                    {topic: {[Op.like]: "%" + topic + "%"}},
                    {topicEn: {[Op.like]: "%" + topic + "%"}}
                ]
            });
        }
        if (typeof search === "string" && search.trim().length > 0) {
            const pattern = "%" + search.trim() + "%";
            clauses.push({
                [Op.or]: [
                    {title: {[Op.like]: pattern}},
                    {titleEn: {[Op.like]: pattern}},
                    {series: {[Op.like]: pattern}},
                    {seriesEn: {[Op.like]: pattern}},
                    {author: {[Op.like]: pattern}},
                    {authorEn: {[Op.like]: pattern}},
                    {topic: {[Op.like]: pattern}},
                    {topicEn: {[Op.like]: pattern}},
                    {description: {[Op.like]: pattern}},
                    {descriptionEn: {[Op.like]: pattern}}
                ]
            });
        }

        if (clauses.length > 0) {
            query.where = {[Op.and]: clauses};
        }

        const {count, rows} = await podcast.findAndCountAll(query);
        return {
            total: count,
            page: Math.floor(offset / limit) + 1,
            limit,
            values: rows.map((item) => item.toResponse())
        };
    };

    podcast.getByIdOrSlug = async function (identifier, onlyActive = false) {
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
        return await podcast.findOne({
            where: {[Op.and]: clauses}
        });
    };

    return podcast;
}

module.exports = definePodcastModel;
