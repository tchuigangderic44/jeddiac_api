/*jslint node */
const {jwtWrapper, sendResponse} = require("../utils/helpers");
const {errors} = require("../utils/system-messages");
const userMiddleware = require("./user.middleware.js");
const {availableRoles, userStatuses} = require("../utils/config");
const {Blacklist, User} = require("../models");

let routeProtector;

function routeProtectionFactory(model) {
    const jwtHandler = jwtWrapper();

    async function isRevoked(payload) {
        let issuedAt;
        let minimumIat;
        const globalInvalidation = await model.getGlobalIat();
        const userInvalidation = await model.getUserIat(payload.id);
        minimumIat = Math.max(globalInvalidation ?? 0, userInvalidation ?? 0);
        if (Number.isFinite(minimumIat)) {
            minimumIat = new Date(minimumIat);
        }
        issuedAt = new Date(payload.iat * 1000);
        if (issuedAt < minimumIat) {
            return true;
        }
        return false;
    }

    function parseToken(headers) {
        let result = headers.authorization ?? "";
        result = result.trim().split(" ");
        return result.at(-1);
    }

    async function protectRoute(req, res, next) {
        const token = parseToken(req.headers);
        let payload;
        let revoked;
        if (!token || token.length === 0) {
            return sendResponse(res, errors.notAuthorized);
        }
        try {
            payload = await jwtHandler.verify(token);
            if (payload.valid === false) {
                return sendResponse(res, errors.tokenInvalid);
            }
            revoked = await isRevoked(payload.token);
            if (revoked) {
                return sendResponse(res, errors.notAuthorized);
            }
            req.user = payload;
            next();
        } catch (error) {
            return sendResponse(res, errors.notAuthorized, error);
        }
    }

    return Object.freeze({protectRoute});
}

function allowRoles(roles = []) {
    return function (req, res, next) {
        const role = req?.user?.token?.role;
        if (Array.isArray(roles) && roles.includes(role)) {
            next();
        } else {
            sendResponse(res, errors.forbiddenAccess);
        }
    };
}

const onlyAdmin = allowRoles([availableRoles.adminRole]);

function parsePaginationHeaders(req, ignore, next) {
    let {limit, page, skip} = req.query;
    limit = Number.parseInt(limit, 10);
    if (!Number.isFinite(limit) || limit <= 0) {
        limit = 10;
    }
    page = Number.parseInt(page, 10);
    if (!Number.isFinite(page) || page <= 0) {
        page = 1;
    }
    req.query.limit = limit;
    req.query.page = page;
    req.query.offset = (page - 1) * limit;
    next();
}

function validateRequiredFields(fields = []) {
    return function (req, res, next) {
        const missing = [];
        for (const field of fields) {
            const val = req.body?.[field];
            if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
                missing.push(field);
            }
        }
        if (missing.length > 0) {
            return sendResponse(res, errors.invalidValues, {
                missingFields: missing
            });
        }
        next();
    };
}

function validateEmail(field = "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return function (req, res, next) {
        const email = req.body?.[field];
        if (email && !emailRegex.test(email)) {
            return sendResponse(res, errors.invalidValues, {
                message: "Invalid email format"
            });
        }
        next();
    };
}

routeProtector = routeProtectionFactory(Blacklist);

module.exports = Object.freeze({
    allowRoles,
    onlyAdmin,
    parsePaginationHeaders,
    protectRoute: routeProtector.protectRoute,
    user: userMiddleware(User),
    validateEmail,
    validateRequiredFields
});