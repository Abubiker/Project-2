function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createValidationError(zodError) {
  const error = createHttpError(400, "Invalid input");
  error.details = zodError.errors;
  return error;
}

module.exports = {
  createHttpError,
  createValidationError,
};
