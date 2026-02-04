const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const db = require("../db");
const { signToken } = require("../utils/jwt");
const { authRequired } = require("../middleware/auth");
const { createHttpError, createValidationError } = require("../utils/errors");

const router = express.Router();

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a symbol");

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await db.query("SELECT id FROM users WHERE email = $1", [data.email]);
    if (existing.rows.length) {
      throw createHttpError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [data.email, passwordHash, data.name]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email });

    res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createValidationError(error));
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await db.query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [data.email]
    );

    if (!result.rows.length) {
      throw createHttpError(401, "Invalid email or password");
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      throw createHttpError(401, "Invalid email or password");
    }

    const token = signToken({ id: user.id, email: user.email });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createValidationError(error));
    }
    return next(error);
  }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, avatar_url AS "avatarUrl" FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      throw createHttpError(404, "User not found");
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch("/password", authRequired, async (req, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const result = await db.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      throw createHttpError(404, "User not found");
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isValid) {
      throw createHttpError(401, "Current password is incorrect");
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.user.id]);

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createValidationError(error));
    }
    return next(error);
  }
});

router.patch("/me", authRequired, async (req, res, next) => {
  const updateSchema = z.object({
    name: z.string().trim().min(1).optional(),
    email: emailSchema.optional(),
    avatarUrl: z.string().max(200000).nullable().optional(),
  });

  try {
    const data = updateSchema.parse(req.body);

    if (data.email) {
      const existing = await db.query(
        "SELECT id FROM users WHERE email = $1 AND id <> $2",
        [data.email, req.user.id]
      );
      if (existing.rows.length) {
        throw createHttpError(409, "Email already registered");
      }
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${index++}`);
      values.push(data.email);
    }
    if (data.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${index++}`);
      values.push(data.avatarUrl);
    }

    if (!updates.length) {
      throw createHttpError(400, "Nothing to update");
    }

    values.push(req.user.id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(", ")}
       WHERE id = $${index}
       RETURNING id, email, name, avatar_url AS "avatarUrl"`,
      values
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createValidationError(error));
    }
    return next(error);
  }
});

module.exports = router;
