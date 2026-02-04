const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");

const authRoutes = require("./routes/auth");
const clientsRoutes = require("./routes/clients");
const templatesRoutes = require("./routes/templates");
const invoicesRoutes = require("./routes/invoices");

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "invoice-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/invoices", invoicesRoutes);

// Not found handler
app.use((_req, _res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
});

module.exports = app;
