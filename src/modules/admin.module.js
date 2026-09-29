const {User} = require("../models");
const {errors} = require("../utils/system-messages");
const {success, userStatuses} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getAdminModule({associatedModel} = {}) {
    const userModel = associatedModel?.User || User;

    // Create User (Admin only)
    async function createUser(req, res) {
        const {
            avatar,
            bibliographie,
            conseil,
            email,
            firstName,
            lastName,
            linkedin,
            metier,
            password = "User@123456",
            phone,
            role = "member",
            status = userStatuses.activated
        } = req.body;

        const uploadedAvatar = req.files?.avatar?.[0]?.path || req.file?.path;

        if (!email || !firstName || !lastName) {
            return sendResponse(res, errors.invalidValues, {
                required: ["email", "firstName", "lastName"]
            });
        }

        const existingUser = await userModel.findOne({where: {email}});
        if (existingUser) {
            return sendResponse(res, errors.emailExists);
        }

        const newUser = await userModel.create({
            avatar: uploadedAvatar || avatar,
            bibliographie,
            conseil,
            email,
            firstName,
            lastName,
            linkedin,
            metier,
            password,
            phone,
            role,
            status
        });

        res.status(201).json({
            data: newUser.toResponse(),
            message: success.userCreated.message
        });
    }

    // List Users (Admin only)
    async function getUsers(req, res) {
        const {limit = 10, offset = 0, role, search, status} = req.query;
        const result = await userModel.getAll({
            limit,
            offset,
            role,
            search,
            status
        });
        res.status(200).json(result);
    }

    // Get User By ID (Admin only)
    async function getUserById(req, res) {
        const {id} = req.params;
        const targetUser = await userModel.getById(id);
        if (!targetUser) {
            return sendResponse(res, errors.nonexistingUser);
        }
        res.status(200).json(targetUser.toResponse());
    }

    // Update User (Admin only)
    async function updateUser(req, res) {
        const {id} = req.params;
        const targetUser = await userModel.getById(id);
        if (!targetUser) {
            return sendResponse(res, errors.nonexistingUser);
        }

        const uploadedAvatar = req.files?.avatar?.[0]?.path || req.file?.path;
        const allowedUpdates = [
            "firstName",
            "lastName",
            "email",
            "password",
            "phone",
            "role",
            "metier",
            "bibliographie",
            "linkedin",
            "conseil",
            "status",
            "lang"
        ];

        allowedUpdates.forEach((prop) => {
            if (req.body[prop] !== undefined) {
                targetUser[prop] = req.body[prop];
            }
        });

        if (uploadedAvatar) {
            targetUser.avatar = uploadedAvatar;
        }

        await targetUser.save();
        res.status(200).json({
            data: targetUser.toResponse(),
            message: success.userUpdated.message
        });
    }

    // Activate User
    async function activateUser(req, res) {
        const id = req.params.id || req.body.id || req.requestedUser?.id;
        if (!id) {
            return sendResponse(res, errors.invalidValues, {required: ["id"]});
        }

        const targetUser = await userModel.getById(id);
        if (!targetUser) {
            return sendResponse(res, errors.nonexistingUser);
        }

        targetUser.status = userStatuses.activated;
        await targetUser.save();
        res.status(200).json({
            activated: true,
            data: targetUser.toResponse(),
            message: success.userActivated.message
        });
    }

    // Deactivate User
    async function deactivateUser(req, res) {
        const id = req.params.id || req.body.id || req.requestedUser?.id;
        if (!id) {
            return sendResponse(res, errors.invalidValues, {required: ["id"]});
        }

        const targetUser = await userModel.getById(id);
        if (!targetUser) {
            return sendResponse(res, errors.nonexistingUser);
        }

        await userModel.invalidate(targetUser.id, new Date());
        targetUser.status = userStatuses.inactive;
        await targetUser.save();
        res.status(200).json({
            data: targetUser.toResponse(),
            deactivated: true,
            message: success.userDeactivated.message
        });
    }

    // Delete User
    async function deleteUser(req, res) {
        const {id} = req.params;
        const targetUser = await userModel.getById(id);
        if (!targetUser) {
            return sendResponse(res, errors.nonexistingUser);
        }

        await userModel.invalidate(targetUser.id, new Date());
        await targetUser.destroy();
        res.status(200).json({
            deleted: true,
            message: {
                en: "User deleted successfully",
                fr: "Utilisateur supprimé avec succès"
            }
        });
    }

    // Lookup user helper for middlewares
    function lookupUser(propsGetter, requestProp = "user") {
        return async function (req, res, next) {
            const whereClause = propsGetter ? propsGetter(req.body) : {id: req.body.id};
            const targetUser = await userModel.findOne({where: whereClause});
            if (targetUser !== null) {
                req[requestProp] = targetUser;
            }
            next();
        };
    }

    // Logout
    async function logoutUser(req, res) {
        const id = req.user?.token?.id;
        if (id) {
            await userModel.invalidate(id, new Date());
        }
        res.status(200).json({
            loggedOut: true,
            message: {
                en: "Logged out successfully",
                fr: "Déconnexion réussie"
            }
        });
    }

    return Object.freeze({
        activateUser,
        createUser,
        deactivateUser,
        deleteUser,
        getUserById,
        getUsers,
        logoutUser,
        lookupUser,
        updateUser
    });
}

module.exports = Object.freeze(getAdminModule);