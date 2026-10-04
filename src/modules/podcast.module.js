const {Podcast} = require("../models");
const {errors} = require("../utils/system-messages");
const {contentStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getPodcastModule({model} = {}) {
    const podcastModel = model || Podcast;

    // Public: List active podcasts
    async function getPublicPodcasts(req, res) {
        const {limit = 10, offset = 0, search, topic} = req.query;
        const result = await podcastModel.getAll({
            limit,
            offset,
            search,
            status: contentStatuses.active,
            topic
        });
        res.status(200).json(result);
    }

    // Public: Read podcast details by ID or Slug
    async function getPublicPodcastDetails(req, res) {
        const {idOrSlug} = req.params;
        const podcastItem = await podcastModel.getByIdOrSlug(idOrSlug, true);
        if (!podcastItem) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(podcastItem.toResponse());
    }

    // Admin: List all podcasts
    async function getAllPodcasts(req, res) {
        const {limit = 20, offset = 0, search, status, topic} = req.query;
        const result = await podcastModel.getAll({
            limit,
            offset,
            search,
            status,
            topic
        });
        res.status(200).json(result);
    }

    // Admin: Get podcast by ID
    async function getPodcastById(req, res) {
        const {id} = req.params;
        const podcastItem = await podcastModel.getByIdOrSlug(id);
        if (!podcastItem) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(podcastItem.toResponse());
    }

    // Admin: Create podcast
    async function createPodcast(req, res) {
        const {
            audioUrl,
            author,
            authorEn,
            cover,
            coverImage,
            description,
            descriptionEn,
            duration,
            order = 0,
            publishedAt,
            series,
            seriesEn,
            slug,
            status = contentStatuses.active,
            title,
            titleEn,
            topic,
            topicEn
        } = req.body;

        const uploadedCover = req.files?.cover?.[0]?.path || req.files?.coverImage?.[0]?.path || req.file?.path;
        const uploadedAudio = req.files?.audio?.[0]?.path || req.files?.audioUrl?.[0]?.path;

        const coverToSave = uploadedCover || cover || coverImage || "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80";
        const audioToSave = uploadedAudio || audioUrl || "";
        const authorId = req.user?.token?.id;

        if (!title) {
            return sendResponse(res, errors.invalidValues, {
                required: ["title"]
            });
        }

        const newPodcast = await podcastModel.create({
            audioUrl: audioToSave,
            author: author || "JEDDIAC Junior",
            authorEn: authorEn || author || "JEDDIAC Junior",
            authorId,
            cover: coverToSave,
            description: description || "",
            descriptionEn: descriptionEn || "",
            duration: duration || "10:00",
            order: parseInt(order, 10) || 0,
            publishedAt: publishedAt || new Date(),
            series: series || "Les Voix de la Durabilité",
            seriesEn: seriesEn || series || "Voices of Sustainability",
            slug,
            status,
            title,
            titleEn: titleEn || title,
            topic: topic || "Environnement & Climat",
            topicEn: topicEn || topic || "Environment & Climate"
        });

        res.status(201).json({
            data: newPodcast.toResponse(),
            message: success.podcastCreated.message
        });
    }

    // Admin: Update podcast
    async function updatePodcast(req, res) {
        const {id} = req.params;
        const podcastItem = await podcastModel.getByIdOrSlug(id);
        if (!podcastItem) {
            return sendResponse(res, errors.notFound);
        }

        const uploadedCover = req.files?.cover?.[0]?.path || req.files?.coverImage?.[0]?.path || req.file?.path;
        const uploadedAudio = req.files?.audio?.[0]?.path || req.files?.audioUrl?.[0]?.path;

        const allowedProps = [
            "title",
            "titleEn",
            "series",
            "seriesEn",
            "duration",
            "author",
            "authorEn",
            "topic",
            "topicEn",
            "description",
            "descriptionEn",
            "audioUrl",
            "slug",
            "status",
            "order",
            "publishedAt"
        ];

        allowedProps.forEach((prop) => {
            if (req.body[prop] !== undefined) {
                podcastItem[prop] = req.body[prop];
            }
        });

        if (uploadedCover) {
            podcastItem.cover = uploadedCover;
        } else if (req.body.cover !== undefined) {
            podcastItem.cover = req.body.cover;
        } else if (req.body.coverImage !== undefined) {
            podcastItem.cover = req.body.coverImage;
        }

        if (uploadedAudio) {
            podcastItem.audioUrl = uploadedAudio;
        } else if (req.body.audioUrl !== undefined) {
            podcastItem.audioUrl = req.body.audioUrl;
        }

        await podcastItem.save();
        res.status(200).json({
            data: podcastItem.toResponse(),
            message: success.podcastUpdated.message
        });
    }

    // Admin: Suspend podcast
    async function suspendPodcast(req, res) {
        const {id} = req.params;
        const podcastItem = await podcastModel.getByIdOrSlug(id);
        if (!podcastItem) {
            return sendResponse(res, errors.notFound);
        }
        podcastItem.status = contentStatuses.suspended;
        await podcastItem.save();
        res.status(200).json({
            data: podcastItem.toResponse(),
            message: success.podcastSuspended.message,
            suspended: true
        });
    }

    // Admin: Reactivate podcast
    async function reactivatePodcast(req, res) {
        const {id} = req.params;
        const podcastItem = await podcastModel.getByIdOrSlug(id);
        if (!podcastItem) {
            return sendResponse(res, errors.notFound);
        }
        podcastItem.status = contentStatuses.active;
        await podcastItem.save();
        res.status(200).json({
            data: podcastItem.toResponse(),
            message: success.podcastReactivated.message,
            reactivated: true
        });
    }

    // Admin: Delete podcast
    async function deletePodcast(req, res) {
        const {id} = req.params;
        const podcastItem = await podcastModel.getByIdOrSlug(id);
        if (!podcastItem) {
            return sendResponse(res, errors.notFound);
        }
        await podcastItem.destroy();
        res.status(200).json({
            deleted: true,
            message: success.podcastDeleted.message
        });
    }

    return Object.freeze({
        createPodcast,
        deletePodcast,
        getAllPodcasts,
        getPodcastById,
        getPublicPodcastDetails,
        getPublicPodcasts,
        reactivatePodcast,
        suspendPodcast,
        updatePodcast
    });
}

module.exports = Object.freeze(getPodcastModule);
