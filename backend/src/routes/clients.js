const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { createHttpError } = require("../utils/errors");

const router = express.Router();

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
});

router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, company, phone, address, tax_id AS "taxId", created_at AS "createdAt"
       FROM clients
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ clients: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = clientSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO clients (user_id, name, email, company, phone, address, tax_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, company, phone, address, tax_id AS "taxId", created_at AS "createdAt"`,
      [req.user.id, data.name, data.email, data.company, data.phone, data.address, data.taxId]
    );
    res.status(201).json({ client: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, "Invalid input"));
    }
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = clientSchema.parse(req.body);
    const result = await db.query(
      `UPDATE clients
       SET name = $1, email = $2, company = $3, phone = $4, address = $5, tax_id = $6
       WHERE id = $7 AND user_id = $8
       RETURNING id, name, email, company, phone, address, tax_id AS "taxId", created_at AS "createdAt"`,
      [data.name, data.email, data.company, data.phone, data.address, data.taxId, req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      throw createHttpError(404, "Client not found");
    }
    res.json({ client: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, "Invalid input"));
    }
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      "DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      throw createHttpError(404, "Client not found");
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
