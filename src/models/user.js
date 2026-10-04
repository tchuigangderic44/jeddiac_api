/*jslint
node, nomen, this
*/
const fs = require("fs");
const {DataTypes, Op, col, fn, where} = require("sequelize");
const {
    fileExists,
    hashPassword,
    pathToURL,
    propertiesPicker
} = require("../utils/helpers");
const {
    availableRoles,
    roleList,
    userStatuses
} = require("../utils/config");
const {enumType, required, uuidType} = require("../utils/db-connector");
const types = require("./helper");

const schema = {
    avatar: DataTypes.STRING,
    bibliographie: DataTypes.TEXT,
    conseil: DataTypes.TEXT,
    email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {isEmail: true}
    },
    firstName: DataTypes.STRING,
    id: uuidType(),
    lang: required(DataTypes.STRING, true).with({defaultValue: "fr"}),
    lastName: DataTypes.STRING,
    linkedin: DataTypes.STRING,
    metier: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    role: enumType(roleList, availableRoles.memberRole),
    status: enumType(userStatuses, userStatuses.activated),
    category: DataTypes.STRING,
    pole: DataTypes.STRING,
    poleEn: DataTypes.STRING,
    metierEn: DataTypes.STRING,
    location: DataTypes.STRING,
    country: DataTypes.STRING,
    bibliographieEn: DataTypes.TEXT,
    conseilEn: DataTypes.TEXT,
    contributions: DataTypes.TEXT,
    contributionsEn: DataTypes.TEXT
};

const excludedProps = ["password"];
const publicProps = [
    "id",
    "firstName",
    "lastName",
    "role",
    "category",
    "metier",
    "metierEn",
    "pole",
    "poleEn",
    "location",
    "country",
    "bibliographie",
    "bibliographieEn",
    "conseil",
    "conseilEn",
    "contributions",
    "contributionsEn",
    "avatar",
    "linkedin",
    "email",
    "phone"
];

function defineUserModel(connection) {
    const allowedProps = Object.keys(schema).filter(
        (key) => !excludedProps.includes(key)
    );
    const genericProps = Object.keys(schema).filter(
        (prop) => prop !== "id" && prop !== "password"
    );

    const user = connection.define("user", schema, {
        hooks: {
            beforeCreate: async function (record) {
                let {password} = record.dataValues;
                if (password !== undefined && password !== null && password !== "") {
                    record.dataValues.password = await hashPassword(password);
                }
            },
            beforeUpdate: async function (record) {
                let {password} = record.dataValues;
                const {
                    dataValues: current,
                    _previousDataValues: previous = {},
                    _changed: updates = new Set()
                } = record;

                if (updates.has("password") && password !== undefined && password !== null && password !== "") {
                    current.password = await hashPassword(password);
                }

                if (updates.has("avatar") && previous.avatar) {
                    const previousAvatarExists = await fileExists(previous.avatar);
                    if (previousAvatarExists) {
                        fs.unlink(previous.avatar, () => {});
                    }
                }
            }
        },
        paranoid: true
    });

    user.prototype.toResponse = function () {
        let data = this.dataValues;
        let result = {};
        Object.assign(result, data);
        if (result.avatar) {
            result.avatar = pathToURL(result.avatar);
        }
        result = propertiesPicker(result)(allowedProps);
        if (data.deletedAt !== null && data.deletedAt !== undefined) {
            result.deleted = true;
        }
        return result;
    };

    user.prototype.toPublicResponse = function () {
        let result = Object.assign({}, this.dataValues);
        if (result.avatar) {
            result.avatar = pathToURL(result.avatar);
        }
        return propertiesPicker(result)(publicProps);
    };

    user.getById = async function (id) {
        return await user.findOne({where: {id}});
    };

    user.getAll = async function ({
        limit = 10,
        offset = 0,
        search,
        role,
        status
    }) {
        let query = {
            limit: parseInt(limit, 10) || 10,
            offset: parseInt(offset, 10) || 0,
            order: [["createdAt", "DESC"]],
            where: {}
        };

        const clauses = [];
        if (role) {
            clauses.push({role});
        }
        if (status) {
            clauses.push({status});
        }
        if (typeof search === "string" && search.trim().length > 0) {
            const pattern = "%" + search.trim() + "%";
            clauses.push({
                [Op.or]: [
                    {firstName: {[Op.like]: pattern}},
                    {lastName: {[Op.like]: pattern}},
                    {email: {[Op.like]: pattern}},
                    {metier: {[Op.like]: pattern}},
                    {metierEn: {[Op.like]: pattern}},
                    {pole: {[Op.like]: pattern}},
                    {poleEn: {[Op.like]: pattern}},
                    {category: {[Op.like]: pattern}},
                    {location: {[Op.like]: pattern}},
                    {country: {[Op.like]: pattern}}
                ]
            });
        }

        if (clauses.length > 0) {
            query.where = {[Op.and]: clauses};
        }

        const {count, rows} = await user.findAndCountAll(query);
        return {
            total: count,
            page: Math.floor(offset / limit) + 1,
            limit,
            values: rows.map((item) => item.toResponse())
        };
    };

    user.getPublicMembers = async function ({role, search, limit = 50, offset = 0}) {
        const query = {
            limit: parseInt(limit, 10) || 50,
            offset: parseInt(offset, 10) || 0,
            order: [["lastName", "ASC"], ["firstName", "ASC"]],
            where: {
                status: userStatuses.activated
            }
        };

        const clauses = [{status: userStatuses.activated}];
        if (role) {
            clauses.push({role});
        } else {
            // Exclude pure admin from public directory unless specified
            clauses.push({
                role: {
                    [Op.ne]: availableRoles.adminRole
                }
            });
        }

        if (typeof search === "string" && search.trim().length > 0) {
            const pattern = "%" + search.trim() + "%";
            clauses.push({
                [Op.or]: [
                    {firstName: {[Op.like]: pattern}},
                    {lastName: {[Op.like]: pattern}},
                    {metier: {[Op.like]: pattern}},
                    {metierEn: {[Op.like]: pattern}},
                    {pole: {[Op.like]: pattern}},
                    {poleEn: {[Op.like]: pattern}},
                    {category: {[Op.like]: pattern}},
                    {location: {[Op.like]: pattern}},
                    {country: {[Op.like]: pattern}}
                ]
            });
        }

        query.where = {[Op.and]: clauses};
        const {count, rows} = await user.findAndCountAll(query);
        return {
            total: count,
            values: rows.map((item) => item.toPublicResponse())
        };
    };

    user.genericProps = genericProps;
    user.statuses = userStatuses;
    user.roles = availableRoles;
    return user;
}

module.exports = defineUserModel;