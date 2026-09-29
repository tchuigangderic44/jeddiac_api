/*jslint node*/
const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const buildEmailTemplate = require("./email-template");
const {
    mailer_account,
    mailer_host,
    mailer_password
} = process.env;

function createMailer() {
    const transporter = nodemailer.createTransport({
        auth: {
            pass: mailer_password,
            user: mailer_account
        },
        host: mailer_host,
        pool: true,
        port: 465,
        secure: true,
        tls: {
            rejectUnauthorized: false
        }
    });
    function getEmailTemplate({content, redirectLink, title}) {
        return Handlebars.compile(
            buildEmailTemplate({content, redirectLink, title})
        );
    }
    function sendEmail({callback, html, sender, subject, text, to}) {
        const options = {
            envelope: {
                from: (
                    (sender ?? "Grower errata") +
                    "< " + mailer_account + " >"
                ),
                to
            },
            from: mailer_account,
            html,
            priority: "high",
            subject: subject ?? "New Exception raised in the grower api",
            text,
            to

        };
        transporter.sendMail(options, callback);
    }
    function handleResponse(err, info) {
        if (err) {
            if (process.env.NODE_ENV !== "test") {
                console.warn("Mailer note (check SMTP credentials in .env):", err.message);
            }
        } else if (info) {
            console.log("Email sent:", info.messageId || "OK");
        }
    }
    function notifyWithEmail({email, notification}) {
        if (process.env.NODE_ENV === "test") {
            return;
        }
        const html = getEmailTemplate({
            content: notification.body,
            title: notification.title
        })();
        if (typeof email === "string" && email.length > 0) {
            sendEmail({
                callback: handleResponse,
                html,
                subject: notification.title,
                text: notification.body,
                to: email
            });
        }
    }
    return Object.freeze({
        getEmailTemplate,
        handleResponse,
        notifyWithEmail,
        sendEmail
    });
}

module.exports = Object.freeze(createMailer);