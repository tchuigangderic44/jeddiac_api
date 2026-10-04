/*jslint node*/
const {DataTypes} = require("sequelize");

async function up({context: queryInterface}) {
    const table = await queryInterface.describeTable("contacts");
    const columns = [
        {name: "type", type: DataTypes.STRING, defaultValue: "contact"},
        {name: "category", type: DataTypes.STRING},
        {name: "country", type: DataTypes.STRING},
        {name: "structureName", type: DataTypes.STRING}
    ];

    for (const col of columns) {
        if (!table[col.name]) {
            await queryInterface.addColumn("contacts", col.name, {
                type: col.type,
                allowNull: true,
                defaultValue: col.defaultValue !== undefined ? col.defaultValue : null
            });
        }
    }
}

async function down({context: queryInterface}) {
    const columnNames = ["type", "category", "country", "structureName"];
    for (const name of columnNames) {
        await queryInterface.removeColumn("contacts", name);
    }
}

module.exports = {up, down};
