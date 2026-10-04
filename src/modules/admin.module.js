const {User, Article, News, Agenda, Contact, Newsletter, Mission} = require("../models");
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
            bibliographieEn,
            category,
            conseil,
            conseilEn,
            contributions,
            contributionsEn,
            country,
            email,
            firstName,
            lastName,
            linkedin,
            location,
            metier,
            metierEn,
            password = "User@123456",
            phone,
            pole,
            poleEn,
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
            bibliographieEn,
            category,
            conseil,
            conseilEn,
            contributions,
            contributionsEn,
            country,
            email,
            firstName,
            lastName,
            linkedin,
            location,
            metier,
            metierEn,
            password,
            phone,
            pole,
            poleEn,
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
            "category",
            "metier",
            "metierEn",
            "pole",
            "poleEn",
            "location",
            "country",
            "bibliographie",
            "bibliographieEn",
            "linkedin",
            "conseil",
            "conseilEn",
            "contributions",
            "contributionsEn",
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

    // Dashboard Statistics (Admin)
    async function getStats(req, res) {
        const [
            totalArticles,
            totalNews,
            totalAgendas,
            totalContacts,
            unreadContacts,
            totalNewsletters,
            totalUsers
        ] = await Promise.all([
            Article.count().catch(() => 0),
            News.count().catch(() => 0),
            Agenda.count().catch(() => 0),
            Contact.count().catch(() => 0),
            Contact.count({where: {isRead: false}}).catch(() => 0),
            Newsletter.count().catch(() => 0),
            User.count().catch(() => 0)
        ]);

        const [recentContacts, recentArticles, recentNews, upcomingAgendas] = await Promise.all([
            Contact.findAll({order: [["createdAt", "DESC"]], limit: 5}).catch(() => []),
            Article.findAll({order: [["createdAt", "DESC"]], limit: 5}).catch(() => []),
            News.findAll({order: [["createdAt", "DESC"]], limit: 5}).catch(() => []),
            Agenda.findAll({order: [["startDate", "ASC"]], limit: 5}).catch(() => [])
        ]);

        res.status(200).json({
            kpi: {
                totalArticles,
                totalNews,
                totalAgendas,
                totalContacts,
                unreadContacts,
                totalNewsletters,
                totalUsers
            },
            recentArticles,
            recentContacts,
            recentNews,
            upcomingAgendas
        });
    }

    // Public Organization Overview
    async function getPublicStats(req, res) {
        const [totalArticles, totalNews, totalAgendas] = await Promise.all([
            Article.count({where: {status: "active"}}).catch(() => 0),
            News.count({where: {status: "active"}}).catch(() => 0),
            Agenda.count({where: {status: "active"}}).catch(() => 0)
        ]);

        res.status(200).json({
            actualitesCount: totalNews,
            articlesPublies: totalArticles,
            evenementsCount: totalAgendas,
            journalistesCibles: 20000,
            paysAfriqueCentrale: 6,
            regionsCameroun: 10,
            structuresPartenaires: 90
        });
    }

    return Object.freeze({
        activateUser,
        createUser,
        deactivateUser,
        deleteUser,
        getPublicStats,
        getStats,
        getUserById,
        getUsers,
        logoutUser,
        lookupUser,
        updateUser
    });
}

module.exports = Object.freeze(getAdminModule);