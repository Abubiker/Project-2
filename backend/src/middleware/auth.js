const { verifyToken } = require("../utils/jwt");
const { createHttpError } = require("../utils/errors");

function authRequired(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(createHttpError(401, "Missing authorization token"));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return next(createHttpError(401, "Invalid or expired token"));
  }
}

module.exports = {
  authRequired,
};
