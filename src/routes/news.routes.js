const express = require("express");
const getNewsModule = require("../modules/news.module");
const {errorHandler} = require("../utils/helpers");
const {onlyAdmin, parsePaginationHeaders, protectRoute} = require("../middlewares");
const {hashedUploadHandler, imageValidator} = require("../utils/upload");

const newsUpload = hashedUploadHandler({
    coverImage: {
        folderPath: "public/uploads/news/",
        validator: imageValidator
    },
    image: {
        folderPath: "public/uploads/news/",
        validator: imageValidator
    }
});

function getNewsRouter(module) {
    const newsModule = module || getNewsModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ROUTES (VISITEURS)
    // ==========================================
    router.get(
        "/news",
        parsePaginationHeaders,
        errorHandler(newsModule.getPublicNews)
    );

    router.get(
        "/news/:idOrSlug",
        errorHandler(newsModule.getPublicNewsDetails)
    );

    // ==========================================
    // ADMIN ROUTES (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.post(
        "/admin/news",
        protectRoute,
        onlyAdmin,
        newsUpload.fields([{maxCount: 1, name: "coverImage"}, {maxCount: 1, name: "image"}]),
        errorHandler(newsModule.createNews)
    );

    router.get(
        "/admin/news",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(newsModule.getAllNews)
    );

    router.get(
        "/admin/news/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(newsModule.getNewsById)
    );

    router.put(
        "/admin/news/:id",
        protectRoute,
        onlyAdmin,
        newsUpload.fields([{maxCount: 1, name: "coverImage"}, {maxCount: 1, name: "image"}]),
        errorHandler(newsModule.updateNews)
    );

    router.patch(
        "/admin/news/:id",
        protectRoute,
        onlyAdmin,
        newsUpload.fields([{maxCount: 1, name: "coverImage"}, {maxCount: 1, name: "image"}]),
        errorHandler(newsModule.updateNews)
    );

    router.patch(
        "/admin/news/:id/suspend",
        protectRoute,
        onlyAdmin,
        errorHandler(newsModule.suspendNews)
    );

    router.patch(
        "/admin/news/:id/deactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(newsModule.suspendNews)
    );

    router.patch(
        "/admin/news/:id/reactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(newsModule.reactivateNews)
    );

    router.patch(
        "/admin/news/:id/activate",
        protectRoute,
        onlyAdmin,
        errorHandler(newsModule.reactivateNews)
    );

    router.delete(
        "/admin/news/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(newsModule.deleteNews)
    );

    return router;
}

module.exports = Object.freeze(getNewsRouter);
