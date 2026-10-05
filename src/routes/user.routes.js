const express = require("express");
const getUserModule = require("../modules/user.module");
const {parsePaginationHeaders} = require("../middlewares");
const {errorHandler} = require("../utils/helpers");

function getUserRouter(module) {
    const userModule = module || getUserModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ORGANIZATION DIRECTORY (VISITEURS)
    // ==========================================
    router.get(
        "/members",
        parsePaginationHeaders,
        errorHandler(userModule.getPublicMembers)
    );

    return router;
}

module.exports = Object.freeze(getUserRouter);
