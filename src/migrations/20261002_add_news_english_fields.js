/*jslint node*/
const {DataTypes} = require("sequelize");

async function up({context: queryInterface}) {
    const table = await queryInterface.describeTable("news");
    if (!table.titleEn) {
        await queryInterface.addColumn("news", "titleEn", {
            type: DataTypes.STRING,
            allowNull: true
        });
    }
    if (!table.summaryEn) {
        await queryInterface.addColumn("news", "summaryEn", {
            type: DataTypes.TEXT,
            allowNull: true
        });
    }
    if (!table.contentEn) {
        await queryInterface.addColumn("news", "contentEn", {
            type: DataTypes.TEXT,
            allowNull: true
        });
    }
    if (!table.categoryEn) {
        await queryInterface.addColumn("news", "categoryEn", {
            type: DataTypes.STRING,
            allowNull: true
        });
    }
    if (!table.tagsEn) {
        await queryInterface.addColumn("news", "tagsEn", {
            type: DataTypes.STRING,
            allowNull: true
        });
    }
}

async function down({context: queryInterface}) {
    await queryInterface.removeColumn("news", "titleEn");
    await queryInterface.removeColumn("news", "summaryEn");
    await queryInterface.removeColumn("news", "contentEn");
    await queryInterface.removeColumn("news", "categoryEn");
    await queryInterface.removeColumn("news", "tagsEn");
}

module.exports = {up, down};
