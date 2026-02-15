const db = require("../db");

async function syncInvoiceBalance(client, invoiceId) {
  const runner = client || db;

  const invoiceResult = await runner.query(
    "SELECT total, currency, status FROM invoices WHERE id = $1",
    [invoiceId]
  );

  if (!invoiceResult.rows.length) {
    return null;
  }

  const invoice = invoiceResult.rows[0];

  const paymentsResult = await runner.query(
    "SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = $1 AND status = 'completed'",
    [invoiceId]
  );

  const total = Number(invoice.total || 0);
  const paid = Number(paymentsResult.rows[0]?.paid || 0);
  const balance = Number((total - paid).toFixed(2));

  await runner.query(
    `INSERT INTO invoice_balances (invoice_id, currency, total, paid, balance, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (invoice_id)
     DO UPDATE SET currency = EXCLUDED.currency, total = EXCLUDED.total, paid = EXCLUDED.paid, balance = EXCLUDED.balance, updated_at = NOW()`,
    [invoiceId, invoice.currency, total, paid, balance]
  );

  if (balance <= 0 && invoice.status !== "paid") {
    await runner.query(
      "UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2",
      ["paid", invoiceId]
    );
  }

  return {
    invoiceId,
    currency: invoice.currency,
    total,
    paid,
    balance,
  };
}

async function getInvoiceBalance(client, invoiceId) {
  const runner = client || db;

  const balanceResult = await runner.query(
    "SELECT currency, total, paid, balance FROM invoice_balances WHERE invoice_id = $1",
    [invoiceId]
  );

  if (balanceResult.rows.length) {
    return balanceResult.rows[0];
  }

  const synced = await syncInvoiceBalance(runner, invoiceId);
  return synced || null;
}

module.exports = {
  syncInvoiceBalance,
  getInvoiceBalance,
};
