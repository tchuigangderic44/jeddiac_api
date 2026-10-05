const {User, News, Agenda, Contact, Newsletter, Mission, Settings} = require("../models");
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
            totalNews,
            totalAgendas,
            totalContacts,
            unreadContacts,
            totalNewsletters,
            totalUsers
        ] = await Promise.all([
            News.count().catch(() => 0),
            Agenda.count().catch(() => 0),
            Contact.count().catch(() => 0),
            Contact.count({where: {isRead: false}}).catch(() => 0),
            Newsletter.count().catch(() => 0),
            User.count().catch(() => 0)
        ]);

        const [recentContacts, recentNews, upcomingAgendas] = await Promise.all([
            Contact.findAll({order: [["createdAt", "DESC"]], limit: 5}).catch(() => []),
            News.findAll({order: [["createdAt", "DESC"]], limit: 5}).catch(() => []),
            Agenda.findAll({order: [["startDate", "ASC"]], limit: 5}).catch(() => [])
        ]);

        res.status(200).json({
            kpi: {
                totalNews,
                totalAgendas,
                totalContacts,
                unreadContacts,
                totalNewsletters,
                totalUsers
            },
            recentContacts,
            recentNews,
            upcomingAgendas
        });
    }

    // Public Organization Overview & Hero Metrics
    async function getPublicStats(req, res) {
        const [totalNews, totalAgendas, heroMetricsSetting] = await Promise.all([
            News.count({where: {status: "active"}}).catch(() => 0),
            Agenda.count({where: {status: "active"}}).catch(() => 0),
            Settings.findOne({where: {type: "hero-metrics"}}).catch(() => null)
        ]);

        const custom = heroMetricsSetting && heroMetricsSetting.value
            ? (typeof heroMetricsSetting.value === "string" ? JSON.parse(heroMetricsSetting.value) : heroMetricsSetting.value)
            : {};

        res.status(200).json({
            actualitesCount: totalNews,
            evenementsCount: totalAgendas,
            journalistesCibles: custom.journalistesCibles !== undefined ? Number(custom.journalistesCibles) : 20000,
            paysAfriqueCentrale: custom.paysAfriqueCentrale !== undefined ? Number(custom.paysAfriqueCentrale) : 6,
            regionsCameroun: custom.regionsCameroun !== undefined ? Number(custom.regionsCameroun) : 10,
            structuresPartenaires: custom.structuresPartenaires !== undefined ? Number(custom.structuresPartenaires) : 90,
            labelYouthFr: custom.labelYouthFr || "Jeunes mobilisés",
            labelYouthEn: custom.labelYouthEn || "Youth mobilized",
            labelPartnersFr: custom.labelPartnersFr || "Clubs & radios partenaires",
            labelPartnersEn: custom.labelPartnersEn || "Partner clubs & radios",
            labelRegionsFr: custom.labelRegionsFr || "Régions couvertes",
            labelRegionsEn: custom.labelRegionsEn || "Covered regions",
            labelCountriesFr: custom.labelCountriesFr || "Pays du Bassin",
            labelCountriesEn: custom.labelCountriesEn || "Congo Basin countries"
        });
    }

    // Admin: Update Hero & Overview Metrics
    async function updatePublicStats(req, res) {
        const {
            journalistesCibles,
            paysAfriqueCentrale,
            regionsCameroun,
            structuresPartenaires,
            labelYouthFr,
            labelYouthEn,
            labelPartnersFr,
            labelPartnersEn,
            labelRegionsFr,
            labelRegionsEn,
            labelCountriesFr,
            labelCountriesEn
        } = req.body;

        let setting = await Settings.findOne({where: {type: "hero-metrics"}}).catch(() => null);
        const currentVal = setting && setting.value
            ? (typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value)
            : {};

        const newVal = {
            ...currentVal,
            ...(journalistesCibles !== undefined && {journalistesCibles: Number(journalistesCibles)}),
            ...(paysAfriqueCentrale !== undefined && {paysAfriqueCentrale: Number(paysAfriqueCentrale)}),
            ...(regionsCameroun !== undefined && {regionsCameroun: Number(regionsCameroun)}),
            ...(structuresPartenaires !== undefined && {structuresPartenaires: Number(structuresPartenaires)}),
            ...(labelYouthFr && {labelYouthFr}),
            ...(labelYouthEn && {labelYouthEn}),
            ...(labelPartnersFr && {labelPartnersFr}),
            ...(labelPartnersEn && {labelPartnersEn}),
            ...(labelRegionsFr && {labelRegionsFr}),
            ...(labelRegionsEn && {labelRegionsEn}),
            ...(labelCountriesFr && {labelCountriesFr}),
            ...(labelCountriesEn && {labelCountriesEn})
        };

        if (setting) {
            setting.value = newVal;
            await setting.save();
        } else {
            setting = await Settings.create({
                type: "hero-metrics",
                value: newVal
            });
        }

        const [totalNews, totalAgendas] = await Promise.all([
            News.count({where: {status: "active"}}).catch(() => 0),
            Agenda.count({where: {status: "active"}}).catch(() => 0)
        ]);

        res.status(200).json({
            actualitesCount: totalNews,
            evenementsCount: totalAgendas,
            ...newVal,
            message: {
                en: "Impact metrics updated successfully",
                fr: "Indicateurs d'impact mis à jour avec succès"
            }
        });
    }

    return Object.freeze({
        activateUser,
        createUser,
        deactivateUser,
        deleteUser,
        getPublicStats,
        updatePublicStats,
        getStats,
        getUserById,
        getUsers,
        logoutUser,
        lookupUser,
        updateUser
    });
}

module.exports = Object.freeze(getAdminModule);