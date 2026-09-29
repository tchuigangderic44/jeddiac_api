const {Newsletter} = require("../models");
const {errors} = require("../utils/system-messages");
const {newsletterStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getNewsletterModule({model} = {}) {
    const newsletterModel = model || Newsletter;

    // Public: Subscribe
    async function subscribeNewsletter(req, res) {
        const {email} = req.body;
        if (!email) {
            return sendResponse(res, errors.invalidValues, {
                required: ["email"]
            });
        }

        const existingSubscriber = await newsletterModel.findOne({where: {email}});
        if (existingSubscriber) {
            if (existingSubscriber.status === newsletterStatuses.subscribed) {
                return res.status(200).json({
                    data: existingSubscriber.toResponse(),
                    message: {
                        en: "You are already subscribed to our newsletter",
                        fr: "Vous êtes déjà inscrit à notre newsletter"
                    }
                });
            }
            existingSubscriber.status = newsletterStatuses.subscribed;
            existingSubscriber.subscribedAt = new Date();
            existingSubscriber.unsubscribedAt = null;
            await existingSubscriber.save();

            return res.status(200).json({
                data: existingSubscriber.toResponse(),
                message: success.newsletterSubscribed.message
            });
        }

        const newSubscriber = await newsletterModel.create({
            email,
            status: newsletterStatuses.subscribed,
            subscribedAt: new Date()
        });

        res.status(201).json({
            data: newSubscriber.toResponse(),
            message: success.newsletterSubscribed.message
        });
    }

    // Public: Unsubscribe
    async function unsubscribeNewsletter(req, res) {
        const {email} = req.body;
        if (!email) {
            return sendResponse(res, errors.invalidValues, {
                required: ["email"]
            });
        }

        const subscriber = await newsletterModel.findOne({where: {email}});
        if (!subscriber) {
            return sendResponse(res, errors.notFound);
        }

        subscriber.status = newsletterStatuses.unsubscribed;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        res.status(200).json({
            data: subscriber.toResponse(),
            message: success.newsletterUnsubscribed.message
        });
    }

    // Admin: List all subscribers
    async function getNewsletterSubscribers(req, res) {
        const {limit = 20, offset = 0, search, status} = req.query;
        const result = await newsletterModel.getAll({
            limit,
            offset,
            search,
            status
        });
        res.status(200).json(result);
    }

    // Admin: Delete subscriber
    async function deleteNewsletterSubscriber(req, res) {
        const {id} = req.params;
        const subscriber = await newsletterModel.findByPk(id);
        if (!subscriber) {
            return sendResponse(res, errors.notFound);
        }
        await subscriber.destroy();
        res.status(200).json({
            deleted: true,
            message: {
                en: "Subscriber removed successfully",
                fr: "Abonné supprimé avec succès"
            }
        });
    }

    return Object.freeze({
        deleteNewsletterSubscriber,
        getNewsletterSubscribers,
        subscribeNewsletter,
        unsubscribeNewsletter
    });
}

module.exports = Object.freeze(getNewsletterModule);
