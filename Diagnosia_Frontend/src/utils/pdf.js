// Lightweight PDF generator for booking receipts using jsPDF
// Note: Ensure jspdf is installed in the project.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoUrl from '../assets/logo.png';

// Brand palette (tailwind-ish): blue/green
const BRAND_BLUE = [37, 99, 235]; // blue-600
const BRAND_GREEN = [16, 185, 129]; // emerald-500
const TEXT_MUTED = 100;
// Unicode font cache: keep base64 once, but register into EACH doc instance
let UNICODE_FONT_BASE64 = null; // base64 string of the font file
let UNICODE_FONT_FAMILY = null; // e.g., 'roboto'

async function ensureUnicodeFont(doc) {
  // If we already have the font data, (re)register into this document
  if (UNICODE_FONT_BASE64 && UNICODE_FONT_FAMILY) {
    try {
      const fileName = 'Roboto-Variable.ttf';
      doc.addFileToVFS(fileName, UNICODE_FONT_BASE64);
      doc.addFont(fileName, UNICODE_FONT_FAMILY, 'normal');
      return true;
    } catch {}
  }
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
  // Use static public paths first so both pages use the exact same method
  candidates.push('/fonts/Roboto-VariableFont_wdth,wght.ttf');
  candidates.push('/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf');
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
      UNICODE_FONT_BASE64 = base64;
      UNICODE_FONT_FAMILY = fName;
      return true;
    } catch {
      // try next
    }
  }
  // If we got here, all sources failed — log once to help diagnose
  try {
  // eslint-disable-next-line no-console
  console.warn('[pdf] Unicode font load failed. Ensure /public/fonts/Roboto-VariableFont_wdth,wght.ttf is served at /fonts and matches your BASE_URL.');
  } catch {}
  return false;
}

function inr(amount) {
  // Always use the rupee symbol for consistency across pages
  const n = Number(amount || 0);
  const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  return `₹${num}`;
}

function getTimeSlotLabel(id) {
  if (id === undefined || id === null || id === '') return '-';
  const raw = String(id).trim();
  const map = {
    '6-8': '6:00 AM - 8:00 AM',
    '8-10': '8:00 AM - 10:00 AM',
    '10-12': '10:00 AM - 12:00 PM',
    '12-14': '12:00 PM - 2:00 PM',
    '14-16': '2:00 PM - 4:00 PM',
    '16-18': '4:00 PM - 6:00 PM',
    '18-20': '6:00 PM - 8:00 PM',
  };
  if (map[raw]) return map[raw];

  const fmt = (h) => {
    const hour = Math.max(0, Math.min(23, Number(h)));
    const hr12 = ((hour + 11) % 12) + 1;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hr12}:00 ${ampm}`;
  };

  // Handle range like "16-18" or "4-6"
  const range = raw.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (range) {
    const [, s, e] = range;
    return `${fmt(s)} - ${fmt(e)}`;
  }

  // Handle single time like "16", "16:00", or "16:00:00" -> snap to standard slots
  const single = raw.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/);
  if (single) {
    const hour = Math.max(0, Math.min(23, parseInt(single[1], 10)));
    const slots = [ [6,8], [8,10], [10,12], [12,14], [14,16], [16,18], [18,20] ];
    const hit = slots.find(([s, e]) => hour >= s && hour < e);
    if (hit) return `${fmt(hit[0])} - ${fmt(hit[1])}`;
    return fmt(hour);
  }

  // Unknown format: return as-is
  return raw || '-';
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
    ['Type', (booking.appointmentType || booking.appointment_type) === 'home_collection' ? 'Home Collection' : 'Lab Visit'],
    [
      'Date',
      fmtDate(
        booking.selectedDate ||
        booking.date ||
        booking.appointmentDate ||
        booking.appointment_date
      ),
    ],
    [
      'Time',
      getTimeSlotLabel(
        booking.selectedTimeSlot ||
        booking.selected_time_slot ||
        booking.selectedTime ||
        booking.time ||
        booking.appointmentTime ||
        booking.appointment_time ||
        booking.slot ||
        booking.time_slot
      ),
    ],
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
  // Register the font into this doc if cached (extra safety)
  if (UNICODE_FONT_BASE64 && UNICODE_FONT_FAMILY) {
    try {
      doc.addFileToVFS('Roboto-Variable.ttf', UNICODE_FONT_BASE64);
      doc.addFont('Roboto-Variable.ttf', UNICODE_FONT_FAMILY, 'normal');
    } catch {}
  }
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

// Generate a detailed Laboratory Test Report PDF from a result object
export async function generateTestReportPDF({ result, user }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  await ensureUnicodeFont(doc);

  // Header accent
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 6, pageWidth, 3, 'F');

  // Letterhead with logo and brand
  try {
    const img = await (async () => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      const p = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
      });
      image.src = logoUrl;
      return p;
    })();
    const imgH = 42;
    const imgW = (img.width / img.height) * imgH;
    doc.addImage(img, 'PNG', margin, y, imgW, imgH);
  } catch {}

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

  // Title
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const title = 'Laboratory Report';
  doc.text(title, margin, y);

  // Report meta box (Test + IDs)
  const testName = result?.testName || result?.test_name || result?.name || 'Lab Test';
  const sampleId = result?.sample_code || result?.sample_id || result?.sampleCode || '-';
  const reportId = (
    result?.report_id || result?.reportId ||
    result?.result_id || result?.resultId ||
    result?.test_result_id || result?.testResultId ||
    result?.booking_result_id || result?.bookingResultId ||
    result?.bookingId || result?.booking_id ||
    result?.id ||
    sampleId || '-'
  );
  doc.setFillColor(245);
  doc.setDrawColor(220);
  doc.roundedRect(pageWidth - margin - 280, y - 16, 280, 24, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`Report ID: ${String(reportId)}`, pageWidth - margin - 270, y);
  doc.setTextColor(0);
  y += 18;

  // Test overview: show description under test name and keep the card compact
  const desc = result?.test_description || result?.description || '';
  const availableW = pageWidth - margin * 2 - 24;
  const wrappedDesc = desc ? doc.splitTextToSize(desc, availableW) : [];
  const titleLineH = 18; // approximate
  const descBlockH = wrappedDesc.length > 0 ? wrappedDesc.length * 12 + 6 : 0;
  const boxH = 16 + titleLineH + (desc ? 8 : 0) + descBlockH + 8; // paddings + title + desc
  doc.setDrawColor(230);
  doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 8, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(testName, margin + 12, y + 16 + 12);
  if (desc) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10); // slightly smaller to keep the box small
    doc.text(wrappedDesc, margin + 12, y + 16 + 12 + 8 + 12); // below title
  }
  y += boxH + 12;

  // Helpers
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return isNaN(d) ? '-' : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const ageFromDOB = (dob) => {
    try {
      if (!dob) return undefined;
      const d = new Date(dob);
      if (isNaN(d)) return undefined;
      const now = new Date();
      let age = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
      return Math.max(0, age);
    } catch { return undefined; }
  };

  // Patient & Sample information tables
  const patientName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || ''}`.trim() || 'Patient';
  const patientAge = user?.date_of_birth ? ageFromDOB(user.date_of_birth) : undefined;
  const patientGender = user?.gender || user?.sex || '-';
  const collectionDate = result?.collected_at || result?.collection_date || result?.collectionDate || '-';
  const reportDate = result?.processed_at || result?.reported_at || result?.reportDate || result?.completed_at || result?.created_at || '-';

  doc.autoTable({
    startY: y,
    head: [['Patient', 'Details']],
    body: [
      ['Name', patientName],
      ['Age', patientAge != null ? `${patientAge} years` : '-'],
      ['Gender', patientGender],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 120 } },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
  });
  y = doc.lastAutoTable.finalY + 12;

  doc.autoTable({
    startY: y,
    head: [['Sample', 'Details']],
    body: [
      ['Sample ID', String(sampleId)],
      ['Collection', formatDate(collectionDate)],
      ['Report Date', formatDate(reportDate)],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 120, fontStyle: 'bold' }, 1: { cellWidth: pageWidth - margin * 2 - 120 } },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
  });
  y = doc.lastAutoTable.finalY + 18;

  // Build parameters table from result
  const values = result?.result_values || {};
  const refParams = (result?.reference_ranges && result.reference_ranges.parameters) || [];
  let params = [];
  if (Array.isArray(refParams) && refParams.length > 0) {
    params = refParams.map((p) => {
      const key = p.key || p.label || p.name;
      const raw = values?.[key];
      const flagObj = (result?.abnormal_flags && result.abnormal_flags[key]) || {};
      const asText = raw === undefined || raw === null ? '-' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw));
      const status = flagObj.flag === 'normal' ? 'Normal' : (flagObj.flag === 'high' ? 'High' : (flagObj.flag === 'low' ? 'Low' : (flagObj.flag || '')));
      const range = (() => {
        try {
          if (p.range) {
            if (p.range.low != null || p.range.high != null) return `${p.range.low ?? ''}-${p.range.high ?? ''}`;
            const male = p.range.male ? `${p.range.male.low ?? ''}-${p.range.male.high ?? ''}` : null;
            const female = p.range.female ? `${p.range.female.low ?? ''}-${p.range.female.high ?? ''}` : null;
            if (male || female) return `M:${male || '-'} F:${female || '-'}`;
          }
        } catch {}
        return p.referenceRange || '';
      })();
      return [p.label || p.name || key, asText, p.unit || '', range, status || ''];
    });
  } else {
    params = Object.keys(values || {}).map((k) => {
      const raw = values[k];
      const flagObj = (result?.abnormal_flags && result.abnormal_flags[k]) || {};
      let unit = (result?.units && result.units[k]) || (result?.result_units && result.result_units[k]) || '';
      let refRange = '';
      let status = flagObj.flag === 'normal' ? 'Normal' : (flagObj.flag === 'high' ? 'High' : (flagObj.flag === 'low' ? 'Low' : (flagObj.flag || '')));
      let valueText;
      if (raw === undefined || raw === null) {
        valueText = '-';
      } else if (typeof raw === 'object') {
        const v = raw.value ?? raw.result ?? raw.val ?? raw.reading ?? raw.text;
        valueText = v === undefined || v === null ? '-' : String(v);
        unit = unit || raw.unit || raw.units || raw.uom || '';
        // reference range shape: {low, high} or {range: 'x-y'} or {referenceRange: 'x-y'}
        if (raw.referenceRange) {
          refRange = typeof raw.referenceRange === 'string' ? raw.referenceRange : `${raw.referenceRange.low ?? ''}-${raw.referenceRange.high ?? ''}`;
        } else if (raw.range) {
          refRange = typeof raw.range === 'string' ? raw.range : `${raw.range.low ?? ''}-${raw.range.high ?? ''}`;
        } else if (raw.low != null || raw.high != null) {
          refRange = `${raw.low ?? ''}-${raw.high ?? ''}`;
        }
        const f = raw.flag || raw.status;
        if (!status && f) {
          status = (String(f).toLowerCase() === 'normal') ? 'Normal' : (String(f).toLowerCase() === 'high' ? 'High' : (String(f).toLowerCase() === 'low' ? 'Low' : String(f)));
        }
      } else {
        valueText = String(raw);
      }
      return [k, valueText, unit, refRange, status || ''];
    });
  }

  // Results table
  const tableW = pageWidth - margin * 2; // keep identical to the top tables
  const paramW = 120; // match the "label" column width used in Patient/Sample tables
  const remaining = tableW - paramW;
  let unitW = Math.max(56, Math.round(remaining * 0.10)); // compact but readable
  let rangeW = Math.round(remaining * 0.30); // moderate width for ranges
  let resultW = Math.round(remaining * 0.34); // reduced result width
  let statusW = remaining - (unitW + rangeW + resultW); // fill remainder
  // Ensure a sensible minimum for status; borrow space from result if needed
  if (statusW < 72) {
    const deficit = 72 - statusW;
    resultW = Math.max(100, resultW - deficit);
    statusW = 72;
  }
  // Fix rounding drift so columns sum exactly to table width
  const sum = paramW + unitW + rangeW + resultW + statusW;
  const drift = tableW - sum;
  if (drift !== 0) {
    rangeW += drift;
  }

  doc.autoTable({
    startY: y,
    head: [['Parameter', 'Result', 'Unit', 'Reference Range', 'Status']],
    body: params,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: paramW },
      1: { cellWidth: resultW },
      2: { cellWidth: unitW },
      3: { cellWidth: rangeW },
      4: { cellWidth: statusW, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        const val = String(data.cell.raw || '').toLowerCase();
        // Normal -> green, Low -> yellow, High -> red
        if (val.includes('normal')) {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-500
        } else if (val.includes('low')) {
          data.cell.styles.textColor = [202, 138, 4]; // amber-600
        } else if (val.includes('high')) {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
        } else {
          data.cell.styles.textColor = 20;
        }
      }
    },
  });
  y = doc.lastAutoTable.finalY + 16;

  // Interpretation & Recommendations - boxed and smaller text
  const interpretation = result?.interpretation || '';
  const recommendations = result?.recommendations || '';
  const verifiedBy = result?.verified_by_name || result?.processed_by_name || '';

  const drawBoxedSection = (titleText, bodyText, accentColor = BRAND_BLUE) => {
    const content = String(bodyText || '-');
    // Ensure the wrapping uses the exact font+size we'll render with
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const innerW = pageWidth - margin * 2 - 24;
    const wrap = doc.splitTextToSize(content, innerW);
    const titleH = 14;
    const bodyH = wrap.length * 10 + 6; // smaller line height
    const boxH2 = 12 + titleH + 6 + bodyH + 8; // padding
    doc.setDrawColor(225);
    doc.setFillColor(248);
    doc.roundedRect(margin, y, pageWidth - margin * 2, boxH2, 8, 8, 'FD');
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...accentColor);
    doc.text(titleText, margin + 12, y + 16);
    // Body
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(wrap, margin + 12, y + 16 + 6 + 12);
    y += boxH2 + 10;
  };

  if (interpretation) drawBoxedSection('Clinical Interpretation', interpretation, BRAND_BLUE);
  if (recommendations) drawBoxedSection('Recommendations', recommendations, BRAND_GREEN);
  if (!interpretation && !recommendations) {
    drawBoxedSection('Notes', 'No additional interpretation or recommendations provided.', BRAND_BLUE);
  }

  if (verifiedBy) {
  // add a little breathing room above the verifier line
  y += 12;
  doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Verified by: ${verifiedBy}`, margin, y);
    y += 16;
    doc.setTextColor(0);
  }

  // Footer
  const footerY = pageHeight - 18;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('This is a computer-generated report. For assistance, contact support@diagnosia.com.', margin, footerY);

  // File name: PatientName_TestName_Report.pdf (sanitize to safe characters)
  const sanitize = (s) => String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^a-zA-Z0-9\-\u0900-\u097F ]+/g, '') // keep letters, numbers, hyphen, spaces, and common Devanagari
    .replace(/\s+/g, '_')
    .slice(0, 80);
  const safePatient = sanitize(patientName) || 'Patient';
  const safeTest = sanitize(testName) || 'Test';
  const fname = `${safePatient}_${safeTest}_Report.pdf`;
  doc.save(fname);
}
