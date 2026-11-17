import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';

import { InvoiceDraft } from '../models/invoice.model';
import { formatDate, formatMoney } from '../utils/format';
import { calculateTotals, lineTotal } from '../utils/invoice-calc';

const ACCENT: [number, number, number] = [79, 70, 229];
const DARK: [number, number, number] = [27, 34, 50];
const MUTED: [number, number, number] = [88, 97, 116];
const LIGHT: [number, number, number] = [138, 148, 166];
const RULE: [number, number, number] = [226, 229, 235];

const PAGE_WIDTH = 210;
const MARGIN = 18;
const RIGHT = PAGE_WIDTH - MARGIN;

/**
 * Builds a real, text-based PDF (selectable text, small file size) instead of
 * rasterising the preview. jsPDF is loaded on demand so it stays out of the main bundle.
 */
@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async download(invoice: InvoiceDraft): Promise<void> {
    const doc = await this.build(invoice);
    doc.save(`${fileName(invoice.number)}.pdf`);
  }

  async build(invoice: InvoiceDraft): Promise<jsPDF> {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const money = (value: number) => pdfSafe(formatMoney(value, invoice.currency));
    const totals = calculateTotals(invoice.items, invoice.taxRate, invoice.discountType, invoice.discount);

    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, PAGE_WIDTH, 4, 'F');

    // Sender
    let y = 24;
    doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...DARK);
    doc.text(invoice.from.name || 'Your business', MARGIN, y);

    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...MUTED);
    const senderLines = [
      ...splitLines(invoice.from.address),
      invoice.from.email,
      invoice.from.phone,
      invoice.from.taxId,
    ].filter(Boolean);
    doc.text(senderLines, MARGIN, y + 6, { lineHeightFactor: 1.45 });

    // Title block
    doc.setFont('helvetica', 'bold').setFontSize(24).setTextColor(...ACCENT);
    doc.text('INVOICE', RIGHT, y + 1, { align: 'right' });
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED);
    doc.text(invoice.number, RIGHT, y + 8, { align: 'right' });

    if (invoice.status === 'paid') {
      doc.setDrawColor(6, 118, 71).setLineWidth(0.6);
      doc.roundedRect(RIGHT - 24, y + 13, 24, 9, 1.5, 1.5, 'S');
      doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(6, 118, 71);
      doc.text('PAID', RIGHT - 12, y + 19.3, { align: 'center', charSpace: 1 });
    }

    y = Math.max(y + 6 + senderLines.length * 5, y + 26) + 6;
    divider(doc, y);

    // Client + dates
    y += 9;
    label(doc, 'BILL TO', MARGIN, y);
    doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...DARK);
    doc.text(invoice.to.name || 'Client', MARGIN, y + 6);
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...MUTED);
    const clientLines = [...splitLines(invoice.to.address), invoice.to.email, invoice.to.taxId].filter(Boolean);
    doc.text(clientLines, MARGIN, y + 11.5, { lineHeightFactor: 1.45 });

    label(doc, 'ISSUE DATE', RIGHT - 40, y, 'right');
    label(doc, 'DUE DATE', RIGHT, y, 'right');
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...DARK);
    doc.text(formatDate(invoice.issueDate), RIGHT - 40, y + 6, { align: 'right' });
    doc.text(formatDate(invoice.dueDate), RIGHT, y + 6, { align: 'right' });

    label(doc, 'AMOUNT DUE', RIGHT, y + 16, 'right');
    doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...ACCENT);
    doc.text(money(invoice.status === 'paid' ? 0 : totals.total), RIGHT, y + 23, { align: 'right' });

    y = Math.max(y + 11.5 + clientLines.length * 5, y + 28) + 4;
    divider(doc, y);

    // Line items
    autoTable(doc, {
      startY: y + 6,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'plain',
      head: [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'AMOUNT']],
      body: invoice.items.map((item) => [
        pdfSafe(item.description),
        String(item.quantity),
        money(item.unitPrice),
        money(lineTotal(item)),
      ]),
      styles: { font: 'helvetica', fontSize: 9.5, textColor: DARK, cellPadding: { top: 3, bottom: 3, left: 0, right: 0 } },
      headStyles: { fontSize: 8, fontStyle: 'bold', textColor: MUTED },
      columnStyles: {
        1: { halign: 'right', cellWidth: 18 },
        2: { halign: 'right', cellWidth: 32 },
        3: { halign: 'right', cellWidth: 32 },
      },
      didParseCell: ({ section, column, cell }) => {
        if (section === 'head' && column.index > 0) cell.styles.halign = 'right';
      },
      didDrawCell: ({ section, cell, doc: d }) => {
        d.setDrawColor(...(section === 'head' ? DARK : RULE));
        d.setLineWidth(section === 'head' ? 0.4 : 0.2);
        d.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      },
    });

    // Totals
    y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 8;
    const labelX = RIGHT - 70;
    const row = (text: string, value: string) => {
      doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...MUTED);
      doc.text(text, labelX, y);
      doc.setTextColor(...DARK);
      doc.text(value, RIGHT, y, { align: 'right' });
      y += 6;
    };

    row('Subtotal', money(totals.subtotal));
    if (totals.discount) {
      const name = invoice.discountType === 'percent' ? `Discount (${invoice.discount}%)` : 'Discount';
      row(name, `-${money(totals.discount)}`);
    }
    if (invoice.taxRate) row(`Tax (${invoice.taxRate}%)`, money(totals.tax));

    doc.setDrawColor(...DARK).setLineWidth(0.4);
    doc.line(labelX, y - 2, RIGHT, y - 2);
    y += 4;
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...DARK);
    doc.text(`Total (${invoice.currency})`, labelX, y);
    doc.text(money(totals.total), RIGHT, y, { align: 'right' });

    // Notes
    if (invoice.notes.trim()) {
      y += 16;
      if (y > 260) {
        doc.addPage();
        y = 24;
      }
      divider(doc, y - 6);
      label(doc, 'NOTES', MARGIN, y);
      doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...MUTED);
      doc.text(doc.splitTextToSize(pdfSafe(invoice.notes), RIGHT - MARGIN), MARGIN, y + 6, {
        lineHeightFactor: 1.45,
      });
    }

    doc.setProperties({ title: `Invoice ${invoice.number}`, author: invoice.from.name });
    return doc;
  }
}

function label(doc: jsPDF, text: string, x: number, y: number, align: 'left' | 'right' = 'left'): void {
  doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...LIGHT);
  // jsPDF ignores charSpace when measuring right-aligned text, so only space out left-aligned labels
  doc.text(text, x, y, align === 'left' ? { charSpace: 0.4 } : { align });
}

function divider(doc: jsPDF, y: number): void {
  doc.setDrawColor(...RULE).setLineWidth(0.3);
  doc.line(MARGIN, y, RIGHT, y);
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(pdfSafe);
}

// The built-in PDF fonts only cover Latin-1, so swap the few characters they can't draw.
function pdfSafe(value: string): string {
  return value
    .replace(/[−–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[  ]/g, ' ');
}

function fileName(number: string): string {
  return (number || 'invoice').replace(/[^a-z0-9-_]+/gi, '-');
}
