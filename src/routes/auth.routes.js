const express = require("express");
const getAuthModule = require("../modules/auth.module");
const {errorHandler} = require("../utils/helpers");
const {
    protectRoute,
    validateEmail,
    validateRequiredFields
} = require("../middlewares");

function getAuthRouter(authModule) {
    const routeModule = authModule || getAuthModule({});
    const router = new express.Router();

    // ==========================================
    // AUTHENTICATION ROUTES (SÉCURISÉES PAR MIDDLEWARES)
    // ==========================================

    // Admin login
    router.post(
        "/auth/admin/login",
        validateRequiredFields(["password"]),
        errorHandler(routeModule.adminLogin)
    );

    // General user / member / partner login
    router.post(
        "/auth/login",
        validateRequiredFields(["password"]),
        errorHandler(routeModule.loginUser)
    );

    // Legacy client/login route alias
    router.post(
        "/auth/client/login",
        validateRequiredFields(["password"]),
        errorHandler(routeModule.loginUser)
    );

    // Register new user
    router.post(
        "/auth/register",
        validateRequiredFields(["firstName", "lastName", "email", "password"]),
        validateEmail("email"),
        errorHandler(routeModule.signup)
    );
    router.post(
        "/auth/new-user",
        validateRequiredFields(["firstName", "lastName", "email", "password"]),
        validateEmail("email"),
        errorHandler(routeModule.signup)
    );

    // Authenticated password change (protégé par protectRoute)
    router.post(
        "/auth/change-password",
        protectRoute,
        validateRequiredFields(["oldPassword", "newPassword"]),
        errorHandler(routeModule.changePassword)
    );

    return router;
}

module.exports = Object.freeze(getAuthRouter);