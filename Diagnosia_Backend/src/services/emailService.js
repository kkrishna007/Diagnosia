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
      // e.g. 18 Sep 2025
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${String(d.getUTCDate()).padStart(2,'0')} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
  } catch {}
  // Fallback to ISO date portion
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

export async function sendSampleCollectionEmail({ to, userName, appointment, appointmentTest, testName, sampleCode, collectedAt }) {
  if (!to) {
    console.warn('sendSampleCollectionEmail: missing to address');
    return;
  }
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const dateStr = formatDateOnly(appointment.appointment_date);
  const collectionDateStr = formatDateOnly(collectedAt);
  
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
      <h2 style="color:#28a745;">Sample Successfully Collected</h2>
      <p>Hi ${userName || 'User'},</p>
      <p>Great news! Your sample has been successfully collected and is now being processed. Here are the details:</p>
      <table style="border-collapse:collapse;min-width:320px;">
        <tr><td style="padding:4px 8px;font-weight:bold;">Test</td><td style="padding:4px 8px;">${testName || appointmentTest.test_code}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Appointment Date</td><td style="padding:4px 8px;">${dateStr}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Sample Collected</td><td style="padding:4px 8px;">${collectionDateStr}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Sample Code</td><td style="padding:4px 8px;">${sampleCode}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Patient</td><td style="padding:4px 8px;">${appointmentTest.patient_name} (${appointmentTest.patient_age}, ${appointmentTest.patient_gender})</td></tr>
      </table>
      <p style="margin-top:16px;">
        <strong>Next Steps:</strong><br/>
        • Your sample is now being processed in our laboratory<br/>
        • You will receive another email when your report is ready<br/>
        • Report delivery typically takes 24-48 hours
      </p>
      <p style="margin-top:16px;">Thank you for choosing Diagnosia Lab.<br/>Diagnosia Lab</p>
      <hr style="margin:24px 0;"/>
      <p style="font-size:12px;color:#666;">If you have any questions, please contact support.</p>
    </div>
  `;

  const text = `Sample Successfully Collected\n\nTest: ${testName || appointmentTest.test_code}\nAppointment Date: ${dateStr}\nSample Collected: ${collectionDateStr}\nSample Code: ${sampleCode}\nPatient: ${appointmentTest.patient_name} (${appointmentTest.patient_age}, ${appointmentTest.patient_gender})\n\nNext Steps:\n• Your sample is now being processed in our laboratory\n• You will receive another email when your report is ready\n• Report delivery typically takes 24-48 hours\n\nThank you for choosing Diagnosia Lab.`;

  try {
    const info = await getTransporter().sendMail({
      from, to, subject: 'Sample Successfully Collected - Diagnosia Lab', text, html,
    });
    console.log('Sample collection email sent:', info.messageId);
  } catch (err) {
    console.error('Failed to send sample collection email', err.message);
  }
}

export async function sendReportReadyEmail({ to, userName, appointment, appointmentTest, testName, reportPath, reportFileName }) {
  if (!to) {
    console.warn('sendReportReadyEmail: missing to address');
    return;
  }
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const dateStr = formatDateOnly(appointment.appointment_date);
  const currentDateStr = formatDateOnly(new Date());
  
  // Accepts reportDetails for full report content
  const htmlReportBlock = (details) => {
    if (!details) return '';
    // Patient & Sample Info Tables (side by side)
    const patientTable = `
      <table style="border-collapse:collapse;width:100%;max-width:320px;margin-bottom:0;table-layout:fixed;">
        <tr><th colspan="2" style="background:#009688;color:#fff;padding:6px 8px;text-align:left;font-size:15px;">Patient</th></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Name</td><td style="padding:4px 8px;">${details.patient_name}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Age</td><td style="padding:4px 8px;">${details.patient_age}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Gender</td><td style="padding:4px 8px;">${details.patient_gender}</td></tr>
      </table>`;
    const sampleTable = `
      <table style="border-collapse:collapse;width:100%;max-width:320px;margin-bottom:0;table-layout:fixed;">
        <tr><th colspan="2" style="background:#009688;color:#fff;padding:6px 8px;text-align:left;font-size:15px;">Sample</th></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Sample ID</td><td style="padding:4px 8px;">${details.sample_code || '-'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Collection</td><td style="padding:4px 8px;">${details.sample_collected_at ? formatDateOnly(details.sample_collected_at) : '-'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Report Date</td><td style="padding:4px 8px;">${details.report_date ? formatDateOnly(details.report_date) : '-'}</td></tr>
      </table>`;
    // Side by side layout
    const infoTables = `
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <colgroup><col style="width:50%"><col style="width:50%"></colgroup>
        <tr>
          <td style="vertical-align:top;padding-right:12px;">${patientTable}</td>
          <td style="vertical-align:top;padding-left:12px;">${sampleTable}</td>
        </tr>
      </table>`;
   // Only show test name (use full width container so tables align beneath)
   const testNameBlock = `<div style="background:#f0f4f8;padding:8px 12px;font-size:17px;font-weight:600;color:#009688;margin-bottom:10px;width:100%;box-sizing:border-box;">${details.test_name || '-'}</div>`;
    // Results Table
    let resultsRows = '';
    if (Array.isArray(details.results)) {
      resultsRows = details.results.map(r => {
        // Format reference range
        let ref = r.reference;
        if (ref && typeof ref === 'object') {
          if (ref.low !== undefined && ref.high !== undefined) ref = `${ref.low}-${ref.high} ${r.unit || ''}`;
          else ref = Object.values(ref).join(', ');
        }
        if (typeof ref === 'undefined' || ref === null) ref = '-';
        // Format status: expect strings like 'Low', 'High', 'Normal' or 'Missing'
        let status = r.status;
        if (typeof status === 'object') {
          // fallback to flag or nested 'flag' property
          status = status.flag || status.status || Object.values(status).join(', ');
        }
        status = (typeof status === 'string' && status) ? status : String(status || '-');
        // Normalize common tokens
        const sLower = status.toLowerCase();
        let statusLabel = status;
        if (sLower.includes('low')) statusLabel = 'Low';
        else if (sLower.includes('high')) statusLabel = 'High';
        else if (sLower.includes('missing') || sLower.includes('no value')) statusLabel = 'Missing';
        else if (sLower.includes('error')) statusLabel = 'Error';
        else statusLabel = statusLabel === '-' ? '-' : (statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1));
        // Color mapping
        let statusColor = '#10b981'; // green normal
        if (statusLabel === 'Low') statusColor = '#eab308';
        if (statusLabel === 'High') statusColor = '#ef4444';
        if (statusLabel === 'Missing' || statusLabel === 'Error') statusColor = '#6b7280';

        return `
          <tr>
            <td style="padding:4px 8px;">${r.parameter}</td>
            <td style="padding:4px 8px;">${r.value}</td>
            <td style="padding:4px 8px;">${r.unit || '-'}</td>
            <td style="padding:4px 8px;">${ref}</td>
            <td style="padding:4px 8px;font-weight:bold;color:${statusColor};">${statusLabel}</td>
          </tr>
        `;
      }).join('');
    }
    const resultsTable = resultsRows ? `
      <table style="border-collapse:collapse;width:100%;margin-bottom:12px;table-layout:fixed;">
        <colgroup>
          <col style="width:40%"/>
          <col style="width:15%"/>
          <col style="width:10%"/>
          <col style="width:20%"/>
          <col style="width:15%"/>
        </colgroup>
        <thead>
          <tr style="background:#f0f4f8;">
            <th style="padding:8px 10px;text-align:left;">Parameter</th>
            <th style="padding:8px 10px;text-align:left;">Result</th>
            <th style="padding:8px 10px;text-align:left;">Unit</th>
            <th style="padding:8px 10px;text-align:left;">Reference Range</th>
            <th style="padding:8px 10px;text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>${resultsRows}</tbody>
      </table>` : '';
    // Interpretation & Recommendation
    const interpBlock = details.interpretation ? `<div style="background:#e3f2fd;padding:10px 14px;border-radius:6px;margin-bottom:10px;"><div style="font-weight:600;color:#1976d2;margin-bottom:4px;">Clinical Interpretation</div><div style="color:#1976d2;">${details.interpretation}</div></div>` : '';
    const recBlock = details.recommendation ? `<div style="background:#e8f5e9;padding:10px 14px;border-radius:6px;margin-bottom:10px;"><div style="font-weight:600;color:#388e3c;margin-bottom:4px;">Recommendations</div><div style="color:#388e3c;">${details.recommendation}</div></div>` : '';
    return `
      ${testNameBlock}
      ${infoTables}
      ${resultsTable}
      ${interpBlock}
      ${recBlock}
    `;
  };

  // Accept reportDetails param for full report content
  const reportDetails = arguments[0]?.reportDetails;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;max-width:700px;">
      <h2 style="color:#17a2b8;">Your Lab Report is Ready</h2>
      <p>Hi ${userName || 'User'},</p>
      <p>Your lab test report is now ready for viewing. Please find your detailed report below.</p>
      ${htmlReportBlock(reportDetails)}
      <p style="margin-top:16px;">
        <strong>Important Information:</strong><br/>
        • Please save this email for your records<br/>
        • If you have any questions about your results, please consult with your healthcare provider
      </p>
      <p style="margin-top:16px;">Thank you for choosing Diagnosia Lab.<br/>Diagnosia Lab</p>
      <hr style="margin:24px 0;"/>
      <p style="font-size:12px;color:#666;">If you have any questions, please contact support.</p>
    </div>
  `;

  const text = `Your Lab Report is Ready\n\nTest: ${testName || appointmentTest.test_code}\nAppointment Date: ${dateStr}\nReport Generated: ${currentDateStr}\nPatient: ${appointmentTest.patient_name} (${appointmentTest.patient_age}, ${appointmentTest.patient_gender})\n\nImportant Information:\n• Your detailed report is attached as a PDF file\n• Please download and save the report for your records\n• If you have any questions about your results, please consult with your healthcare provider\n\nThank you for choosing Diagnosia Lab.`;

  const attachments = [];
  if (reportPath && reportFileName) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const reportFullPath = path.resolve(reportPath);
      
      if (fs.existsSync(reportFullPath)) {
        attachments.push({
          filename: reportFileName,
          path: reportFullPath,
          contentType: 'application/pdf'
        });
      } else {
        console.warn('Report file not found:', reportFullPath);
      }
    } catch (err) {
      console.error('Error attaching report file:', err.message);
    }
  }

  try {
    const info = await getTransporter().sendMail({
      from, to, subject: 'Your Lab Report is Ready - Diagnosia Lab', text, html, attachments,
    });
    console.log('Report ready email sent:', info.messageId);
  } catch (err) {
    console.error('Failed to send report ready email', err.message);
  }
}