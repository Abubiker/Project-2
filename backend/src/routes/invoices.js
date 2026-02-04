const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { createHttpError } = require("../utils/errors");
const { generateInvoiceNumber } = require("../utils/invoiceNumber");
const { buildInvoicePdf } = require("../utils/invoicePdf");
const { createTransport } = require("../utils/mailer");
const config = require("../config");

const router = express.Router();

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  templateId: z.string().uuid().optional().nullable(),
  number: z.string().optional().nullable(),
  currency: z.string().min(1).default("USD"),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional().nullable(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
  taxRate: z.number().nonnegative().optional(),
  items: z.array(itemSchema).min(1),
});

const updateInvoiceSchema = createInvoiceSchema.extend({
  number: z.string().min(1),
});

router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT invoices.id, invoices.number, invoices.status, invoices.currency,
              invoices.issue_date AS "issueDate", invoices.due_date AS "dueDate",
              invoices.total, invoices.created_at AS "createdAt",
              clients.name AS "clientName"
       FROM invoices
       JOIN clients ON clients.id = invoices.client_id
       WHERE invoices.user_id = $1
       ORDER BY invoices.created_at DESC`,
      [req.user.id]
    );
    res.json({ invoices: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const invoiceResult = await db.query(
      `SELECT id, client_id AS "clientId", template_id AS "templateId",
              number, status, currency, issue_date AS "issueDate", due_date AS "dueDate",
              subtotal, tax, total, notes, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM invoices
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!invoiceResult.rows.length) {
      throw createHttpError(404, "Invoice not found");
    }

    const itemsResult = await db.query(
      `SELECT id, description, quantity, unit_price AS "unitPrice", amount
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json({ invoice: { ...invoiceResult.rows[0], items: itemsResult.rows } });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const data = createInvoiceSchema.parse(req.body);

    const rawNumber = data.number ? data.number.trim() : "";

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = data.taxRate ? subtotal * data.taxRate : 0;
    const total = subtotal + tax;

    await client.query("BEGIN");

    const invoiceNumber = rawNumber || (await generateInvoiceNumber(client, req.user.id));

    const invoiceResult = await client.query(
      `INSERT INTO invoices
        (user_id, client_id, template_id, number, status, currency, issue_date, due_date, subtotal, tax, total, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, client_id AS "clientId", template_id AS "templateId", number, status, currency,
                 issue_date AS "issueDate", due_date AS "dueDate", subtotal, tax, total, notes,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        req.user.id,
        data.clientId,
        data.templateId,
        invoiceNumber,
        data.status || "draft",
        data.currency,
        data.issueDate,
        data.dueDate,
        subtotal,
        tax,
        total,
        data.notes,
      ]
    );

    const invoice = invoiceResult.rows[0];

    for (const item of data.items) {
      const amount = item.quantity * item.unitPrice;
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.id, item.description, item.quantity, item.unitPrice, amount]
      );
    }

    await client.query("COMMIT");

    const itemsResult = await db.query(
      `SELECT id, description, quantity, unit_price AS "unitPrice", amount
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY created_at ASC`,
      [invoice.id]
    );

    res.status(201).json({ invoice: { ...invoice, items: itemsResult.rows } });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, "Invalid input"));
    }
    return next(error);
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const data = updateInvoiceSchema.parse(req.body);

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = data.taxRate ? subtotal * data.taxRate : 0;
    const total = subtotal + tax;

    await client.query("BEGIN");

    const invoiceResult = await client.query(
      `UPDATE invoices
       SET client_id = $1, template_id = $2, number = $3, status = $4, currency = $5,
           issue_date = $6, due_date = $7, subtotal = $8, tax = $9, total = $10, notes = $11,
           updated_at = NOW()
       WHERE id = $12 AND user_id = $13
       RETURNING id, client_id AS "clientId", template_id AS "templateId", number, status, currency,
                 issue_date AS "issueDate", due_date AS "dueDate", subtotal, tax, total, notes,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.clientId,
        data.templateId,
        data.number.trim(),
        data.status || "draft",
        data.currency,
        data.issueDate,
        data.dueDate,
        subtotal,
        tax,
        total,
        data.notes,
        req.params.id,
        req.user.id,
      ]
    );

    if (!invoiceResult.rows.length) {
      throw createHttpError(404, "Invoice not found");
    }

    await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [req.params.id]);

    for (const item of data.items) {
      const amount = item.quantity * item.unitPrice;
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.id, item.description, item.quantity, item.unitPrice, amount]
      );
    }

    await client.query("COMMIT");

    const itemsResult = await db.query(
      `SELECT id, description, quantity, unit_price AS "unitPrice", amount
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json({ invoice: { ...invoiceResult.rows[0], items: itemsResult.rows } });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, "Invalid input"));
    }
    return next(error);
  } finally {
    client.release();
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      "DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      throw createHttpError(404, "Invoice not found");
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const statusSchema = z.object({
      status: z.enum(["draft", "sent", "paid", "overdue"]),
    });
    const data = statusSchema.parse(req.body);

    const result = await db.query(
      `UPDATE invoices
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, status`,
      [data.status, req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      throw createHttpError(404, "Invoice not found");
    }

    res.json({ invoice: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, "Invalid input"));
    }
    return next(error);
  }
});

router.post("/:id/send-email", async (req, res, next) => {
  try {
    const emailSchema = z.object({
      to: z.string().email().optional().nullable(),
      message: z.string().optional().nullable(),
    });
    const data = emailSchema.parse(req.body || {});

    const invoiceResult = await db.query(
      `SELECT invoices.id, invoices.number, invoices.status, invoices.currency,
              invoices.issue_date AS "issueDate", invoices.due_date AS "dueDate",
              invoices.subtotal, invoices.tax, invoices.total, invoices.notes,
              clients.name AS "clientName", clients.email AS "clientEmail",
              clients.company AS "clientCompany", clients.phone AS "clientPhone",
              clients.address AS "clientAddress", clients.tax_id AS "clientTaxId"
       FROM invoices
       JOIN clients ON clients.id = invoices.client_id
       WHERE invoices.id = $1 AND invoices.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!invoiceResult.rows.length) {
      throw createHttpError(404, "Invoice not found");
    }

    const itemsResult = await db.query(
      `SELECT description, quantity, unit_price AS "unitPrice", amount
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    const userResult = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.user.id]
    );

    const invoiceRow = invoiceResult.rows[0];
    const user = userResult.rows[0];

    const recipient = data.to || invoiceRow.clientEmail;
    if (!recipient) {
      throw createHttpError(400, "Recipient email is missing");
    }

    const transport = createTransport();
    if (!transport) {
      throw createHttpError(501, "SMTP is not configured");
    }

    const pdfBuffer = await buildInvoicePdf({
      invoice: {
        number: invoiceRow.number,
        status: invoiceRow.status,
        currency: invoiceRow.currency,
        issueDate: invoiceRow.issueDate,
        dueDate: invoiceRow.dueDate,
        subtotal: invoiceRow.subtotal,
        tax: invoiceRow.tax,
        total: invoiceRow.total,
        notes: invoiceRow.notes,
      },
      client: {
        name: invoiceRow.clientName,
        email: invoiceRow.clientEmail,
        company: invoiceRow.clientCompany,
        phone: invoiceRow.clientPhone,
        address: invoiceRow.clientAddress,
        taxId: invoiceRow.clientTaxId,
      },
      items: itemsResult.rows,
      user,
    });

    const subject = `Invoice ${invoiceRow.number}`;
    const text =
      data.message || `Hello,\\n\\nPlease find attached invoice ${invoiceRow.number}.\\n\\nThank you.`;

    await transport.sendMail({
      from: config.smtp.from,
      to: recipient,
      subject,
      text,
      attachments: [
        {
          filename: `${invoiceRow.number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.json({ ok: true, message: "Email sent" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, "Invalid input"));
    }
    return next(error);
  }
});

router.get("/:id/pdf", async (req, res, next) => {
  try {
    const invoiceResult = await db.query(
      `SELECT invoices.id, invoices.number, invoices.status, invoices.currency,
              invoices.issue_date AS "issueDate", invoices.due_date AS "dueDate",
              invoices.subtotal, invoices.tax, invoices.total, invoices.notes,
              clients.name AS "clientName", clients.email AS "clientEmail",
              clients.company AS "clientCompany", clients.phone AS "clientPhone",
              clients.address AS "clientAddress", clients.tax_id AS "clientTaxId"
       FROM invoices
       JOIN clients ON clients.id = invoices.client_id
       WHERE invoices.id = $1 AND invoices.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!invoiceResult.rows.length) {
      throw createHttpError(404, "Invoice not found");
    }

    const itemsResult = await db.query(
      `SELECT description, quantity, unit_price AS "unitPrice", amount
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    const userResult = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.user.id]
    );

    const invoiceRow = invoiceResult.rows[0];
    const user = userResult.rows[0];

    const pdfBuffer = await buildInvoicePdf({
      invoice: {
        number: invoiceRow.number,
        status: invoiceRow.status,
        currency: invoiceRow.currency,
        issueDate: invoiceRow.issueDate,
        dueDate: invoiceRow.dueDate,
        subtotal: invoiceRow.subtotal,
        tax: invoiceRow.tax,
        total: invoiceRow.total,
        notes: invoiceRow.notes,
      },
      client: {
        name: invoiceRow.clientName,
        email: invoiceRow.clientEmail,
        company: invoiceRow.clientCompany,
        phone: invoiceRow.clientPhone,
        address: invoiceRow.clientAddress,
        taxId: invoiceRow.clientTaxId,
      },
      items: itemsResult.rows,
      user,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=\"${invoiceRow.number}.pdf\"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/stripe-session", async (_req, res) => {
  res.json({
    ok: true,
    message: "Stripe integration is not implemented yet. Placeholder endpoint.",
  });
});

module.exports = router;
