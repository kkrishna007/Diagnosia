// Lightweight PDF generator for booking receipts using jsPDF
// Note: Ensure jspdf is installed in the project.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoUrl from '../assets/logo.png';

// Brand palette (tailwind-ish): blue/green
const BRAND_BLUE = [37, 99, 235]; // blue-600
const BRAND_GREEN = [16, 185, 129]; // emerald-500
const TEXT_MUTED = 100;
let UNICODE_FONT_READY = false;
let UNICODE_FONT_FAMILY = null; // 'roboto' | 'notosans' | null

async function ensureUnicodeFont(doc) {
  if (UNICODE_FONT_READY) return true;
  let base = '/';
  try { base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/'; } catch {}
  // Try local Roboto variable fonts via multiple robust URL candidates
  const b = String(base).replace(/\/$/, '');
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
  const fontFiles = [
    'Roboto-VariableFont_wdth,wght.ttf',
    'Roboto-Italic-VariableFont_wdth,wght.ttf',
  ];
  const candidates = [];
  for (const file of fontFiles) {
    // Absolute from root and base-prefixed
    candidates.push(`/fonts/${file}`);
    if (b) candidates.push(`${b}/fonts/${file}`);
    // Absolute with origin
    if (origin) candidates.push(`${origin}/fonts/${file}`);
    // Relative (in case app is served from nested path without base)
    candidates.push(`fonts/${file}`);
  }
  for (const url of candidates) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) continue;
      const buffer = await res.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      // Register as a normal Roboto font for jsPDF
      const fileName = 'Roboto-Variable.ttf';
      const fName = 'roboto';
      doc.addFileToVFS(fileName, base64);
      doc.addFont(fileName, fName, 'normal');
      UNICODE_FONT_READY = true;
      UNICODE_FONT_FAMILY = fName;
      return true;
    } catch {
      // try next
    }
  }
  // If we got here, all sources failed — log once to help diagnose
  try {
  // eslint-disable-next-line no-console
  console.warn('[pdf] Unicode font load failed. Falling back to "INR". Ensure /public/fonts/Roboto-VariableFont_wdth,wght.ttf is served at /fonts and matches your BASE_URL.');
  } catch {}
  return false;
}

function inr(amount) {
  // Use ₹ if unicode font is active, else fall back to 'INR'
  const n = Number(amount || 0);
  const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  return UNICODE_FONT_READY ? `₹${num}` : `INR ${num}`;
}

function getTimeSlotLabel(id) {
  const map = {
    '6-8': '6:00 AM - 8:00 AM',
    '8-10': '8:00 AM - 10:00 AM',
    '10-12': '10:00 AM - 12:00 PM',
    '12-14': '12:00 PM - 2:00 PM',
    '14-16': '2:00 PM - 4:00 PM',
    '16-18': '4:00 PM - 6:00 PM',
    '18-20': '6:00 PM - 8:00 PM',
  };
  return map[id] || id || '-';
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateBookingReceipt({ booking, test }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Try to enable Unicode font (for ₹)
  await ensureUnicodeFont(doc);
  // Use helvetica for the document by default; switch only when drawing ₹

  // Top accent bar (blue + green)
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 6, pageWidth, 3, 'F');

  // Letterhead with logo
  try {
    const img = await loadImage(logoUrl);
    const imgH = 42;
    const imgW = (img.width / img.height) * imgH;
    doc.addImage(img, 'PNG', margin, y, imgW, imgH);
  } catch {
    // Logo optional
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Diagnosia Lab', margin + 130, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_MUTED);
  doc.text('www.diagnosia.com', pageWidth - margin - 120, y + 12);
  doc.text('support@diagnosia.com | +91 98765 43210', pageWidth - margin - 200, y + 26);

  y += 56;
  doc.setDrawColor(230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Title and Booking ID bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Booking Receipt', margin, y);

  doc.setFillColor(245);
  doc.setDrawColor(220);
  doc.roundedRect(pageWidth - margin - 260, y - 16, 260, 24, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`Status: Confirmed`, pageWidth - margin - 250, y);
  doc.setTextColor(0);
  doc.text(`Booking ID: ${booking.bookingId ?? '-'}`, pageWidth - margin - 130, y);
  y += 18;

  // Test overview card
  const testName = test?.name || test?.test_name || 'Lab Test';
  const testDesc = test?.description || test?.test_description || '';
  const sampleType = test?.sampleType || test?.sample_type || test?.sample || null;
  const tat = test?.report_time_hours != null ? `${test.report_time_hours} hours` : '24 hours';
  const fastingRequired = test?.fasting_required || test?.fastingRequired || false;
  const fastingHours = test?.fasting_hours ?? null;

  doc.setDrawColor(230);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 90, 8, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(testName, margin + 12, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const wrapped = doc.splitTextToSize(testDesc, pageWidth - margin * 2 - 24);
  doc.text(wrapped, margin + 12, y + 38);

  let detailX = margin + 12;
  let detailY = y + 72;
  if (sampleType) {
    doc.setTextColor(60);
    doc.text('Sample:', detailX, detailY);
    doc.setTextColor(0);
    doc.text(String(sampleType), detailX + 54, detailY);
    detailX += 180;
  }
  doc.setTextColor(60);
  doc.text('Results in:', detailX, detailY);
  doc.setTextColor(0);
  doc.text(String(tat), detailX + 64, detailY);
  detailX += 180;
  if (fastingRequired) {
    doc.setTextColor(60);
    doc.text('Fasting:', detailX, detailY);
    doc.setTextColor(0);
    doc.text(`Required${typeof fastingHours === 'number' ? ` (${fastingHours}h)` : ''}`, detailX + 48, detailY);
  }
  y += 126;

  // Two tables stacked vertically: Patient (top) then Appointment (bottom)
  const fmtDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date)) return String(d);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const patientRows = [
    ['Name', booking.patientName ?? '-'],
    ['Phone', booking.patientPhone ?? '-'],
    ['Email', booking.patientEmail ?? '-'],
  ];
  doc.autoTable({
    startY: y,
    head: [['Patient', 'Details']],
    body: patientRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 120 } },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
  });
  y = doc.lastAutoTable.finalY + 12;

  const apptRows = [
    ['Type', booking.appointmentType === 'home_collection' ? 'Home Collection' : 'Lab Visit'],
    ['Date', fmtDate(booking.selectedDate)],
    ['Time', getTimeSlotLabel(booking.selectedTimeSlot)],
  ];
  if (booking.appointmentType === 'home_collection' && booking.address) {
    apptRows.push(['Address', booking.address]);
  }

  doc.autoTable({
    startY: y,
    head: [['Appointment', 'Details']],
    body: apptRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 120 } },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
  });
  y = doc.lastAutoTable.finalY + 16;

  // Bill breakdown
  const testPrice = Number(test?.base_price ?? test?.price ?? 0);
  const collectionCharge = booking.appointmentType === 'home_collection' ? 300 : 0;
  const billRows = [
    ['Test charge', inr(testPrice)],
  ];
  if (collectionCharge > 0) billRows.push(['Home collection charge', inr(collectionCharge)]);

  doc.autoTable({
    startY: y,
    head: [['Bill Details', 'Amount']],
    body: billRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 11, cellPadding: { top: 6, right: 10, bottom: 6, left: 10 }, overflow: 'hidden' },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: (pageWidth - margin * 2) - 200 },
      1: { halign: 'right', cellWidth: 200, font: (UNICODE_FONT_FAMILY || 'helvetica'), fontStyle: UNICODE_FONT_FAMILY ? 'normal' : 'bold' },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
  });
  y = doc.lastAutoTable.finalY + 12;

  // Amount summary box with Total Paid
  const totalPaid = Number(booking.totalAmount ?? testPrice + collectionCharge);
  doc.setDrawColor(220);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 48, 8, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Paid', margin + 12, y + 18);
  // Amount in Unicode font only, rest stays helvetica
  const amountText = inr(totalPaid);
  const prevFont = 'helvetica';
  const unicodeFont = UNICODE_FONT_FAMILY || prevFont;
  doc.setFont(unicodeFont, 'normal');
  doc.setFontSize(12);
  const amtWidth = doc.getTextWidth(amountText);
  doc.text(amountText, pageWidth - margin - 12 - amtWidth, y + 18);
  // restore
  doc.setFont(prevFont, 'normal');
  y += 64;

  // Additional Notes
  if (booking.notes) {
  doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Additional Notes', margin, y);
    y += 14;
  doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const notesWrapped = doc.splitTextToSize(String(booking.notes), pageWidth - margin * 2);
    doc.text(notesWrapped, margin, y);
    y += 16 + notesWrapped.length * 12;
  }

  // Important Information (mirrors UI; varies by type)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Important Information', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const bullets = [];
  if (booking?.appointmentType === 'home_collection') {
    bullets.push('Our phlebotomist will arrive at your address at the scheduled time. Please be available 15 minutes before.');
    bullets.push('Ensure your phone is reachable and the address details are accurate for smooth collection.');
    bullets.push('A confirmation SMS and email will be sent with detailed instructions.');
  } else {
    bullets.push('Please arrive at the lab 10–15 minutes before your scheduled time.');
    bullets.push('Carry a valid ID proof when you visit the lab.');
    bullets.push('A confirmation SMS and email will be sent with detailed instructions.');
  }
  if (test?.fasting_required || test?.fastingRequired) {
    bullets.push('Please maintain fasting as required for this test. Avoid food and beverages (except water) for the specified duration.');
  }

  const bulletColor = booking?.appointmentType === 'home_collection' ? BRAND_GREEN : BRAND_BLUE;
  bullets.forEach((line) => {
    // dot
    doc.setFillColor(...bulletColor);
    doc.circle(margin + 2, y - 3, 2, 'F');
    // text
    const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2 - 14);
    doc.setTextColor(0);
    doc.text(wrapped, margin + 12, y);
    y += 12 * wrapped.length + 6;
  });

  // Footer note pinned to bottom of page
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 18; // near bottom
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('This is a computer-generated receipt. For assistance, contact support@diagnosia.com.', margin, footerY);

  const fileName = `Diagnosia_Receipt_${booking.bookingId || 'Booking'}.pdf`;
  doc.save(fileName);
}
