const {sequelizeConnection} = require("../utils/db-connector.js");
const connection = sequelizeConnection();

const User = require("./user.js")(connection);
const Blacklist = require("./blacklist.js")(connection, User);
const Settings = require("./settings.js")(connection);
const News = require("./news.js")(connection);
const Agenda = require("./agenda.js")(connection);
const Mission = require("./mission.js")(connection);
const Article = require("./article.js")(connection);
const Contact = require("./contact.js")(connection);
const Newsletter = require("./newsletter.js")(connection);

// Associations
User.hasMany(News, {
    as: "News",
    foreignKey: "authorId"
});
News.belongsTo(User, {
    as: "Author",
    foreignKey: "authorId"
});

User.hasMany(Agenda, {
    as: "Events",
    foreignKey: "authorId"
});
Agenda.belongsTo(User, {
    as: "Author",
    foreignKey: "authorId"
});

User.hasMany(Article, {
    as: "Articles",
    foreignKey: "authorId"
});
Article.belongsTo(User, {
    as: "Author",
    foreignKey: "authorId"
});

module.exports = Object.freeze({
    Agenda,
    Article,
    Blacklist,
    connection,
    Contact,
    Mission,
    News,
    Newsletter,
    Settings,
    User
});