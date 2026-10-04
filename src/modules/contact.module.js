const {Contact} = require("../models");
const {errors} = require("../utils/system-messages");
const {contactStatuses, success} = require("../utils/config");
const {sendResponse} = require("../utils/helpers");

function getContactModule({model} = {}) {
    const contactModel = model || Contact;

    // Public: Submit contact form
    async function submitContactForm(req, res) {
        const {
            category,
            country,
            email,
            message,
            name,
            phone,
            structureName,
            subject,
            type = "contact"
        } = req.body;

        if (!name || !email || !subject || !message) {
            return sendResponse(res, errors.invalidValues, {
                required: ["name", "email", "subject", "message"]
            });
        }

        const newContact = await contactModel.create({
            category: category || null,
            country: country || null,
            email,
            message,
            name,
            phone: phone || null,
            structureName: structureName || null,
            subject,
            type: type || "contact"
        });

        // Try notifying admin by email if configured
        try {
            const createMailer = require("../utils/email-handler");
            const mailer = createMailer();
            const adminEmail = process.env.admin_email;
            if (adminEmail) {
                const label = type === "candidature" ? "Nouvelle Candidature" : "Nouveau Message de contact";
                mailer.notifyWithEmail({
                    email: adminEmail,
                    notification: {
                        body: `${label} de ${name} (${email}):\n\nSujet: ${subject}\n\nMessage:\n${message}`,
                        title: `[JEDDIAC ${type.toUpperCase()}] ${subject}`
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
        const {category, isRead, limit = 50, offset = 0, search, status, type} = req.query;
        const result = await contactModel.getAll({
            category,
            isRead,
            limit,
            offset,
            search,
            status,
            type
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
        const {adminNotes, isRead, status} = req.body;
        const message = await contactModel.findByPk(id);
        if (!message) {
            return sendResponse(res, errors.notFound);
        }
        if (status) {
            message.status = status;
        }
        if (isRead !== undefined) {
            message.isRead = isRead === true || isRead === "true";
        }
        if (adminNotes !== undefined) {
            message.adminNotes = adminNotes;
        }

        // If status is validated, mark read and automatically send email to candidate/sender
        if (status === "validated" || status === "valide") {
            message.status = "validated";
            message.isRead = true;

            try {
                const createMailer = require("../utils/email-handler");
                const mailer = createMailer();
                const isCandidature = message.type === "candidature";
                const candidateName = message.name || "Candidat";
                const emailTitle = isCandidature
                    ? "Confirmation & Validation de votre candidature au réseau JEDDIAC"
                    : "Votre demande de contact a été validée - JEDDIAC";
                const emailBody = isCandidature
                    ? `Bonjour ${candidateName},

Nous avons le plaisir de vous informer que votre candidature au réseau JEDDIAC a été validée par notre équipe de coordination.

Notre équipe prendra prochainement attache avec vous pour les étapes suivantes d'intégration au réseau.

Bien cordialement,
L'Équipe JEDDIAC
Journalistes Engagés pour le Développement Durable & l'Impact en Afrique Centrale`
                    : `Bonjour ${candidateName},

Nous vous confirmons la bonne prise en compte et validation de votre message concernant "${message.subject || "JEDDIAC"}".

Notre équipe reviendra vers vous très prochainement.

Bien cordialement,
L'Équipe JEDDIAC`;

                mailer.notifyWithEmail({
                    email: message.email,
                    notification: {
                        body: emailBody,
                        title: emailTitle
                    }
                });
            } catch (e) {
                // Ignore email error to not fail update response
            }
        }

        await message.save();
        const resp = message.toResponse();
        res.status(200).json({
            ...resp,
            data: resp,
            message: {
                en: "Contact status updated successfully",
                fr: "Statut de la candidature mis à jour avec succès"
            }
        });
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
                fr: "Message ou candidature supprimé avec succès"
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
