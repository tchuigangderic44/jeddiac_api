const fs = require("fs");
const {User} = require("../models");
const {errors} = require("../utils/system-messages");
const {success} = require("../utils/config");
const {sendResponse, fileExists} = require("../utils/helpers");

function getUserModule({associatedModel} = {}) {
    const userModel = associatedModel?.User || User;

    // ==========================================
    // AUTHENTICATED USER PROFILE
    // ==========================================
    async function getInformations(req, res) {
        if (!req.userData) {
            return sendResponse(res, errors.nonexistingUser);
        }
        res.status(200).json(req.userData.toResponse());
    }

    async function updateProfile(req, res) {
        const id = req.user?.token?.id;
        const currentUser = await userModel.getById(id);
        if (!currentUser) {
            return sendResponse(res, errors.nonexistingUser);
        }

        const uploadedAvatar = req.files?.avatar?.[0]?.path || req.file?.path;
        const allowedUpdates = [
            "firstName",
            "lastName",
            "metier",
            "bibliographie",
            "linkedin",
            "conseil",
            "phone",
            "lang"
        ];

        allowedUpdates.forEach((prop) => {
            if (req.body[prop] !== undefined) {
                currentUser[prop] = req.body[prop];
            }
        });

        if (uploadedAvatar) {
            currentUser.avatar = uploadedAvatar;
        }

        await currentUser.save();
        res.status(200).json({
            data: currentUser.toResponse(),
            message: success.userUpdated.message,
            updated: true
        });
    }

    async function deleteAvatar(req, res) {
        const id = req.user?.token?.id;
        const currentUser = await userModel.getById(id);
        if (!currentUser) {
            return sendResponse(res, errors.nonexistingUser);
        }

        if (currentUser.avatar) {
            const exists = await fileExists(currentUser.avatar);
            if (exists) {
                fs.unlink(currentUser.avatar, () => {});
            }
            currentUser.avatar = null;
            await currentUser.save();
        }

        res.status(200).json({
            data: currentUser.toResponse(),
            message: {
                en: "Avatar removed successfully",
                fr: "Avatar supprimé avec succès"
            },
            updated: true
        });
    }

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

    // ==========================================
    // VISITOR / PUBLIC DIRECTORY
    // ==========================================
    async function getPublicMembers(req, res) {
        const {limit = 50, offset = 0, role, search} = req.query;
        const result = await userModel.getPublicMembers({
            limit,
            offset,
            role,
            search
        });
        res.status(200).json(result);
    }

    return Object.freeze({
        deleteAvatar,
        getInformations,
        getPublicMembers,
        logoutUser,
        updateProfile
    });
}

module.exports = Object.freeze(getUserModule);