const {Mission} = require("../models");
const {errors} = require("../utils/system-messages");
const {contentStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getMissionModule({model} = {}) {
    const missionModel = model || Mission;

    // Public: List active missions
    async function getPublicMissions(req, res) {
        const {limit = 20, offset = 0, search} = req.query;
        const result = await missionModel.getAll({
            limit,
            offset,
            search,
            status: contentStatuses.active
        });
        res.status(200).json(result);
    }

    // Public: Get mission details by ID or Slug
    async function getPublicMissionDetails(req, res) {
        const {idOrSlug} = req.params;
        const mission = await missionModel.getByIdOrSlug(idOrSlug, true);
        if (!mission) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(mission.toResponse());
    }

    // Admin: Create mission
    async function createMission(req, res) {
        const {
            description,
            image,
            objectives,
            order = 0,
            shortDescription,
            slug,
            status = contentStatuses.active,
            title
        } = req.body;

        const uploadedImage = req.files?.image?.[0]?.path || req.file?.path;

        if (!title || !description) {
            return sendResponse(res, errors.invalidValues, {
                required: ["title", "description"]
            });
        }

        const mission = await missionModel.create({
            description,
            image: uploadedImage || image,
            objectives,
            order,
            shortDescription,
            slug,
            status,
            title
        });

        res.status(201).json({
            data: mission.toResponse(),
            message: success.missionCreated.message
        });
    }

    // Admin: List all missions
    async function getAllMissions(req, res) {
        const {limit = 20, offset = 0, search, status} = req.query;
        const result = await missionModel.getAll({
            limit,
            offset,
            search,
            status
        });
        res.status(200).json(result);
    }

    // Admin: Get mission by ID
    async function getMissionById(req, res) {
        const {id} = req.params;
        const mission = await missionModel.getByIdOrSlug(id);
        if (!mission) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(mission.toResponse());
    }

    // Admin: Update mission
    async function updateMission(req, res) {
        const {id} = req.params;
        const mission = await missionModel.getByIdOrSlug(id);
        if (!mission) {
            return sendResponse(res, errors.notFound);
        }

        const uploadedImage = req.files?.image?.[0]?.path || req.file?.path;
        const allowedProps = [
            "title",
            "slug",
            "shortDescription",
            "description",
            "objectives",
            "order",
            "status"
        ];

        allowedProps.forEach((prop) => {
            if (req.body[prop] !== undefined) {
                mission[prop] = req.body[prop];
            }
        });

        if (uploadedImage) {
            mission.image = uploadedImage;
        }

        await mission.save();
        res.status(200).json({
            data: mission.toResponse(),
            message: success.missionUpdated.message
        });
    }

    // Admin: Suspend mission
    async function suspendMission(req, res) {
        const {id} = req.params;
        const mission = await missionModel.getByIdOrSlug(id);
        if (!mission) {
            return sendResponse(res, errors.notFound);
        }
        mission.status = contentStatuses.suspended;
        await mission.save();
        res.status(200).json({
            data: mission.toResponse(),
            message: success.missionSuspended.message,
            suspended: true
        });
    }

    // Admin: Reactivate mission
    async function reactivateMission(req, res) {
        const {id} = req.params;
        const mission = await missionModel.getByIdOrSlug(id);
        if (!mission) {
            return sendResponse(res, errors.notFound);
        }
        mission.status = contentStatuses.active;
        await mission.save();
        res.status(200).json({
            data: mission.toResponse(),
            message: success.missionReactivated.message,
            reactivated: true
        });
    }

    // Admin: Delete mission
    async function deleteMission(req, res) {
        const {id} = req.params;
        const mission = await missionModel.getByIdOrSlug(id);
        if (!mission) {
            return sendResponse(res, errors.notFound);
        }
        await mission.destroy();
        res.status(200).json({
            deleted: true,
            message: success.missionDeleted.message
        });
    }

    return Object.freeze({
        createMission,
        deleteMission,
        getAllMissions,
        getMissionById,
        getPublicMissionDetails,
        getPublicMissions,
        reactivateMission,
        suspendMission,
        updateMission
    });
}

module.exports = Object.freeze(getMissionModule);
