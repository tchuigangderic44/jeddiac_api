const express = require("express");
const getArticleModule = require("../modules/article.module");
const {errorHandler} = require("../utils/helpers");
const {onlyAdmin, parsePaginationHeaders, protectRoute} = require("../middlewares");
const {hashedUploadHandler, imageValidator} = require("../utils/upload");

const articleUpload = hashedUploadHandler({
    coverImage: {
        folderPath: "public/uploads/articles/",
        validator: imageValidator
    }
});

function getArticleRouter(module) {
    const articleModule = module || getArticleModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ROUTES (VISITEURS)
    // ==========================================
    router.get(
        "/articles",
        parsePaginationHeaders,
        errorHandler(articleModule.getPublicArticles)
    );

    router.get(
        "/articles/:idOrSlug",
        errorHandler(articleModule.getPublicArticleDetails)
    );

    // ==========================================
    // ADMIN ROUTES (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.post(
        "/admin/articles",
        protectRoute,
        onlyAdmin,
        articleUpload.fields([{maxCount: 1, name: "coverImage"}]),
        errorHandler(articleModule.createArticle)
    );

    router.get(
        "/admin/articles",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(articleModule.getAllArticles)
    );

    router.get(
        "/admin/articles/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(articleModule.getArticleById)
    );

    router.put(
        "/admin/articles/:id",
        protectRoute,
        onlyAdmin,
        articleUpload.fields([{maxCount: 1, name: "coverImage"}]),
        errorHandler(articleModule.updateArticle)
    );

    router.patch(
        "/admin/articles/:id",
        protectRoute,
        onlyAdmin,
        articleUpload.fields([{maxCount: 1, name: "coverImage"}]),
        errorHandler(articleModule.updateArticle)
    );

    router.patch(
        "/admin/articles/:id/suspend",
        protectRoute,
        onlyAdmin,
        errorHandler(articleModule.suspendArticle)
    );

    router.patch(
        "/admin/articles/:id/reactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(articleModule.reactivateArticle)
    );

    router.delete(
        "/admin/articles/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(articleModule.deleteArticle)
    );

    return router;
}

module.exports = Object.freeze(getArticleRouter);
