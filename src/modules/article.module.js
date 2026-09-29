const {Article} = require("../models");
const {errors} = require("../utils/system-messages");
const {contentStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getArticleModule({model} = {}) {
    const articleModel = model || Article;

    // Public: List active blog articles
    async function getPublicArticles(req, res) {
        const {category, limit = 10, offset = 0, search, tag} = req.query;
        const result = await articleModel.getAll({
            category,
            limit,
            offset,
            search,
            status: contentStatuses.active,
            tag
        });
        res.status(200).json(result);
    }

    // Public: Read article details by ID or Slug (auto-increments views)
    async function getPublicArticleDetails(req, res) {
        const {idOrSlug} = req.params;
        const article = await articleModel.getByIdOrSlug(idOrSlug, true);
        if (!article) {
            return sendResponse(res, errors.notFound);
        }

        // Increment views count
        article.viewsCount = (article.viewsCount || 0) + 1;
        await article.save();

        res.status(200).json(article.toResponse());
    }

    // Admin: Create blog article
    async function createArticle(req, res) {
        const {
            category,
            content,
            coverImage,
            publishedAt,
            slug,
            status = contentStatuses.active,
            summary,
            tags,
            title
        } = req.body;

        const uploadedImage = req.files?.coverImage?.[0]?.path || req.file?.path;
        const authorId = req.user?.token?.id;

        if (!title || !content) {
            return sendResponse(res, errors.invalidValues, {
                required: ["title", "content"]
            });
        }

        const article = await articleModel.create({
            authorId,
            category,
            content,
            coverImage: uploadedImage || coverImage,
            publishedAt: publishedAt || new Date(),
            slug,
            status,
            summary,
            tags,
            title
        });

        res.status(201).json({
            data: article.toResponse(),
            message: success.articleCreated.message
        });
    }

    // Admin: List all articles
    async function getAllArticles(req, res) {
        const {category, limit = 10, offset = 0, search, status, tag} = req.query;
        const result = await articleModel.getAll({
            category,
            limit,
            offset,
            search,
            status,
            tag
        });
        res.status(200).json(result);
    }

    // Admin: Get article by ID
    async function getArticleById(req, res) {
        const {id} = req.params;
        const article = await articleModel.getByIdOrSlug(id);
        if (!article) {
            return sendResponse(res, errors.notFound);
        }
        res.status(200).json(article.toResponse());
    }

    // Admin: Update article
    async function updateArticle(req, res) {
        const {id} = req.params;
        const article = await articleModel.getByIdOrSlug(id);
        if (!article) {
            return sendResponse(res, errors.notFound);
        }

        const uploadedImage = req.files?.coverImage?.[0]?.path || req.file?.path;
        const allowedProps = [
            "title",
            "slug",
            "summary",
            "content",
            "category",
            "tags",
            "status",
            "publishedAt"
        ];

        allowedProps.forEach((prop) => {
            if (req.body[prop] !== undefined) {
                article[prop] = req.body[prop];
            }
        });

        if (uploadedImage) {
            article.coverImage = uploadedImage;
        }

        await article.save();
        res.status(200).json({
            data: article.toResponse(),
            message: success.articleUpdated.message
        });
    }

    // Admin: Suspend article
    async function suspendArticle(req, res) {
        const {id} = req.params;
        const article = await articleModel.getByIdOrSlug(id);
        if (!article) {
            return sendResponse(res, errors.notFound);
        }
        article.status = contentStatuses.suspended;
        await article.save();
        res.status(200).json({
            data: article.toResponse(),
            message: success.articleSuspended.message,
            suspended: true
        });
    }

    // Admin: Reactivate article
    async function reactivateArticle(req, res) {
        const {id} = req.params;
        const article = await articleModel.getByIdOrSlug(id);
        if (!article) {
            return sendResponse(res, errors.notFound);
        }
        article.status = contentStatuses.active;
        await article.save();
        res.status(200).json({
            data: article.toResponse(),
            message: success.articleReactivated.message,
            reactivated: true
        });
    }

    // Admin: Delete article
    async function deleteArticle(req, res) {
        const {id} = req.params;
        const article = await articleModel.getByIdOrSlug(id);
        if (!article) {
            return sendResponse(res, errors.notFound);
        }
        await article.destroy();
        res.status(200).json({
            deleted: true,
            message: success.articleDeleted.message
        });
    }

    return Object.freeze({
        createArticle,
        deleteArticle,
        getAllArticles,
        getArticleById,
        getPublicArticleDetails,
        getPublicArticles,
        reactivateArticle,
        suspendArticle,
        updateArticle
    });
}

module.exports = Object.freeze(getArticleModule);
