const nodemailer = require("nodemailer");
const config = require("../config");

let cachedTransport = null;

function createTransport() {
  if (!config.smtp.host || !config.smtp.port || !config.smtp.from) {
    return null;
  }

  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: config.smtp.host,
      port: Number(config.smtp.port),
      secure: Boolean(config.smtp.secure),
      auth: config.smtp.user
        ? {
            user: config.smtp.user,
            pass: config.smtp.pass,
          }
        : undefined,
    });
  }

  return cachedTransport;
}

module.exports = {
  createTransport,
};
