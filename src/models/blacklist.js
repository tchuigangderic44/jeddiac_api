const {DataTypes} = require("sequelize");

function defineBlackListModel(connection, userModel) {
    const globalId = "__global__identifier";
    const schema = {
        minimumIat: DataTypes.DATE,
        userId: {
            allowNull: false,
            type: DataTypes.UUID,
            unique: true
        }
    };
    const blacklist = connection.define("blacklist", schema);

    userModel.invalidate = async function (userId, minimumIat) {
        const existing = await blacklist.findOne({where: {userId}});
        if (existing) {
            existing.minimumIat = minimumIat;
            return await existing.save();
        }
        return await blacklist.create({minimumIat, userId});
    };

    blacklist.getGlobalIat = async function () {
        let record = await blacklist.findOne({where: {userId: globalId}});
        return record?.minimumIat;
    };

    blacklist.getUserIat = async function (userId) {
        let record = await blacklist.findOne({where: {userId}});
        return record?.minimumIat;
    };

    return blacklist;
}

module.exports = Object.freeze(defineBlackListModel);