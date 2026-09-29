/*jslint node*/
const {sendResponse} = require("../utils/helpers");
const {errors} = require("../utils/system-messages.js");
const {roleList, availableRoles} = require("../utils/config");

function getUserMiddleware(model) {
    async function ensureUserExists(req, res, next) {
        const id = req?.user?.token?.id;
        if (!id) {
            return sendResponse(res, errors.notAuthorized);
        }
        const userData = await model.findOne({where: {id}});
        if (userData === null) {
            return sendResponse(res, errors.nonexistingUser);
        }
        req.userData = userData;
        next();
    }

    function validateUserCreation(req, res, next) {
        const {email, firstName, lastName, role} = req.body;
        if (!email || !firstName || !lastName) {
            return sendResponse(res, errors.invalidValues, {
                required: ["email", "firstName", "lastName"]
            });
        }
        if (role && !roleList.includes(role)) {
            return sendResponse(res, errors.invalidValues, {
                message: "Role must be one of: " + roleList.join(", ")
            });
        }
        next();
    }

    return Object.freeze({
        ensureUserExists,
        validateUserCreation
    });
}

module.exports = getUserMiddleware;
