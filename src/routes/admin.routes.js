const express = require("express");
const getAdminModule = require("../modules/admin.module");
const {errorHandler} = require("../utils/helpers");
const {onlyAdmin, parsePaginationHeaders, protectRoute} = require("../middlewares");
const {hashedUploadHandler, imageValidator} = require("../utils/upload");

const avatarUpload = hashedUploadHandler({
    avatar: {
        folderPath: "public/uploads/avatars/",
        validator: imageValidator
    }
});

function getAdminRouter(module) {
    const adminModule = module || getAdminModule({});
    const router = new express.Router();

    // ==========================================
    // ADMIN USER MANAGEMENT (TOUTES PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    // ADMIN DASHBOARD & OVERVIEW STATS
    // ==========================================
    router.get(
        "/admin/stats",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.getStats)
    );

    router.get(
        "/overview-stats",
        errorHandler(adminModule.getPublicStats)
    );

    router.put(
        "/admin/overview-stats",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.updatePublicStats)
    );

    router.patch(
        "/admin/overview-stats",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.updatePublicStats)
    );

    router.post(
        "/admin/users",
        protectRoute,
        onlyAdmin,
        avatarUpload.fields([{maxCount: 1, name: "avatar"}]),
        errorHandler(adminModule.createUser)
    );

    router.get(
        "/admin/users",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(adminModule.getUsers)
    );

    router.get(
        "/admin/users/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.getUserById)
    );

    router.put(
        "/admin/users/:id",
        protectRoute,
        onlyAdmin,
        avatarUpload.fields([{maxCount: 1, name: "avatar"}]),
        errorHandler(adminModule.updateUser)
    );

    router.patch(
        "/admin/users/:id",
        protectRoute,
        onlyAdmin,
        avatarUpload.fields([{maxCount: 1, name: "avatar"}]),
        errorHandler(adminModule.updateUser)
    );

    router.patch(
        "/admin/users/:id/activate",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.activateUser)
    );

    router.patch(
        "/admin/users/:id/deactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.deactivateUser)
    );

    router.delete(
        "/admin/users/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.deleteUser)
    );

    // ==========================================
    // RETRO-COMPATIBILITÉ DES ROUTES ADMIN
    // ==========================================
    router.get(
        "/admin/user-all",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(adminModule.getUsers)
    );

    router.post(
        "/admin/block-user",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.deactivateUser)
    );

    router.post(
        "/admin/activate-user",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.activateUser)
    );

    router.post(
        "/admin/logout",
        protectRoute,
        onlyAdmin,
        errorHandler(adminModule.logoutUser)
    );

    return router;
}

module.exports = Object.freeze(getAdminRouter);