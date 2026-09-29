const {EventEmitter} = require("node:events");
const bcrypt = require("bcrypt");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const {errors} = require("./system-messages");
const path = require("path");
const {
  getFirebaseConfig,
  getOTPConfig,
  getPaymentConfig
} = require("../utils/config");
const {ValidationError} = require("sequelize");
const {
  TOKEN_EXP: expiration = 9996000008,
  JWT_SECRET: secret = "default333secret"
} = process.env;
const CustomEmitter = function (name) {
  const self = this;
  this.name = name;
  this.decorate = function (obj) {
      obj.emitEvent = function (name, data) {
          self.emit(name, data);
      };
      obj.addEventListener = function (name, func) {
          self.on(name, func);
      };
      obj.forward = function (eventName) {
          return {
              to: function (emitter) {
                  obj.addEventListener(eventName, function (data) {
                      if (typeof emitter?.emitEvent === "function") {
                          emitter.emitEvent(eventName, data);
                      }
                  });
              }
          };
      };
  };
};
CustomEmitter.prototype = EventEmitter.prototype;

async function fetchUrl({
  body,
  headers = {"content-type": "application/json"},
  method = "POST",
  url
}) {
  const {
      default: fetch
  } = await import("node-fetch");
  const options = {headers, method};
  if (body !== null) {
      options.body = JSON.stringify(body);
  }
  return fetch(url, options);
}

function sendResponse(res, content, data = {}) {
  const statusCode = content.status ? content.status : 200;
  res.status(statusCode).json({
    data,
    message: content.message,
  });
}

function errorHandler(func) {
  return async function handleEndPoint(req, res, next) {
    let err;
    let content;
    try {
      await func(req, res, next);
    } catch (error) {
      console.dir(error);
      if (ValidationError.prototype.isPrototypeOf(error)) {
        err = errors.invalidValues;
        content = error.errors
          .map(function ({ message }) {
            return message.replace(/^\w*\./, "");
          }, {})
          .join(" and ");
        return sendResponse(res, err, content);
      } else {
        err = errors.internalError;
        return sendResponse(res, err);
      }
    }
  };
}

/**this property is added because sequelize uses lodash internally
* to check if an attribute is a plain object and if not it will do this
* { type: attribute } which will raise exception when constructing the sql
*/
const mergableObject = {
  constructor: Object,
  with(opts) {
      const result = this ?? mergableObject;
      if (typeof opts === "object") {
          Object.entries(opts ?? {}).forEach(function ([key, value]) {
              result[key] = value;
          });
      }
      return result;
  }
};

function fileExists(path) {
  if (typeof path === "string") {
    return new Promise(function (res) {
      fs.access(path, fs.constants.F_OK, function (err) {
        if (err) {
          res(false);
        } else {
          res(true);
        }
      });
    });
  } else {
    return Promise.resolve(false);
  }
}

function jwtWrapper(expiresIn = expiration) {
  return {
    sign(payload) {
      return jwt.sign(payload, secret, { expiresIn });
    },
    verify: async function (token) {
      let verifiedToken;
      try {
        verifiedToken = await new Promise(function tokenExecutor(res, rej) {
          jwt.verify(token, secret, function (err, decoded) {
            if (decoded === undefined) {
              rej(err);
            } else {
              res(decoded);
            }
          });
        });
        return { token: verifiedToken, valid: true };
      } catch (error) {
        return { errorCode: error.code, valid: false };
      }
    }
  };
}
function pathToURL(filePath) {
  let rootDir;
  if (typeof filePath === "string" && filePath.length > 0) {
      rootDir = path.normalize(path.dirname(filePath)).split(path.sep).at(-1);
      return "/" + rootDir + "/" + path.basename(filePath);
  }
}
function propertiesPicker(object) {
  return function (props) {
    let result;
    if (typeof object === "object") {
      result = Object.entries(object).reduce(function (acc, entry) {
        let [key, value] = entry;
        if (props.includes(key) && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, Object.create(null));
    }
    if (Object.keys(result || {}).length > 0) {
      return result;
    }
  };
}
function formatDbPoint(dbPoint) {
  let result = null;
  if (dbPoint !== null && dbPoint !== undefined) {
      result = {
          latitude: dbPoint.coordinates[0],
          longitude: dbPoint.coordinates[1]
      };
  }
  return result;
}

function getPaymentService(paymentModel) {
  async function initiatePayment(payload, clientId, productId) {
      let response;
      const config = getPaymentConfig();
      try {
          response = await fetchUrl({
              body: payload,
              headers: {
                  Authorization: `Bearer ${config.flw_key}`,
                  "Content-Type": "application/json"
              },
              url: config.url_charge
          });
      } catch (error) {
          response = errors.internalError;
          console.error(error);
          return {
              code: response.status,
              init: false,
              message: response.message
          };
      }
      if (response.ok) {
          response = await response.json();
          response = response.data.id;
          await paymentModel.create({clientId, productId, transId: response});
          return {init: true};
      } else {
          response = await response.json();
          return {
              code: errors.paymentSendingFail.status,
              content: response.message,
              init: false,
              message: errors.paymentSendingFail.message
          };
      }
  }

  async function verifyPayment(expectedAmount, id) {
      let response;
      const config = getPaymentConfig(id);
      response = await fetchUrl({
          headers: {
              Authorization: `Bearer ${config.flw_key}`,
              "Content-Type": "application/json"
          },
          method: "GET",
          url: config.url_verify
      });
      if (response.ok) {
          response = await response.json();
          if (
              response.data.status === "successful" &&
              response.data.amount >= expectedAmount &&
              response.data.currency === config.expect_currency
          ) {
              return {verifiedTrans: true};
          } else {
              return {
                  code: errors.paymentApproveFail.status,
                  message: errors.paymentApproveFail.message,
                  verifiedTrans: false
              };
          }
      } else {
          response = await response.json();
          return {
              code: errors.paymentApproveFail.status,
              message: errors.paymentApproveFail.message,
              verifiedTrans: false
          };
      }
  }
  return Object.freeze({initiatePayment, verifyPayment});
}
function paymentManager(paymentService) {
  return {
      initTransaction: function (payload, clientId, productId) {
          return paymentService.initiatePayment(payload, clientId, productId);
      },
      verifyTransaction: function (expectedAmount, id) {
          return paymentService.verifyPayment(expectedAmount, id);
      }
  };
}

function ressourcePaginator(getRessources, expiration = 3600000) {
  const tokenManager = jwtWrapper(expiration);
  async function handleInvalidToken({
      getParams,
      maxPageSize,
      refreshed = false
  }) {
      let nextPageToken = null;
      const {lastId, values} = await getRessources(
          getParams({maxSize: maxPageSize, offset: 0})
      );
      if (Array.isArray(values) && values.length > 0) {
          nextPageToken = tokenManager.sign({
              lastId,
              offset: maxPageSize
          });
      }
      return {nextPageToken, refreshed, results: values};
  }
  async function handleValidToken({
      getParams,
      maxPageSize,
      skip,
      tokenDatas = {}
  }) {
      let nextPageToken;
      let offset;
      let results;
      offset = (
          Number.isFinite(skip)
          ? skip
          : tokenDatas.offset
      );
      results = await getRessources(getParams({
          maxSize: maxPageSize,
          offset
      }));
      nextPageToken = (
          results.values.length < maxPageSize
          ? null
          : tokenManager.sign({
              lastId: results.lastId,
              offset: offset + maxPageSize
          })
      );
      if (
          (results.formerLastId !== tokenDatas.lastId) &&
          (nextPageToken !== null) &&
          (!Number.isFinite(skip))
      ) {
          results = await handleInvalidToken({
              getParams,
              maxSize: maxPageSize,
              refreshed: true
          });
      } else {
          results = {
              nextPageToken,
              refreshed: false,
              results: results.values
          };
      }
      return results;
  }

  return async function paginate({
      getParams = cloneObject,
      maxPageSize,
      pageToken,
      skip
  }) {
      let results;
      let datas;
      if (Number.isFinite(skip)) {
          return handleValidToken({
              getParams,
              maxPageSize,
              skip
          });
      }
      try {
          datas = await tokenManager.verify(pageToken);
          if (datas.valid) {
              results = await handleValidToken({
                  getParams,
                  maxPageSize,
                  tokenDatas: datas.token
              });
          } else {
              results = await handleInvalidToken({getParams, maxPageSize});
          }
      } catch (ignore) {
          results = await handleInvalidToken({getParams, maxPageSize});
      }
      return results;
  };
}

module.exports = Object.freeze({
  CustomEmitter,
  comparePassword(givenPassword, hash) {
    return new Promise(function executor(resolve, reject) {
      bcrypt.compare(givenPassword, hash, function (err, result) {
        if (err !== null && err !== undefined) {
          reject(err);
        }
        resolve(result === true);
      });
    });
  },
  errorHandler,
  hashPassword(password) {
    return new Promise(function executor(resolve, reject){
      bcrypt.hash(password, 10, function(err, result){
        if(err !== null && err !== undefined){
          reject(err);
        }
        resolve(result);
      })
    })
  },
  fileExists,
  jwtWrapper,
  sendResponse,
  pathToURL,
  propertiesPicker,
  formatDbPoint,
  mergableObject,
  paymentManager,
  getPaymentService,
  ressourcePaginator,
});