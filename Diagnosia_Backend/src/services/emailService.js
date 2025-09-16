import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter lazily to allow hot reload without duplicating
let transporter;
function getTransporter() {
  if (!transporter) {
    const { SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('[email] SMTP_USER / SMTP_PASS not fully set; emails will fail until configured.');
    }
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_SECURE || 'true') === 'true', // true for 465 (SSL), false for 587 (STARTTLS)
      auth: SMTP_USER && SMTP_PASS ? {
        user: SMTP_USER,
        pass: SMTP_PASS,
      } : undefined,
    });
  }
  return transporter;
}

export async function verifyEmailConfig() {
  try {
    const { SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('[email] Skipping SMTP verify: missing SMTP_USER or SMTP_PASS');
      return;
    }
    await getTransporter().verify();
    console.log('[email] SMTP transporter verified successfully.');
  } catch (err) {
    console.error('[email] SMTP verification failed:', err.message);
  }
}

function formatDateOnly(dateVal) {
  try {
    const d = new Date(dateVal);
    if (!isNaN(d)) {
      // e.g. Wed, 17 Sep 2025
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${dayNames[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2,'0')} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
  } catch {}
  return String(dateVal).slice(0,10);
}

function buildTimeSlot(baseTime) {
  if (!baseTime) return baseTime;
  // Expecting HH:MM:SS
  const t = String(baseTime).slice(0,8);
  const [hStr, mStr] = t.split(':');
  const startH = parseInt(hStr, 10);
  const startM = parseInt(mStr, 10);
  if (isNaN(startH) || isNaN(startM)) return t;
  const endH = (startH + 2) % 24; // 2-hour slot

  const fmt = (h, m) => {
    const period = h >= 12 ? 'pm' : 'am';
    let h12 = h % 12; if (h12 === 0) h12 = 12;
    if (m === 0) return `${h12}${period}`;
    return `${h12}:${String(m).padStart(2,'0')}${period}`;
  };

  return `${fmt(startH, startM)}-${fmt(endH, startM)}`;
}

function labelAppointmentType(type) {
  if (!type) return '';
  switch (type) {
    case 'home_collection': return 'Home Collection';
    case 'lab_visit': return 'Lab Visit';
    default: return type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  }
}

export async function sendBookingConfirmationEmail({ to, userName, appointment, appointmentTest, testName, addressLine }) {
  if (!to) {
    console.warn('sendBookingConfirmationEmail: missing to address');
    return;
  }
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const dateStr = formatDateOnly(appointment.appointment_date);
  const timeStr = buildTimeSlot(appointment.appointment_time);
  const testCode = appointmentTest.test_code;
  const amount = appointment.total_amount;
  const apptTypeLabel = labelAppointmentType(appointment.appointment_type);
  const addressBlock = appointment.appointment_type === 'home_collection' && addressLine
    ? `<p><strong>Address:</strong> ${addressLine}</p>`
    : '';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
      <h2 style="color:#0d6efd;">Booking Confirmed</h2>
      <p>Hi ${userName || 'User'},</p>
      <p>Your lab test booking has been confirmed. Here are the details:</p>
      <table style="border-collapse:collapse;min-width:320px;">
        <tr><td style="padding:4px 8px;font-weight:bold;">Test</td><td style="padding:4px 8px;">${testName || testCode}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Date</td><td style="padding:4px 8px;">${dateStr}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Time</td><td style="padding:4px 8px;">${timeStr}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Type</td><td style="padding:4px 8px;">${apptTypeLabel}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Amount</td><td style="padding:4px 8px;">₹${amount}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Patient</td><td style="padding:4px 8px;">${appointmentTest.patient_name} (${appointmentTest.patient_age}, ${appointmentTest.patient_gender})</td></tr>
      </table>
      ${addressBlock}
      <p style="margin-top:16px;">We look forward to serving you.<br/>Diagnosia Lab</p>
      <hr style="margin:24px 0;"/>
      <p style="font-size:12px;color:#666;">If you did not make this booking, please contact support.</p>
    </div>
  `;

  const text = `Booking Confirmed\n\nTest: ${testName || testCode}\nDate: ${dateStr}\nTime: ${timeStr}\nType: ${apptTypeLabel}\nAmount: ₹${amount}\nPatient: ${appointmentTest.patient_name} (${appointmentTest.patient_age}, ${appointmentTest.patient_gender})${addressBlock ? `\nAddress: ${addressLine}` : ''}\n\nThank you.\nDiagnosia Lab`;

  try {
    const info = await getTransporter().sendMail({
      from, to, subject: 'Your Lab Test Booking Confirmation', text, html,
    });
    console.log('Booking confirmation email sent:', info.messageId);
  } catch (err) {
    console.error('Failed to send booking confirmation email', err.message);
  }
}
