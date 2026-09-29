const {User} = require("../models");
const {errors} = require("../utils/system-messages");
const {availableRoles, userStatuses} = require("../utils/config");
const {
    comparePassword,
    jwtWrapper,
    sendResponse
} = require("../utils/helpers");

function getAuthModule({
    model,
    tokenService
} = {}) {
    const authModel = model || User;
    const authTokenService = tokenService || jwtWrapper;

    function allowedRoles(roles = []) {
        return function (req, res, next) {
            const {user} = req;
            const userRole = user?.token?.role || user?.role;
            if (roles.includes(userRole)) {
                next();
            } else {
                return sendResponse(res, errors.forbiddenAccess);
            }
        };
    }

    async function changePassword(req, res) {
        const {id} = req.user.token;
        const {newPassword, oldPassword} = req.body;
        if (!newPassword || !oldPassword) {
            return sendResponse(res, errors.invalidValues, {
                required: ["oldPassword", "newPassword"]
            });
        }

        const currentUser = await authModel.findOne({where: {id}});
        if (!currentUser) {
            return sendResponse(res, errors.nonexistingUser);
        }

        const isValidPassword = await comparePassword(
            oldPassword,
            currentUser.password
        );
        if (!isValidPassword) {
            return sendResponse(res, errors.invalidCredentials);
        }

        currentUser.password = newPassword;
        await currentUser.save();
        res.status(200).json({
            message: {
                en: "Password changed successfully",
                fr: "Mot de passe modifié avec succès"
            },
            updated: true
        });
    }

    async function handleAuthSuccess(res, user) {
        const tokenFactory = authTokenService();
        const token = tokenFactory.sign({
            email: user.email,
            firstName: user.firstName,
            id: user.id,
            lastName: user.lastName,
            role: user.role
        });

        res.status(200).json({
            token,
            user: user.toResponse(),
            valid: true
        });
    }

    async function loginUser(req, res) {
        const {email, password, phone, phoneNumber} = req.body;
        const searchIdentifier = email || phone || phoneNumber;

        if (!searchIdentifier || !password) {
            return sendResponse(res, errors.invalidCredentials);
        }

        const whereClause = email ? {email} : {phone: searchIdentifier};
        const currentUser = await authModel.findOne({where: whereClause});

        if (currentUser === null) {
            return sendResponse(res, errors.invalidCredentials);
        }

        if (currentUser.status !== userStatuses.activated) {
            return sendResponse(res, errors.inactiveAccount);
        }

        if (!currentUser.password) {
            return sendResponse(res, errors.forbiddenAccess);
        }

        const isVerified = await comparePassword(password, currentUser.password);
        if (isVerified) {
            return await handleAuthSuccess(res, currentUser);
        }

        sendResponse(res, errors.invalidCredentials);
    }

    async function adminLogin(req, res) {
        const {email, password, phone, phoneNumber} = req.body;
        const searchIdentifier = email || phone || phoneNumber;

        if (!searchIdentifier || !password) {
            return sendResponse(res, errors.invalidCredentials);
        }

        const whereClause = email ? {email} : {phone: searchIdentifier};
        const currentUser = await authModel.findOne({where: whereClause});

        if (currentUser === null) {
            return sendResponse(res, errors.invalidCredentials);
        }

        if (currentUser.role !== availableRoles.adminRole) {
            return sendResponse(res, errors.forbiddenAccess);
        }

        if (currentUser.status !== userStatuses.activated) {
            return sendResponse(res, errors.inactiveAccount);
        }

        const isVerified = await comparePassword(password, currentUser.password);
        if (isVerified) {
            return await handleAuthSuccess(res, currentUser);
        }

        sendResponse(res, errors.invalidCredentials);
    }

    async function signup(req, res) {
        const {
            avatar,
            bibliographie,
            conseil,
            email,
            firstName,
            lastName,
            linkedin,
            metier,
            password,
            phone
        } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return sendResponse(res, errors.invalidValues, {
                required: ["email", "password", "firstName", "lastName"]
            });
        }

        const existing = await authModel.findOne({where: {email}});
        if (existing) {
            return sendResponse(res, errors.emailExists);
        }

        const newUser = await authModel.create({
            avatar,
            bibliographie,
            conseil,
            email,
            firstName,
            lastName,
            linkedin,
            metier,
            password,
            phone,
            role: availableRoles.memberRole,
            status: userStatuses.activated
        });

        await handleAuthSuccess(res, newUser);
    }

    return Object.freeze({
        adminLogin,
        allowedRoles,
        changePassword,
        loginUser,
        signup
    });
}

module.exports = getAuthModule;