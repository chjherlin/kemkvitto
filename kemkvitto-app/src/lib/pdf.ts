import { jsPDF } from "jspdf";

interface ReceiptLine {
  name: string;
  qty: number;
  bet: boolean;
  unitPrice: number;
}

interface ReceiptPDFData {
  receiptNumber: number;
  tagNumber?: string | null;
  businessName: string;
  brandColor: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string;
  dropOffDate: string | null;
  deliveryDate: string;
  lines: ReceiptLine[];
  betPrice: number;
  totalAmount: number; // in kr
  comment: string | null;
  paymentUrl: string | null;
  paid?: boolean;
  services?: string[];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function generateReceiptPDF(data: ReceiptPDFData): Buffer {
  const doc = new jsPDF({ unit: "mm", format: [80, 200] }); // receipt-width paper
  const brand = hexToRgb(data.brandColor);
  const pageWidth = 80;
  const margin = 6;
  const contentWidth = pageWidth - margin * 2;
  let y = 8;

  // --- Header: Business name ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brand[0], brand[1], brand[2]);
  doc.text(data.businessName, pageWidth / 2, y, { align: "center" });
  y += 7;

  // --- Receipt number ---
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Kvitto #${data.receiptNumber}`, pageWidth / 2, y, { align: "center" });
  y += 6;

  // --- Divider ---
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // --- Customer info ---
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  if (data.customerName) {
    doc.text(data.customerName, margin, y);
    y += 4;
  }
  if (data.customerPhone) {
    doc.text(data.customerPhone, margin, y);
    y += 4;
  }
  if (data.customerEmail) {
    doc.text(data.customerEmail, margin, y);
    y += 4;
  }
  y += 2;

  // --- Dates ---
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  if (data.dropOffDate) {
    doc.text(`Inl\u00e4mnat: ${data.dropOffDate}`, margin, y);
    y += 3.5;
  }
  doc.text(`F\u00e4rdigt: ${data.deliveryDate}`, margin, y);
  y += 5;

  // --- Services ---
  if (data.services && data.services.length > 0) {
    const serviceNames: Record<string, string> = { pressning: "Pressning", starkning: "Stärkning", vikning: "Vikning", express: "Express" };
    const serviceText = data.services.map(s => serviceNames[s] || s).join(", ");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(serviceText, margin, y);
    y += 4;
  }

  // --- Payment status ---
  if (data.paid) {
    doc.setFontSize(7);
    doc.setTextColor(22, 163, 74); // green
    doc.text("\u2713 Betald", margin, y);
  } else {
    doc.setFontSize(7);
    doc.setTextColor(202, 138, 4); // amber
    doc.text("Ej betald", margin, y);
  }
  y += 4;

  // --- Divider ---
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // --- Line items header ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(130, 130, 130);
  doc.text("PLAGG", margin, y);
  doc.text("ANT", margin + contentWidth * 0.55, y, { align: "right" });
  doc.text("PRIS", margin + contentWidth * 0.75, y, { align: "right" });
  doc.text("SUMMA", margin + contentWidth, y, { align: "right" });
  y += 4;

  // --- Line items ---
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8);

  for (const line of data.lines) {
    const lineTotal = line.qty * line.unitPrice;
    const displayName = line.name;
    doc.text(displayName, margin, y);
    doc.text(String(line.qty), margin + contentWidth * 0.55, y, { align: "right" });
    doc.text(`${line.unitPrice}`, margin + contentWidth * 0.75, y, { align: "right" });
    doc.text(`${lineTotal}`, margin + contentWidth, y, { align: "right" });
    y += 4;
  }

  // --- Total ---
  y += 1;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brand[0], brand[1], brand[2]);
  doc.text("TOTALT", margin, y);
  doc.text(`${data.totalAmount} kr`, margin + contentWidth, y, { align: "right" });
  y += 4;

  // VAT
  const vatAmount = Math.round(data.totalAmount * 0.25 / 1.25);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text(`varav moms (25%): ${vatAmount} kr`, margin, y);
  y += 6;

  // --- Comment ---
  if (data.comment) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Kommentar:", margin, y);
    y += 3.5;
    doc.setTextColor(60, 60, 60);
    const commentLines = doc.splitTextToSize(data.comment, contentWidth);
    doc.text(commentLines, margin, y);
    y += commentLines.length * 3.5 + 2;
  }

  // --- Payment link ---
  if (data.paymentUrl) {
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(brand[0], brand[1], brand[2]);
    doc.text("Betala h\u00e4r:", margin, y);
    y += 3.5;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(6);
    const urlLines = doc.splitTextToSize(data.paymentUrl, contentWidth);
    doc.text(urlLines, margin, y);
    y += urlLines.length * 3 + 2;
  }

  // --- Footer ---
  y += 3;
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("Tack f\u00f6r ditt bes\u00f6k!", pageWidth / 2, y, { align: "center" });

  // Trim the page height to content
  const finalHeight = y + 8;
  const trimmedDoc = new jsPDF({ unit: "mm", format: [80, finalHeight] });

  // Re-render to trimmed page
  // jsPDF doesn't support page resize, so we regenerate
  return Buffer.from(generateTrimmedPDF(data, finalHeight));
}

function generateTrimmedPDF(data: ReceiptPDFData, height: number): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: [80, height] });
  const brand = hexToRgb(data.brandColor);
  const pageWidth = 80;
  const margin = 6;
  const contentWidth = pageWidth - margin * 2;
  let y = 8;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brand[0], brand[1], brand[2]);
  doc.text(data.businessName, pageWidth / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Kvitto #${data.receiptNumber}`, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  if (data.customerName) { doc.text(data.customerName, margin, y); y += 4; }
  if (data.customerPhone) { doc.text(data.customerPhone, margin, y); y += 4; }
  if (data.customerEmail) { doc.text(data.customerEmail, margin, y); y += 4; }
  y += 2;

  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  if (data.dropOffDate) { doc.text(`Inl\u00e4mnat: ${data.dropOffDate}`, margin, y); y += 3.5; }
  doc.text(`F\u00e4rdigt: ${data.deliveryDate}`, margin, y);
  y += 5;

  // --- Services ---
  if (data.services && data.services.length > 0) {
    const serviceNames: Record<string, string> = { pressning: "Pressning", starkning: "Stärkning", vikning: "Vikning", express: "Express" };
    const serviceText = data.services.map(s => serviceNames[s] || s).join(", ");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(serviceText, margin, y);
    y += 4;
  }

  // --- Payment status ---
  if (data.paid) {
    doc.setFontSize(7);
    doc.setTextColor(22, 163, 74); // green
    doc.text("\u2713 Betald", margin, y);
  } else {
    doc.setFontSize(7);
    doc.setTextColor(202, 138, 4); // amber
    doc.text("Ej betald", margin, y);
  }
  y += 4;

  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(130, 130, 130);
  doc.text("PLAGG", margin, y);
  doc.text("ANT", margin + contentWidth * 0.55, y, { align: "right" });
  doc.text("PRIS", margin + contentWidth * 0.75, y, { align: "right" });
  doc.text("SUMMA", margin + contentWidth, y, { align: "right" });
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8);

  for (const line of data.lines) {
    const lineTotal = line.qty * line.unitPrice;
    const displayName = line.name;
    doc.text(displayName, margin, y);
    doc.text(String(line.qty), margin + contentWidth * 0.55, y, { align: "right" });
    doc.text(`${line.unitPrice}`, margin + contentWidth * 0.75, y, { align: "right" });
    doc.text(`${lineTotal}`, margin + contentWidth, y, { align: "right" });
    y += 4;
  }

  y += 1;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brand[0], brand[1], brand[2]);
  doc.text("TOTALT", margin, y);
  doc.text(`${data.totalAmount} kr`, margin + contentWidth, y, { align: "right" });
  y += 4;

  const vatAmount = Math.round(data.totalAmount * 0.25 / 1.25);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text(`varav moms (25%): ${vatAmount} kr`, margin, y);
  y += 6;

  if (data.comment) {
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Kommentar:", margin, y);
    y += 3.5;
    doc.setTextColor(60, 60, 60);
    const commentLines = doc.splitTextToSize(data.comment, contentWidth);
    doc.text(commentLines, margin, y);
    y += commentLines.length * 3.5 + 2;
  }

  if (data.paymentUrl) {
    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(brand[0], brand[1], brand[2]);
    doc.text("Betala h\u00e4r:", margin, y);
    y += 3.5;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(6);
    const urlLines = doc.splitTextToSize(data.paymentUrl, contentWidth);
    doc.text(urlLines, margin, y);
  }

  return doc.output("arraybuffer");
}
