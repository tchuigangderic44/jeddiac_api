const express = require("express");
const getPodcastModule = require("../modules/podcast.module");
const {errorHandler} = require("../utils/helpers");
const {onlyAdmin, parsePaginationHeaders, protectRoute} = require("../middlewares");
const {hashedUploadHandler, imageValidator} = require("../utils/upload");

const podcastUpload = hashedUploadHandler({
    cover: {
        folderPath: "public/uploads/podcasts/",
        validator: imageValidator
    },
    coverImage: {
        folderPath: "public/uploads/podcasts/",
        validator: imageValidator
    }
});

function getPodcastRouter(module) {
    const podcastModule = module || getPodcastModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ROUTES (VISITEURS)
    // ==========================================
    router.get(
        "/podcasts",
        parsePaginationHeaders,
        errorHandler(podcastModule.getPublicPodcasts)
    );

    router.get(
        "/podcasts/:idOrSlug",
        errorHandler(podcastModule.getPublicPodcastDetails)
    );

    // ==========================================
    // ADMIN ROUTES (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.post(
        "/admin/podcasts",
        protectRoute,
        onlyAdmin,
        podcastUpload.fields([{maxCount: 1, name: "cover"}, {maxCount: 1, name: "coverImage"}]),
        errorHandler(podcastModule.createPodcast)
    );

    router.get(
        "/admin/podcasts",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(podcastModule.getAllPodcasts)
    );

    router.get(
        "/admin/podcasts/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(podcastModule.getPodcastById)
    );

    router.put(
        "/admin/podcasts/:id",
        protectRoute,
        onlyAdmin,
        podcastUpload.fields([{maxCount: 1, name: "cover"}, {maxCount: 1, name: "coverImage"}]),
        errorHandler(podcastModule.updatePodcast)
    );

    router.patch(
        "/admin/podcasts/:id",
        protectRoute,
        onlyAdmin,
        podcastUpload.fields([{maxCount: 1, name: "cover"}, {maxCount: 1, name: "coverImage"}]),
        errorHandler(podcastModule.updatePodcast)
    );

    router.patch(
        "/admin/podcasts/:id/suspend",
        protectRoute,
        onlyAdmin,
        errorHandler(podcastModule.suspendPodcast)
    );

    router.patch(
        "/admin/podcasts/:id/deactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(podcastModule.suspendPodcast)
    );

    router.patch(
        "/admin/podcasts/:id/reactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(podcastModule.reactivatePodcast)
    );

    router.patch(
        "/admin/podcasts/:id/activate",
        protectRoute,
        onlyAdmin,
        errorHandler(podcastModule.reactivatePodcast)
    );

    router.delete(
        "/admin/podcasts/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(podcastModule.deletePodcast)
    );

    return router;
}

module.exports = Object.freeze(getPodcastRouter);
