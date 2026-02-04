const PDFDocument = require("pdfkit");

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function buildInvoicePdf({ invoice, client, items, user }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Invoice #: ${invoice.number}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Issued: ${invoice.issueDate}`);
    doc.text(`Due: ${invoice.dueDate}`);

    doc.moveDown();
    doc.fontSize(12).text(`From: ${user.name} (${user.email})`);
    doc.text(`To: ${client.name}${client.company ? `, ${client.company}` : ""}`);
    if (client.email) doc.text(`Client email: ${client.email}`);
    if (client.phone) doc.text(`Client phone: ${client.phone}`);
    if (client.address) doc.text(`Client address: ${client.address}`);
    if (client.taxId) doc.text(`Client tax id: ${client.taxId}`);

    doc.moveDown();
    doc.fontSize(12).text("Items", { underline: true });

    let y = doc.y + 10;
    doc.fontSize(10);
    doc.text("Description", 50, y);
    doc.text("Qty", 300, y, { width: 50, align: "right" });
    doc.text("Price", 360, y, { width: 80, align: "right" });
    doc.text("Amount", 450, y, { width: 90, align: "right" });

    y += 18;
    items.forEach((item) => {
      doc.text(item.description, 50, y, { width: 230 });
      doc.text(formatMoney(item.quantity), 300, y, { width: 50, align: "right" });
      doc.text(formatMoney(item.unitPrice), 360, y, { width: 80, align: "right" });
      doc.text(formatMoney(item.amount), 450, y, { width: 90, align: "right" });
      y += 18;
    });

    doc.moveDown(2);
    doc.fontSize(12);
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)} ${invoice.currency}`, { align: "right" });
    doc.text(`Tax: ${formatMoney(invoice.tax)} ${invoice.currency}`, { align: "right" });
    doc.text(`Total: ${formatMoney(invoice.total)} ${invoice.currency}`, { align: "right" });

    if (invoice.notes) {
      doc.moveDown();
      doc.fontSize(11).text("Notes", { underline: true });
      doc.fontSize(10).text(invoice.notes);
    }

    doc.end();
  });
}

module.exports = {
  buildInvoicePdf,
};
