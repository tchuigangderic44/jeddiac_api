const {Agenda} = require("../models");
const {errors} = require("../utils/system-messages");
const {contentStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getAgendaModule({model} = {}) {
    const agendaModel = model || Agenda;

    // Public: List active events
    async function getPublicAgenda(req, res) {
        const {limit = 10, offset = 0, search, type, upcoming} = req.query;
        const result = await agendaModel.getAll({
            limit,
            offset,
            search,
            status: contentStatuses.active,
            type,
            upcoming
        });
        res.status(200).json(result);
    }

    // Public: Get event details by ID or Slug
    async function getPublicAgendaDetails(req, res) {
        const {idOrSlug} = req.params;
        const event = await agendaModel.getByIdOrSlug(idOrSlug, true);
        if (!event) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(event.toResponse());
    }

    // Admin: Create event
    async function createEvent(req, res) {
        const {
            coverImage,
            description,
            endDate,
            location,
            registrationLink,
            slug,
            startDate,
            status = contentStatuses.active,
            title,
            type
        } = req.body;

        const uploadedImage = req.files?.coverImage?.[0]?.path || req.file?.path;
        const authorId = req.user?.token?.id;

        if (!title || !startDate) {
            return sendResponse(res, errors.invalidValues, {
                required: ["title", "startDate"]
            });
        }

        const event = await agendaModel.create({
            authorId,
            coverImage: uploadedImage || coverImage,
            description,
            endDate,
            location,
            registrationLink,
            slug,
            startDate,
            status,
            title,
            type
        });

        res.status(201).json({
            data: event.toResponse(),
            message: success.agendaCreated.message
        });
    }

    // Admin: List all events
    async function getAllEvents(req, res) {
        const {limit = 10, offset = 0, search, status, type, upcoming} = req.query;
        const result = await agendaModel.getAll({
            limit,
            offset,
            search,
            status,
            type,
            upcoming
        });
        res.status(200).json(result);
    }

    // Admin: Get event by ID
    async function getEventById(req, res) {
        const {id} = req.params;
        const event = await agendaModel.getByIdOrSlug(id);
        if (!event) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(event.toResponse());
    }

    // Admin: Update event
    async function updateEvent(req, res) {
        const {id} = req.params;
        const event = await agendaModel.getByIdOrSlug(id);
        if (!event) {
            return sendResponse(res, errors.notFound);
        }

        const uploadedImage = req.files?.coverImage?.[0]?.path || req.file?.path;
        const allowedProps = [
            "title",
            "slug",
            "description",
            "startDate",
            "endDate",
            "location",
            "type",
            "registrationLink",
            "status"
        ];

        allowedProps.forEach((prop) => {
            if (req.body[prop] !== undefined) {
                event[prop] = req.body[prop];
            }
        });

        if (uploadedImage) {
            event.coverImage = uploadedImage;
        }

        await event.save();
        res.status(200).json({
            data: event.toResponse(),
            message: success.agendaUpdated.message
        });
    }

    // Admin: Suspend event
    async function suspendEvent(req, res) {
        const {id} = req.params;
        const event = await agendaModel.getByIdOrSlug(id);
        if (!event) {
            return sendResponse(res, errors.notFound);
        }
        event.status = contentStatuses.suspended;
        await event.save();
        res.status(200).json({
            data: event.toResponse(),
            message: success.agendaSuspended.message,
            suspended: true
        });
    }

    // Admin: Reactivate event
    async function reactivateEvent(req, res) {
        const {id} = req.params;
        const event = await agendaModel.getByIdOrSlug(id);
        if (!event) {
            return sendResponse(res, errors.notFound);
        }
        event.status = contentStatuses.active;
        await event.save();
        res.status(200).json({
            data: event.toResponse(),
            message: success.agendaReactivated.message,
            reactivated: true
        });
    }

    // Admin: Delete event
    async function deleteEvent(req, res) {
        const {id} = req.params;
        const event = await agendaModel.getByIdOrSlug(id);
        if (!event) {
            return sendResponse(res, errors.notFound);
        }
        await event.destroy();
        res.status(200).json({
            deleted: true,
            message: success.agendaDeleted.message
        });
    }

    return Object.freeze({
        createEvent,
        deleteEvent,
        getAllEvents,
        getEventById,
        getPublicAgenda,
        getPublicAgendaDetails,
        reactivateEvent,
        suspendEvent,
        updateEvent
    });
}

module.exports = Object.freeze(getAgendaModule);
