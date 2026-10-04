/*jslint node*/
const {DataTypes} = require("sequelize");

async function up({context: queryInterface}) {
    const table = await queryInterface.describeTable("users");
    const columns = [
        {name: "metierEn", type: DataTypes.STRING},
        {name: "category", type: DataTypes.STRING},
        {name: "pole", type: DataTypes.STRING},
        {name: "poleEn", type: DataTypes.STRING},
        {name: "location", type: DataTypes.STRING},
        {name: "country", type: DataTypes.STRING},
        {name: "bibliographieEn", type: DataTypes.TEXT},
        {name: "conseilEn", type: DataTypes.TEXT},
        {name: "contributions", type: DataTypes.TEXT},
        {name: "contributionsEn", type: DataTypes.TEXT}
    ];

    for (const col of columns) {
        if (!table[col.name]) {
            await queryInterface.addColumn("users", col.name, {
                type: col.type,
                allowNull: true
            });
        }
    }
}

async function down({context: queryInterface}) {
    const columnNames = [
        "metierEn",
        "category",
        "pole",
        "poleEn",
        "location",
        "country",
        "bibliographieEn",
        "conseilEn",
        "contributions",
        "contributionsEn"
    ];
    for (const name of columnNames) {
        await queryInterface.removeColumn("users", name);
    }
}

module.exports = {up, down};
