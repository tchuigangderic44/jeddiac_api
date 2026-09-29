/*jslint node*/
require("dotenv").config();
const process = require("process");
const {SequelizeStorage, Umzug} = require("umzug");
const {buildServer} = require("./src");
const buildRoutes = require("./src/routes");
const {connection, Settings} = require("./src/models");
const getSocketManager = require("./src/utils/socket-manager");

const umzug = new Umzug({
    context: connection.getQueryInterface(),
    logger: console,
    migrations: {glob: "src/migrations/*.js"},
    storage: new SequelizeStorage({sequelize: connection})
});
const httpServer = buildServer(buildRoutes({}));
const socketServer = getSocketManager({
    httpServer
});
const createMailer = require("./src/utils/email-handler");
const mailer = createMailer();

function format(error) {
    const result = Object.create(null);
    result.name = error.name;
    result.stackTrace = error.stack;
    result.message = error.message;
    return Object.freeze(result);
}

(async function () {
    try {
        await umzug.up();
        const settings = await Settings.getAll();
        settings.forEach(function ({type, value}) {
            Settings.emitEvent("settings-update", {type, value});
        });
    } catch (e) {
        console.error("Initialization error:", e);
    }
}());

process.on("uncaughtException", function (error) {
    const {admin_email, NODE_ENV} = process.env;
    const text = JSON.stringify(format(error), null, 4);
    const mailTemplate = mailer.getEmailTemplate({
        content: "<code>" + text + "</code>"
    });
    socketServer.close();
    httpServer.close();
    if (NODE_ENV === "production" && admin_email) {
        mailer.sendEmail({
            callback: mailer.handleResponse,
            html: mailTemplate(),
            text,
            to: admin_email
        });
    } else {
        console.error(error);
    }
});
