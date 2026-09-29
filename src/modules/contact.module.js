const {Contact} = require("../models");
const {errors} = require("../utils/system-messages");
const {contactStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getContactModule({model} = {}) {
    const contactModel = model || Contact;

    // Public: Submit contact form
    async function submitContactForm(req, res) {
        const {email, message, name, phone, subject} = req.body;

        if (!name || !email || !subject || !message) {
            return sendResponse(res, errors.invalidValues, {
                required: ["name", "email", "subject", "message"]
            });
        }

        const newContact = await contactModel.create({
            email,
            message,
            name,
            phone,
            subject
        });

        // Try notifying admin by email if configured
        try {
            const createMailer = require("../utils/email-handler");
            const mailer = createMailer();
            const adminEmail = process.env.admin_email;
            if (adminEmail) {
                mailer.notifyWithEmail({
                    email: adminEmail,
                    notification: {
                        body: `Nouveau message de contact de ${name} (${email}):\n\nSujet: ${subject}\n\nMessage:\n${message}`,
                        title: `[Contact Organisation] ${subject}`
                    }
                });
            }
        } catch (e) {
            // Ignore email error to not fail visitor response
        }

        res.status(201).json({
            data: newContact.toResponse(),
            message: success.contactSent.message
        });
    }

    // Admin: List contact messages
    async function getContactMessages(req, res) {
        const {isRead, limit = 10, offset = 0, search, status} = req.query;
        const result = await contactModel.getAll({
            isRead,
            limit,
            offset,
            search,
            status
        });
        res.status(200).json(result);
    }

    // Admin: Get message by ID and mark as read
    async function getContactMessageById(req, res) {
        const {id} = req.params;
        const message = await contactModel.findByPk(id);
        if (!message) {
            return sendResponse(res, errors.notFound);
        }
        message.isRead = true;
        if (message.status === contactStatuses.new) {
            message.status = contactStatuses.read;
        }
        await message.save();
        res.status(200).json(message.toResponse());
    }

    // Admin: Update status / notes
    async function updateContactStatus(req, res) {
        const {id} = req.params;
        const {adminNotes, status} = req.body;
        const message = await contactModel.findByPk(id);
        if (!message) {
            return sendResponse(res, errors.notFound);
        }
        if (status) {
            message.status = status;
        }
        if (adminNotes !== undefined) {
            message.adminNotes = adminNotes;
        }
        await message.save();
        res.status(200).json(message.toResponse());
    }

    // Admin: Delete contact message
    async function deleteContactMessage(req, res) {
        const {id} = req.params;
        const message = await contactModel.findByPk(id);
        if (!message) {
            return sendResponse(res, errors.notFound);
        }
        await message.destroy();
        res.status(200).json({
            deleted: true,
            message: {
                en: "Message deleted successfully",
                fr: "Message supprimé avec succès"
            }
        });
    }

    return Object.freeze({
        deleteContactMessage,
        getContactMessageById,
        getContactMessages,
        submitContactForm,
        updateContactStatus
    });
}

module.exports = Object.freeze(getContactModule);
