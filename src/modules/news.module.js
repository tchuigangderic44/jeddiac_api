const {News} = require("../models");
const {errors} = require("../utils/system-messages");
const {contentStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getNewsModule({model} = {}) {
    const newsModel = model || News;

    // Public: List active news
    async function getPublicNews(req, res) {
        const {category, limit = 10, offset = 0, search} = req.query;
        const result = await newsModel.getAll({
            category,
            limit,
            offset,
            search,
            status: contentStatuses.active
        });
        res.status(200).json(result);
    }

    // Public: Read news details by ID or Slug
    async function getPublicNewsDetails(req, res) {
        const {idOrSlug} = req.params;
        const newsItem = await newsModel.getByIdOrSlug(idOrSlug, true);
        if (!newsItem) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(newsItem.toResponse());
    }

    // Admin: Create news
    async function createNews(req, res) {
        const {
            category,
            categoryEn,
            content,
            contentEn,
            coverImage,
            publishedAt,
            slug,
            status = contentStatuses.active,
            summary,
            summaryEn,
            tags,
            tagsEn,
            title,
            titleEn
        } = req.body;

        const uploadedImage = req.files?.coverImage?.[0]?.path || req.files?.image?.[0]?.path || req.file?.path;
        const coverImageToSave = uploadedImage || coverImage || req.body.image;
        const authorId = req.user?.token?.id;

        if (!title || !content) {
            return sendResponse(res, errors.invalidValues, {
                required: ["title", "content"]
            });
        }

        const newsItem = await newsModel.create({
            authorId,
            category,
            categoryEn,
            content,
            contentEn,
            coverImage: coverImageToSave,
            publishedAt: publishedAt || new Date(),
            slug,
            status,
            summary,
            summaryEn,
            tags,
            tagsEn,
            title,
            titleEn
        });

        res.status(201).json({
            data: newsItem.toResponse(),
            message: success.newsCreated.message
        });
    }

    // Admin: List all news (active and suspended)
    async function getAllNews(req, res) {
        const {category, limit = 10, offset = 0, search, status} = req.query;
        const result = await newsModel.getAll({
            category,
            limit,
            offset,
            search,
            status
        });
        res.status(200).json(result);
    }

    // Admin: Get news by ID
    async function getNewsById(req, res) {
        const {id} = req.params;
        const newsItem = await newsModel.getByIdOrSlug(id);
        if (!newsItem) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(newsItem.toResponse());
    }

    // Admin: Update news
    async function updateNews(req, res) {
        const {id} = req.params;
        const newsItem = await newsModel.getByIdOrSlug(id);
        if (!newsItem) {
            return sendResponse(res, errors.notFound);
        }

        const uploadedImage = req.files?.coverImage?.[0]?.path || req.files?.image?.[0]?.path || req.file?.path;
        const allowedProps = [
            "title",
            "titleEn",
            "slug",
            "summary",
            "summaryEn",
            "content",
            "contentEn",
            "category",
            "categoryEn",
            "tags",
            "tagsEn",
            "status",
            "publishedAt"
        ];

        allowedProps.forEach((prop) => {
            if (req.body[prop] !== undefined) {
                newsItem[prop] = req.body[prop];
            }
        });

        if (uploadedImage) {
            newsItem.coverImage = uploadedImage;
        } else if (req.body.coverImage !== undefined) {
            newsItem.coverImage = req.body.coverImage;
        } else if (req.body.image !== undefined) {
            newsItem.coverImage = req.body.image;
        }

        await newsItem.save();
        res.status(200).json({
            data: newsItem.toResponse(),
            message: success.newsUpdated.message
        });
    }

    // Admin: Suspend news
    async function suspendNews(req, res) {
        const {id} = req.params;
        const newsItem = await newsModel.getByIdOrSlug(id);
        if (!newsItem) {
            return sendResponse(res, errors.notFound);
        }
        newsItem.status = contentStatuses.suspended;
        await newsItem.save();
        res.status(200).json({
            data: newsItem.toResponse(),
            message: success.newsSuspended.message,
            suspended: true
        });
    }

    // Admin: Reactivate news
    async function reactivateNews(req, res) {
        const {id} = req.params;
        const newsItem = await newsModel.getByIdOrSlug(id);
        if (!newsItem) {
            return sendResponse(res, errors.notFound);
        }
        newsItem.status = contentStatuses.active;
        await newsItem.save();
        res.status(200).json({
            data: newsItem.toResponse(),
            message: success.newsReactivated.message,
            reactivated: true
        });
    }

    // Admin: Delete news
    async function deleteNews(req, res) {
        const {id} = req.params;
        const newsItem = await newsModel.getByIdOrSlug(id);
        if (!newsItem) {
            return sendResponse(res, errors.notFound);
        }
        await newsItem.destroy();
        res.status(200).json({
            deleted: true,
            message: success.newsDeleted.message
        });
    }

    return Object.freeze({
        createNews,
        deleteNews,
        getAllNews,
        getNewsById,
        getPublicNews,
        getPublicNewsDetails,
        reactivateNews,
        suspendNews,
        updateNews
    });
}

module.exports = Object.freeze(getNewsModule);
