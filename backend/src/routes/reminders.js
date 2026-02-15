const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { createHttpError } = require("../utils/errors");
const { createTransport } = require("../utils/mailer");
const config = require("../config");

const router = express.Router();

const runSchema = z.object({
  dryRun: z.boolean().optional(),
});

function toDateOnly(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function daysBetween(a, b) {
  const start = new Date(a);
  const end = new Date(b);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

async function getRuleForInvoice(invoice) {
  const ruleResult = await db.query(
    `SELECT id, days_before_due AS "daysBefore", days_after_due AS "daysAfter"
     FROM reminder_rules
     WHERE user_id = $1 AND enabled = true
       AND (invoice_id = $2 OR invoice_id IS NULL)
       AND (client_id = $3 OR client_id IS NULL)
     ORDER BY
       CASE WHEN invoice_id IS NOT NULL THEN 0 ELSE 1 END,
       CASE WHEN client_id IS NOT NULL THEN 0 ELSE 1 END
     LIMIT 1`,
    [invoice.userId, invoice.id, invoice.clientId]
  );

  if (!ruleResult.rows.length) {
    return { id: null, daysBefore: 3, daysAfter: 3 };
  }

  return ruleResult.rows[0];
}

async function alreadySent(invoiceId, reminderType, scheduledFor) {
  const result = await db.query(
    `SELECT id FROM reminder_logs
     WHERE invoice_id = $1 AND reminder_type = $2 AND scheduled_for = $3 AND status = 'sent'`,
    [invoiceId, reminderType, scheduledFor]
  );
  return result.rows.length > 0;
}

async function logReminder({ ruleId, invoiceId, reminderType, scheduledFor, status, error }) {
  await db.query(
    `INSERT INTO reminder_logs (rule_id, invoice_id, reminder_type, scheduled_for, status, error, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $5 = 'sent' THEN NOW() ELSE NULL END)`,
    [ruleId, invoiceId, reminderType, scheduledFor, status, error || null]
  );
}

router.post("/run", async (req, res, next) => {
  try {
    if (config.cronSecret) {
      const secret = req.headers["x-cron-secret"];
      if (secret !== config.cronSecret) {
        throw createHttpError(401, "Invalid cron secret");
      }
    }

    const data = runSchema.parse(req.body || {});
    const dryRun = Boolean(data.dryRun);
    const today = toDateOnly(new Date().toISOString());

    const invoiceResult = await db.query(
      `SELECT invoices.id, invoices.user_id AS "userId", invoices.client_id AS "clientId",
              invoices.number, invoices.currency, invoices.total, invoices.status,
              invoices.issue_date AS "issueDate", invoices.due_date AS "dueDate",
              clients.email AS "clientEmail", clients.name AS "clientName"
       FROM invoices
       JOIN clients ON clients.id = invoices.client_id
       WHERE invoices.status IN ('sent', 'overdue')
         AND clients.email IS NOT NULL`
    );

    const transport = createTransport();
    if (!transport && !dryRun) {
      throw createHttpError(501, "SMTP is not configured");
    }

    const results = [];

    for (const invoice of invoiceResult.rows) {
      const rule = await getRuleForInvoice(invoice);
      const dueDate = toDateOnly(invoice.dueDate);
      const daysToDue = daysBetween(today, dueDate);
      const daysOverdue = daysBetween(dueDate, today);

      if (daysToDue === rule.daysBefore) {
        const reminderType = "before_due";
        if (!(await alreadySent(invoice.id, reminderType, today))) {
          if (!dryRun) {
            await transport.sendMail({
              from: config.smtp.from,
              to: invoice.clientEmail,
              subject: `Reminder: Invoice ${invoice.number} is due soon`,
              text: `Hello ${invoice.clientName || ""},\n\nYour invoice ${invoice.number} is due on ${dueDate}.\n\nThank you.`,
            });
          }
          await logReminder({
            ruleId: rule.id,
            invoiceId: invoice.id,
            reminderType,
            scheduledFor: today,
            status: "sent",
          });
          results.push({ invoiceId: invoice.id, type: reminderType, status: "sent" });
        }
      }

      if (daysOverdue === rule.daysAfter && daysOverdue > 0) {
        const reminderType = "overdue";
        if (!(await alreadySent(invoice.id, reminderType, today))) {
          if (!dryRun) {
            await transport.sendMail({
              from: config.smtp.from,
              to: invoice.clientEmail,
              subject: `Overdue: Invoice ${invoice.number}`,
              text: `Hello ${invoice.clientName || ""},\n\nYour invoice ${invoice.number} is overdue since ${dueDate}.\n\nPlease arrange payment.`,
            });
          }
          await logReminder({
            ruleId: rule.id,
            invoiceId: invoice.id,
            reminderType,
            scheduledFor: today,
            status: "sent",
          });
          results.push({ invoiceId: invoice.id, type: reminderType, status: "sent" });
        }
      }
    }

    res.json({ ok: true, dryRun, processed: results.length, results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
