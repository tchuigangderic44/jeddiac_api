/*jslint
node
*/
const models = require("../models");
const {availableRoles, userStatuses} = require("../utils/config");
const {hashPassword} = require("../utils/helpers");

const {
    admin_name = "Admin Organization",
    admin_email: email = "admin@organization.org",
    admin_password: password = "Admin@123456",
    admin_phone: phone = "+237600000000"
} = process.env;

const queryInterface = models.connection.getQueryInterface();

async function createTable(model) {
    if (!model) return;
    const tableName = model.getTableName();
    await queryInterface.createTable(tableName, model.getAttributes());
}

async function createTables() {
    await createTable(models.Settings);
    await createTable(models.Blacklist);
    await createTable(models.User);
    await createTable(models.News);
    await createTable(models.Agenda);
    await createTable(models.Mission);
    await createTable(models.Article);
    await createTable(models.Contact);
    await createTable(models.Newsletter);
}

async function dropTables() {
    const list = [
        models.Newsletter,
        models.Contact,
        models.Article,
        models.Mission,
        models.Agenda,
        models.News,
        models.Blacklist,
        models.User,
        models.Settings
    ];
    for (const model of list) {
        if (model) {
            try {
                await queryInterface.dropTable(model.getTableName());
            } catch (e) {
                // Ignore if doesn't exist
            }
        }
    }
}

async function createDefaultUsers() {
    const [firstName = "Admin", ...rest] = admin_name.split(" ");
    const lastName = rest.join(" ") || "Super";

    await models.User.create({
        bibliographie: "Administrateur principal du site de l'organisation",
        email,
        firstName,
        lastName,
        metier: "Directeur de publication",
        password,
        phone,
        role: availableRoles.adminRole,
        status: userStatuses.activated
    }, {ignoreDuplicates: true});
}

async function createDefaultSettings() {
    const {apiSettings} = require("../utils/config");
    const defaultSettings = Object.values(apiSettings).map(
        function settingMapper({value: type, defaultValues: value}) {
            return Object.freeze({type, value});
        }
    );
    await models.Settings.bulkCreate(defaultSettings, {ignoreDuplicates: true});
}

async function up() {
    await createTables();
    await createDefaultUsers();
    await createDefaultSettings();
}

async function down() {
    await dropTables();
}

module.exports = Object.freeze({down, up});