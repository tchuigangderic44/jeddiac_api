const express = require("express");
const getUserModule = require("../modules/user.module");
const {
    parsePaginationHeaders,
    protectRoute,
    user
} = require("../middlewares");
const {errorHandler} = require("../utils/helpers");
const {hashedUploadHandler, imageValidator} = require("../utils/upload");

const avatarUpload = hashedUploadHandler({
    avatar: {
        folderPath: "public/uploads/avatars/",
        validator: imageValidator
    }
});

function getUserRouter(module) {
    const userModule = module || getUserModule({});
    const router = new express.Router();

    // ==========================================
    // AUTHENTICATED USER PROFILE (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.get(
        "/user/profile",
        protectRoute,
        user.ensureUserExists,
        errorHandler(userModule.getInformations)
    );

    router.get(
        "/user/infos",
        protectRoute,
        user.ensureUserExists,
        errorHandler(userModule.getInformations)
    );

    router.put(
        "/user/profile",
        protectRoute,
        user.ensureUserExists,
        avatarUpload.fields([{maxCount: 1, name: "avatar"}]),
        errorHandler(userModule.updateProfile)
    );

    router.post(
        "/user/update-profile",
        protectRoute,
        user.ensureUserExists,
        avatarUpload.fields([{maxCount: 1, name: "avatar"}]),
        errorHandler(userModule.updateProfile)
    );

    router.post(
        "/user/delete-avatar",
        protectRoute,
        user.ensureUserExists,
        errorHandler(userModule.deleteAvatar)
    );

    router.post(
        "/user/logout",
        protectRoute,
        user.ensureUserExists,
        errorHandler(userModule.logoutUser)
    );

    // ==========================================
    // PUBLIC ORGANIZATION DIRECTORY (VISITEURS)
    // ==========================================
    router.get(
        "/members",
        parsePaginationHeaders,
        errorHandler(userModule.getPublicMembers)
    );

    router.get(
        "/organization/members",
        parsePaginationHeaders,
        errorHandler(userModule.getPublicMembers)
    );

    return router;
}

module.exports = Object.freeze(getUserRouter);