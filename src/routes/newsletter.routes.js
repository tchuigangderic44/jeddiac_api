const express = require("express");
const getNewsletterModule = require("../modules/newsletter.module");
const {errorHandler} = require("../utils/helpers");
const {
    onlyAdmin,
    parsePaginationHeaders,
    protectRoute,
    validateEmail,
    validateRequiredFields
} = require("../middlewares");

function getNewsletterRouter(module) {
    const newsletterModule = module || getNewsletterModule({});
    const router = new express.Router();

    // ==========================================
    // PUBLIC ROUTES (VISITEURS)
    // Sécurisées par validateRequiredFields et validateEmail
    // ==========================================
    router.post(
        "/newsletter/subscribe",
        validateRequiredFields(["email"]),
        validateEmail("email"),
        errorHandler(newsletterModule.subscribeNewsletter)
    );

    router.post(
        "/newsletter/unsubscribe",
        validateRequiredFields(["email"]),
        validateEmail("email"),
        errorHandler(newsletterModule.unsubscribeNewsletter)
    );

    // ==========================================
    // ADMIN ROUTES (PROTÉGÉES PAR MIDDLEWARES)
    // ==========================================
    router.get(
        "/admin/newsletter/subscribers",
        protectRoute,
        onlyAdmin,
        parsePaginationHeaders,
        errorHandler(newsletterModule.getNewsletterSubscribers)
    );

    router.delete(
        "/admin/newsletter/subscribers/:id",
        protectRoute,
        onlyAdmin,
        errorHandler(newsletterModule.deleteNewsletterSubscriber)
    );

    return router;
}

module.exports = Object.freeze(getNewsletterRouter);
