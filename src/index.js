const process = require("node:process");
const fs = require("node:fs");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

if (fs.existsSync(".env.production") && (process.env.NODE_ENV === "production" || !fs.existsSync(".env"))) {
    dotenv.config({path: ".env.production"});
} else {
    dotenv.config();
}

const port = process.env.PORT || process.env.API_PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

const defaultAllowedOrigins = [
    "https://jeddiac.org",
    "https://www.jeddiac.org",
    "https://api.jeddiac.org",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const customOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
            : [];
        const allowed = [...defaultAllowedOrigins, ...customOrigins];

        if (
            allowed.includes(origin) ||
            origin.endsWith(".jeddiac.org") ||
            (process.env.NODE_ENV !== "production" && (origin.includes("localhost") || origin.includes("127.0.0.1")))
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-timestamp"]
};

const staticUploadOptions = {
    dotfiles: "ignore",
    etag: true,
    extensions: ["pdf", "png", "jpg", "jpeg", "webp", "avif", "docx", "mp3", "wav", "m4a", "ogg"],
    index: false,
    maxAge: "7d",
    redirect: false,
    setHeaders: function (res) {
        res.set("x-timestamp", Date.now());
    }
};

function buildServer(router) {
    const app = express();
    app.use(express.json());
    app.use(function (err, req, res, next) {
        if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
            return res.status(400).json({
                message: {
                    en: "Invalid JSON format",
                    fr: "Format JSON invalide"
                }
            });
        }
        next(err);
    });
    app.use(cors(corsOptions));
    app.use(express.static("public", staticUploadOptions));
    app.use(router);
    if (process.env.PORT && isNaN(Number(process.env.PORT))) {
        return app.listen(process.env.PORT, function () {
            console.debug("server listening on Passenger socket %s", process.env.PORT);
        });
    }
    return app.listen(port, host, function () {
        console.debug("server listening on %s:%s", host, port);
    });
}

module.exports = Object.freeze({
    buildServer
});
