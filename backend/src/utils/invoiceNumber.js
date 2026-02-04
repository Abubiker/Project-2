function formatInvoiceNumber(sequence) {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(4, "0");
  return `INV-${year}-${padded}`;
}

async function generateInvoiceNumber(dbClient, userId, { increment } = { increment: true }) {
  if (!increment) {
    const result = await dbClient.query(
      `SELECT current_number FROM invoice_counters WHERE user_id = $1`,
      [userId]
    );

    const current = result.rows.length ? result.rows[0].current_number : 0;
    return formatInvoiceNumber(current + 1);
  }

  const result = await dbClient.query(
    `INSERT INTO invoice_counters (user_id, current_number)
     VALUES ($1, 1)
     ON CONFLICT (user_id)
     DO UPDATE SET current_number = invoice_counters.current_number + 1, updated_at = NOW()
     RETURNING current_number`,
    [userId]
  );

  const sequence = result.rows[0]?.current_number || 1;
  return formatInvoiceNumber(sequence);
}

module.exports = {
  generateInvoiceNumber,
};
