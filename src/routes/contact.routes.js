const express = require("express");
const getContactModule = require("../modules/contact.module");
const {errorHandler} = require("../utils/helpers");
const {
    onlyAdmin,
    parsePaginationHeaders,
    protectRoute,
    validateEmail,
    validateRequiredFields
} = require("../middlewares");

function getContactRouter(module) {
    const contactModule = module || getContactModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ROUTE (FORMULAIRE DE CONTACT)
    // Sécurisé par validateRequiredFields et validateEmail
    // ==========================================
    router.post(
        "/contact",
        validateRequiredFields(["name", "email", "subject", "message"]),
        validateEmail("email"),
        errorHandler(contactModule.submitContactForm)
    );

    // ==========================================
    // ADMIN ROUTES (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.get(
        "/admin/contacts",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(contactModule.getContactMessages)
    );

    router.get(
        "/admin/contacts/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(contactModule.getContactMessageById)
    );

    router.patch(
        "/admin/contacts/:id/status",
        protectRoute,
        onlyAdmin,
        errorHandler(contactModule.updateContactStatus)
    );

    router.delete(
        "/admin/contacts/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(contactModule.deleteContactMessage)
    );

    return router;
}

module.exports = Object.freeze(getContactRouter);
