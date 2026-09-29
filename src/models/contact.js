/*jslint
node, nomen, this
*/
const {DataTypes, Op} = require("sequelize");
const {uuidType, enumType, required} = require("../utils/db-connector");
const {contactStatuses} = require("../utils/config");
const {propertiesPicker} = require("../utils/helpers");

const schema = {
    adminNotes: DataTypes.TEXT,
    email: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {isEmail: true}
    },
    id: uuidType(),
    isRead: {
        defaultValue: false,
        type: DataTypes.BOOLEAN
    },
    message: required(DataTypes.TEXT),
    name: required(DataTypes.STRING),
    phone: DataTypes.STRING,
    status: enumType(contactStatuses, contactStatuses.new),
    subject: required(DataTypes.STRING)
};

const allowedProps = Object.keys(schema);

function defineContactModel(connection) {
    const contact = connection.define("contact", schema, {
        paranoid: true
    });

    contact.prototype.toResponse = function () {
        return propertiesPicker(this.dataValues)(allowedProps);
    };

    contact.getAll = async function ({
        isRead,
        limit = 10,
        offset = 0,
        search,
        status
    }) {
        let query = {
            limit: parseInt(limit, 10) || 10,
            offset: parseInt(offset, 10) || 0,
            order: [["createdAt", "DESC"]],
            where: {}
        };

        const clauses = [];
        if (status) {
            clauses.push({status});
        }
        if (isRead !== undefined && isRead !== null) {
            clauses.push({isRead: isRead === true || isRead === "true"});
        }
        if (typeof search === "string" && search.trim().length > 0) {
            const pattern = "%" + search.trim() + "%";
            clauses.push({
                [Op.or]: [
                    {name: {[Op.like]: pattern}},
                    {email: {[Op.like]: pattern}},
                    {subject: {[Op.like]: pattern}},
                    {message: {[Op.like]: pattern}}
                ]
            });
        }

        if (clauses.length > 0) {
            query.where = {[Op.and]: clauses};
        }

        const {count, rows} = await contact.findAndCountAll(query);
        return {
            total: count,
            page: Math.floor(offset / limit) + 1,
            limit,
            values: rows.map((item) => item.toResponse())
        };
    };

    return contact;
}

module.exports = defineContactModel;
