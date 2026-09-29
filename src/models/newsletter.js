/*jslint
node, nomen, this
*/
const {DataTypes, Op} = require("sequelize");
const {uuidType, enumType} = require("../utils/db-connector");
const {newsletterStatuses} = require("../utils/config");
const {propertiesPicker} = require("../utils/helpers");

const schema = {
    email: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
        validate: {isEmail: true}
    },
    id: uuidType(),
    status: enumType(newsletterStatuses, newsletterStatuses.subscribed),
    subscribedAt: {
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE
    },
    unsubscribedAt: DataTypes.DATE
};

const allowedProps = Object.keys(schema);

function defineNewsletterModel(connection) {
    const newsletter = connection.define("newsletter", schema, {
        paranoid: true
    });

    newsletter.prototype.toResponse = function () {
        return propertiesPicker(this.dataValues)(allowedProps);
    };

    newsletter.getAll = async function ({
        limit = 20,
        offset = 0,
        search,
        status
    }) {
        let query = {
            limit: parseInt(limit, 10) || 20,
            offset: parseInt(offset, 10) || 0,
            order: [["subscribedAt", "DESC"]],
            where: {}
        };

        const clauses = [];
        if (status) {
            clauses.push({status});
        }
        if (typeof search === "string" && search.trim().length > 0) {
            clauses.push({
                email: {[Op.like]: "%" + search.trim() + "%"}
            });
        }

        if (clauses.length > 0) {
            query.where = {[Op.and]: clauses};
        }

        const {count, rows} = await newsletter.findAndCountAll(query);
        return {
            total: count,
            page: Math.floor(offset / limit) + 1,
            limit,
            values: rows.map((item) => item.toResponse())
        };
    };

    return newsletter;
}

module.exports = defineNewsletterModel;
