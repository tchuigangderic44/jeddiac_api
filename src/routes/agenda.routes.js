const express = require("express");
const getAgendaModule = require("../modules/agenda.module");
const {errorHandler} = require("../utils/helpers");
const {onlyAdmin, parsePaginationHeaders, protectRoute} = require("../middlewares");
const {hashedUploadHandler, imageValidator} = require("../utils/upload");

const agendaUpload = hashedUploadHandler({
    coverImage: {
        folderPath: "public/uploads/agenda/",
        validator: imageValidator
    }
});

function getAgendaRouter(module) {
    const agendaModule = module || getAgendaModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ROUTES (VISITEURS)
    // ==========================================
    router.get(
        "/agenda",
        parsePaginationHeaders,
        errorHandler(agendaModule.getPublicAgenda)
    );

    router.get(
        "/agenda/:idOrSlug",
        errorHandler(agendaModule.getPublicAgendaDetails)
    );

    // ==========================================
    // ADMIN ROUTES (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.post(
        "/admin/agenda",
        protectRoute,
        onlyAdmin,
        agendaUpload.fields([{maxCount: 1, name: "coverImage"}]),
        errorHandler(agendaModule.createEvent)
    );

    router.get(
        "/admin/agenda",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(agendaModule.getAllEvents)
    );

    router.get(
        "/admin/agenda/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(agendaModule.getEventById)
    );

    router.put(
        "/admin/agenda/:id",
        protectRoute,
        onlyAdmin,
        agendaUpload.fields([{maxCount: 1, name: "coverImage"}]),
        errorHandler(agendaModule.updateEvent)
    );

    router.patch(
        "/admin/agenda/:id",
        protectRoute,
        onlyAdmin,
        agendaUpload.fields([{maxCount: 1, name: "coverImage"}]),
        errorHandler(agendaModule.updateEvent)
    );

    router.patch(
        "/admin/agenda/:id/suspend",
        protectRoute,
        onlyAdmin,
        errorHandler(agendaModule.suspendEvent)
    );

    router.patch(
        "/admin/agenda/:id/reactivate",
        protectRoute,
        onlyAdmin,
        errorHandler(agendaModule.reactivateEvent)
    );

    router.delete(
        "/admin/agenda/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(agendaModule.deleteEvent)
    );

    return router;
}

module.exports = Object.freeze(getAgendaRouter);
