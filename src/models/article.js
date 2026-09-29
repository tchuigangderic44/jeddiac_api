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
    authorId: DataTypes.UUID,
    category: DataTypes.STRING,
    content: required(DataTypes.TEXT),
    coverImage: DataTypes.STRING,
    id: uuidType(),
    publishedAt: {
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE
    },
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    status: enumType(contentStatuses, contentStatuses.active),
    summary: DataTypes.TEXT,
    tags: DataTypes.STRING,
    title: required(DataTypes.STRING),
    viewsCount: {
        defaultValue: 0,
        type: DataTypes.INTEGER
    }
};

const allowedProps = Object.keys(schema);

function defineArticleModel(connection) {
    const article = connection.define("article", schema, {
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

    article.prototype.toResponse = function () {
        let result = Object.assign({}, this.dataValues);
        if (result.coverImage) {
            result.coverImage = pathToURL(result.coverImage);
        }
        return propertiesPicker(result)(allowedProps);
    };

    article.getAll = async function ({
        category,
        limit = 10,
        offset = 0,
        search,
        status,
        tag
    }) {
        let query = {
            limit: parseInt(limit, 10) || 10,
            offset: parseInt(offset, 10) || 0,
            order: [["publishedAt", "DESC"], ["createdAt", "DESC"]],
            where: {}
        };

        const clauses = [];
        if (status) {
            clauses.push({status});
        }
        if (category) {
            clauses.push({category});
        }
        if (tag) {
            clauses.push({
                tags: {[Op.like]: "%" + tag + "%"}
            });
        }
        if (typeof search === "string" && search.trim().length > 0) {
            const pattern = "%" + search.trim() + "%";
            clauses.push({
                [Op.or]: [
                    {title: {[Op.like]: pattern}},
                    {summary: {[Op.like]: pattern}},
                    {content: {[Op.like]: pattern}},
                    {tags: {[Op.like]: pattern}}
                ]
            });
        }

        if (clauses.length > 0) {
            query.where = {[Op.and]: clauses};
        }

        const {count, rows} = await article.findAndCountAll(query);
        return {
            total: count,
            page: Math.floor(offset / limit) + 1,
            limit,
            values: rows.map((item) => item.toResponse())
        };
    };

    article.getByIdOrSlug = async function (identifier, onlyActive = false) {
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
        return await article.findOne({
            where: {[Op.and]: clauses}
        });
    };

    return article;
}

module.exports = defineArticleModel;
