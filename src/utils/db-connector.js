/*jslint
node
*/
"use strict";
require("dotenv").config();
const {DataTypes, Sequelize} = require("sequelize");
const {getdbConfig} = require("./config.js");
const {mergableObject} = require("./helpers.js");

function sequelizeConnect({
    database,
    password = null,
    port,
    username
}) {
    const dialect = process.env.DB_DIALECT || "mariadb";
    if (dialect === "sqlite") {
        return new Sequelize({
            dialect: "sqlite",
            storage: process.env.DB_STORAGE || "./database.sqlite",
            logging: false
        });
    }

    let connection = new Sequelize(database, username, password, {
        dialect: "mariadb",
        host: process.env.HOST ?? "127.0.0.1",
        port,
        logging: false
    });
    return connection;
}

function uuidType() {
    return {
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID
    };
}

function enumType(set, initialValue, nullable = false) {
    let values = set;
    let defaultValue;
    const result = Object.create(mergableObject);
    result.type = DataTypes.ENUM;
    if (!Array.isArray(set)) {
        values = Object.values(set);
    }
    if (typeof initialValue === "string") {
        defaultValue = initialValue;
    }
    return result.with({
        allowNull: nullable,
        defaultValue,
        values
    });
}

function required(type, nullable = false) {
    const result = Object.create(mergableObject);
    return result.with({
        allowNull: nullable,
        type: type ?? DataTypes.STRING
    });
}

module.exports = Object.freeze({
    enumType,
    required,
    sequelizeConnection: (config = getdbConfig()) => sequelizeConnect(config),
    uuidType
});
