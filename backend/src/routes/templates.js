const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { createHttpError, createValidationError } = require("../utils/errors");

const router = express.Router();

const templateSchema = z.object({
  name: z.string().min(1),
  data: z.record(z.any()).default({}),
});

router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, data, created_at AS "createdAt"
       FROM invoice_templates
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ templates: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = templateSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO invoice_templates (user_id, name, data)
       VALUES ($1, $2, $3)
       RETURNING id, name, data, created_at AS "createdAt"`,
      [req.user.id, data.name, data.data]
    );
    res.status(201).json({ template: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createValidationError(error));
    }
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = templateSchema.parse(req.body);
    const result = await db.query(
      `UPDATE invoice_templates
       SET name = $1, data = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, data, created_at AS "createdAt"`,
      [data.name, data.data, req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      throw createHttpError(404, "Template not found");
    }
    res.json({ template: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createValidationError(error));
    }
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      "DELETE FROM invoice_templates WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      throw createHttpError(404, "Template not found");
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
