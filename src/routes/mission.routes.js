const express = require("express");
const getMissionModule = require("../modules/mission.module");
const {errorHandler} = require("../utils/helpers");
const {parsePaginationHeaders} = require("../middlewares");

function getMissionRouter(module) {
    const missionModule = module || getMissionModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ROUTES (VISITEURS)
    // ==========================================
    router.get(
        "/missions",
        parsePaginationHeaders,
        errorHandler(missionModule.getPublicMissions)
    );

    return router;
}

module.exports = Object.freeze(getMissionRouter);
