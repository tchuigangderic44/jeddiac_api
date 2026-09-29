const express = require("express");
const getMissionModule = require("../modules/mission.module");
const {errorHandler} = require("../utils/helpers");
const {onlyAdmin, parsePaginationHeaders, protectRoute} = require("../middlewares");
const {hashedUploadHandler, imageValidator} = require("../utils/upload");

const missionUpload = hashedUploadHandler({
    image: {
        folderPath: "public/uploads/missions/",
        validator: imageValidator
    }
});

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

    router.get(
        "/missions/:idOrSlug",
        errorHandler(missionModule.getPublicMissionDetails)
    );

    // ==========================================
    // ADMIN ROUTES (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.post(
        "/admin/missions",
        protectRoute,
        onlyAdmin,
        missionUpload.fields([{maxCount: 1, name: "image"}]),
        errorHandler(missionModule.createMission)
    );

    router.get(
        "/admin/missions",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(missionModule.getAllMissions)
    );

    router.get(
        "/admin/missions/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(missionModule.getMissionById)
    );

    router.put(
        "/admin/missions/:id",
        protectRoute,
        onlyAdmin,
        missionUpload.fields([{maxCount: 1, name: "image"}]),
        errorHandler(missionModule.updateMission)
    );

    router.patch(
        "/admin/missions/:id",
        protectRoute,
        onlyAdmin,
        missionUpload.fields([{maxCount: 1, name: "image"}]),
        errorHandler(missionModule.updateMission)
    );

    router.patch(
        "/admin/missions/:id/suspend",
        protectRoute,
        onlyAdmin,
        errorHandler(missionModule.suspendMission)
    );

    router.patch(
        "/admin/missions/:id/reactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(missionModule.reactivateMission)
    );

    router.delete(
        "/admin/missions/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(missionModule.deleteMission)
    );

    return router;
}

module.exports = Object.freeze(getMissionRouter);
