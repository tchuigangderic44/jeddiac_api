const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const {promisify} = require("node:util");
const {fileExists, pathToURL} = require("./helpers")

const copyAsync = promisify(fs.copyFile);
const unlinkAsync = promisify(fs.unlink);

function defaultDestination(req, file, cb) {
    cb(null, {path: "/dev/null"});
}
function HashFileStorage(options) {
    let {destination} = options;
    this.getDestination = (destination || defaultDestination);
}

HashFileStorage.prototype._handleFile = function _handleFile(req, file, cb) {
    this.getDestination(req, file, cb);
};

HashFileStorage.prototype._removeFile = function _removeFile(req, file, cb) {
    fs.unlink(file.path, cb);
};


function getDestination({cb, file, folderPath}) {
    const extension = path.extname(file.originalname);
    const hash = crypto.createHash("sha256");
    const tempPath = "_chair"+ crypto.randomUUID();
    const outStream = fs.createWriteStream(tempPath); 
    file.stream.pipe(outStream);
    file.stream.on("data", function (data) {
        hash.update(data);
    });
    outStream.on("error", cb);
    outStream.on("finish", function () {
        outStream.close();
    });
    outStream.on("close", async function () {
        let exists;
        const finalPath = path.normalize(
            folderPath +
            "chair_" +
            hash.digest("hex") +
            extension
        );
        await new Promise(function (res, rej) {
            fs.mkdir(folderPath, {recursive: true}, function (err, path) {
                if (err) {
                    return rej(err);
                }
                res(path);
            });
        });
        exists = await fileExists(finalPath);
        if (!exists) {
            await copyAsync(tempPath, finalPath);
        }
        await unlinkAsync(tempPath);
        cb(null, {
            path: finalPath,
            size: outStream.bytesWritten,
            url: pathToURL(finalPath)
        });
    });
}

function hashedUploadHandler(
    fieldsOptions = {},
    limits = {fileSize: 6291560}
) {
    const result = multer({
        fileFilter: function (_, file, cb) {
            const {validator} = fieldsOptions[file.fieldname];
            if (typeof validator === "function") {
                validator(file, cb);
            } else {
                cb(null, true);
            }
        },
        limits,
        storage: new HashFileStorage({
            destination: function (_, file, cb) {
                const {
                    folderPath = "./"
                } = (fieldsOptions[file.fieldname] || {});
                getDestination({cb, file, folderPath});
            }
        })
    });
    return result;
}

function imageValidator(file, cb) {
    const pattern = /png|jpg|jpeg/gi;
    if (pattern.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

function fileValidator(file, cb) {
    const pattern = /pdf/gi;
    if (pattern.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

module.exports = {
    imageValidator,
    hashedUploadHandler,
    fileValidator,
};