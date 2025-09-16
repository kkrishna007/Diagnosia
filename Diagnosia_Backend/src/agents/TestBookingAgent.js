import { AgentBase } from './base/AgentBase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Preload static pricing data (only price source now). Silent failure allowed.
let STATIC_TEST_PRICES = [];
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const p = path.resolve(__dirname, '../data/test_prices.json');
  const raw = fs.readFileSync(p, 'utf-8');
  STATIC_TEST_PRICES = JSON.parse(raw);
} catch {}

export class TestBookingAgent extends AgentBase {
  requiredSlots() {
    return ['testName', 'date', 'timeSlot', 'appointmentType'];
  }

  _missingSlots(session) {
    const baseMissing = this.requiredSlots().filter(s => !session.booking[s]);
    // Dynamically require address only for Home Collection
    if (session.booking.appointmentType === 'Home Collection' && !session.booking.address) {
      baseMissing.push('address');
    }
    return baseMissing;
  }

  async handle(input, session) {
    const booking = session.booking;
    const lower = input.toLowerCase();
    let sideContext = {};
    // Lazy-load user profile once per session for patient info
    if (!session.userProfile) {
      try {
        session.userProfile = await this.apiClient.getProfile();
      } catch {}
    }
    // Detect inquiries about home collection / home visit charges in either word order
    const homeChargeInquiry = new RegExp(
      [
        '(charge|cost|price|fee|fees).{0,40}(home collection|home visit|home pickup|home sample)',
        '(home collection|home visit|home pickup|home sample).{0,40}(charge|cost|price|fee|fees)'
      ].join('|')
    ).test(lower);
    if (homeChargeInquiry) {
      sideContext.homeCollectionCharge = 'Home collection has an additional surcharge of ₹300; a lab visit has no extra fee.';
    }

  const askedForSlots = /what (are|r) the (available )?slots?|slots? available|available slots|time slots?|time.*available/.test(lower);
    if (askedForSlots) {
      const slots = await this.apiClient.getSlots();
      sideContext.availableSlots = slots;
    }

    let fastingQueryTest = null;
    const fastingMatch = lower.match(/does\s+([\w\s\-]+)\s+require\s+fasting/);
    if (fastingMatch) {
      fastingQueryTest = fastingMatch[1].trim();
      try {
        const testSearch = await this.apiClient.searchTests(fastingQueryTest);
        const test = Array.isArray(testSearch) ? testSearch[0] : null;
        if (test && (test.fasting_required != null)) {
          sideContext.fastingInfo = {
            test: test.test_name || fastingQueryTest,
            fasting_required: !!test.fasting_required,
            fasting_hours: test.fasting_hours || null
          };
        } else {
          sideContext.fastingInfo = { test: fastingQueryTest, fasting_required: null };
        }
      } catch {
        sideContext.fastingInfo = { test: fastingQueryTest, fasting_required: null };
      }
    }

    await this._tryFillSlots(input, booking, { homeChargeInquiry });

    // If user specifically asked about home collection charge, answer directly without locking in appointmentType
    if (homeChargeInquiry) {
      const msg = 'Home collection costs an extra ₹300 (lab visit: no additional fee).';
      return { messages: [msg], done: false };
    }

    // If user asked for slots and we have not yet captured timeSlot, respond with slot list immediately
    if (askedForSlots) {
      // Ensure date is parsed before we answer; if still missing, we will include a gentle note once only
      const missingBefore = this._missingSlots(session);
      const needsDate = !booking.date;
      const promptInstructions = needsDate
        ? 'User asked for available time slots. List the slots inline separated by commas like 06:00-08:00, 08:00-10:00, 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00. Do NOT use asterisks, bullets, or markdown lists. THEN politely ask them to confirm or provide a date (natural language ok). Avoid repeating previous slot/date questions.'
        : 'User asked for available time slots. List the slots inline separated by commas (06:00-08:00, 08:00-10:00, 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00). Do NOT use asterisks, bullets, or numbering. Then ask which slot they prefer.';
      const text = await this.respondWithGemini(
        'Provide available booking slots',
        input,
        { booking, availableSlots: sideContext.availableSlots, missing: missingBefore },
        promptInstructions
      );
      return { messages: [text], done: false };
    }

    const missing = this._missingSlots(session);

    if (missing.length === 0 && !booking.pendingApproval && !booking.confirmed) {
      // Static-only pricing resolution; if name present but basePrice missing try static name/code match
      if (booking.basePrice == null) {
        const target = (booking.testCode || '').toLowerCase();
        const normName = (booking.testName || '').toLowerCase();
        const staticMatch = STATIC_TEST_PRICES.find(t =>
          (target && t.test_code.toLowerCase() === target) ||
          (normName && t.test_name.toLowerCase() === normName) ||
          (normName && t.test_name.toLowerCase().includes(normName))
        );
        if (staticMatch) booking.basePrice = staticMatch.base_price;
      }
      const base = Number(booking.basePrice ?? 0) || 0;
      const surcharge = booking.appointmentType === 'Home Collection' ? 300 : 0;
      const total = base + surcharge;
      booking.pendingApproval = true;
      const confirmationContext = {
        collected: { ...booking, pricing: { base, surcharge, total } },
        note: 'Awaiting user approval before booking.',
        sideContext
      };
      const confirmInstruction = booking.appointmentType === 'Home Collection'
        ? 'Provide a plain text summary (no asterisks, bullets, or bold). Lines: Test Name: <name>, Date: <YYYY-MM-DD>, Time Slot: <slot>, Appointment Type: Home Collection, Pickup Address: <address>, Base Price: ₹<base>, Surcharge: ₹300, Total: ₹<total>. Always show numeric prices. Ask user to confirm with Yes or No.'
        : 'Provide a plain text summary (no asterisks, bullets, or bold). Lines: Test Name: <name>, Date: <YYYY-MM-DD>, Time Slot: <slot>, Appointment Type: Lab Visit, Base Price: ₹<base>, Total: ₹<total>. Always show numeric prices. Ask user to confirm with Yes or No.';
      const text = await this.respondWithGemini(
        'Confirm test booking details with user',
        input,
        confirmationContext,
        confirmInstruction
      );
      return { messages: [text], done: false };
    }

    if (booking.pendingApproval && /^(yes|confirm|yep|proceed|ok|okay)\b/i.test(input.trim())) {
      try {
        const profile = session.userProfile || {};
        // Derive approximate age if date_of_birth present
        let derivedAge = null;
        if (profile.date_of_birth) {
          try {
            const dob = new Date(profile.date_of_birth);
            if (!isNaN(dob)) {
              const today = new Date();
              derivedAge = today.getFullYear() - dob.getFullYear();
              const m = today.getMonth() - dob.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) derivedAge--;
            }
          } catch {}
        }
        const patientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Patient';
        const specialInstructionsParts = [];
        // No generic note right now; we only embed address similar to BookingForm.jsx
        if (booking.appointmentType === 'Home Collection' && booking.address) {
          specialInstructionsParts.push(`Collection Address: ${booking.address}`);
        }
        const payload = {
          test_code: booking.testCode || booking.testName,
          appointment_date: booking.date,
          appointment_time: this._slotToStartTime(booking.timeSlot),
          appointment_type: booking.appointmentType === 'Home Collection' ? 'home_collection' : 'lab_visit',
          collection_address_id: null, // future enhancement: map to stored address id
          patient_name: patientName,
          patient_gender: profile.gender ? String(profile.gender).toLowerCase() : null,
          patient_age: derivedAge,
          special_instructions: specialInstructionsParts.join(' | ')
        };
        const result = await this.apiClient.createBooking(payload);
        booking.confirmed = true;
        booking.pendingApproval = false;
        const confirmation = await this.respondWithGemini(
          'Booking success message',
          input,
          { bookingCreated: result.appointment, test: result.appointment_test },
          booking.appointmentType === 'Home Collection'
            ? 'Provide a concise confirmation including appointment id, date, time, surcharge (₹300), pickup address, and total amount if available.'
            : 'Provide a concise confirmation including appointment id, date, time, and total amount if available.'
        );
        return { messages: [confirmation], done: true, booked: result };
      } catch (e) {
        const errText = await this.respondWithGemini(
          'Booking failure handling',
          input,
          { error: e.message, stack: e.stack?.split('\n')[0] },
          'Apologize briefly, mention that the booking could not be completed due to a system error, and ask the user if they would like to retry or modify details.'
        );
        return { messages: [errText], done: false };
      }
    }

    if (booking.pendingApproval && /^(no|cancel|change|edit)/i.test(input.trim())) {
      booking.pendingApproval = false;
      const text = await this.respondWithGemini(
        'Modify booking flow after user declined confirmation',
        input,
        { current: booking },
        'Acknowledge decline and ask which field they want to change.'
      );
      return { messages: [text], done: false };
    }

    if (missing.length > 0) {
      const nextSlot = missing[0];
      const structured = { collected: booking, missing, sideContext };
      let instruction;
      if (nextSlot === 'address') {
        instruction = 'Ask the user for the full pickup address (include house/flat number, street, area, city). Keep it to one sentence.';
      } else {
        instruction = `Prompt the user specifically for: ${nextSlot}. Keep it short and helpful.`;
      }
      const text = await this.respondWithGemini(
        'Continue slot filling for test booking',
        input,
        structured,
        instruction
      );
      return { messages: [text], done: false };
    }

    const fallback = await this.respondWithGemini(
      'Fallback booking response',
      input,
      { booking, sideContext },
      'Politely ask user to clarify or confirm the booking.'
    );
    return { messages: [fallback], done: false };
  }

  async _tryFillSlots(input, booking, options = {}) {
    const { homeChargeInquiry = false } = options;
    const lower = input.toLowerCase();
    // Direct alias detection (expanded) without any API fallback
    if (!booking.testCode) {
      const aliasMap = [
        { code: 'CBC', aliases: ['cbc','complete blood count','cbc test'] },
        { code: 'LIPID', aliases: ['lipid profile','lipid','cholesterol profile','cholesterol test','cholesterol'] },
        { code: 'THYROID', aliases: ['thyroid profile','thyroid','t3','t4','tsh','thyroid test'] },
        { code: 'DIABPKG', aliases: ['diabetes package','diabetes','hba1c','glucose','blood sugar'] },
        { code: 'LFT', aliases: ['lft','liver function test','liver function','liver test'] },
        { code: 'KFT', aliases: ['kft','kidney function test','kidney function','kidney test'] },
        { code: 'URINE', aliases: ['urine routine','urine test','urine examination','urine'] },
        { code: 'VITD', aliases: ['vitamin d','vit d','vitd','vitamin d test'] },
        { code: 'HEALTHPKG', aliases: ['complete health checkup','health checkup','health package','health check','full body checkup'] },
        { code: 'IRON', aliases: ['iron deficiency panel','iron deficiency','iron panel','iron test','iron'] }
      ];
      const match = aliasMap.find(entry => entry.aliases.some(a => lower.includes(a)));
      if (match) {
        const staticEntry = STATIC_TEST_PRICES.find(t => t.test_code === match.code);
        if (staticEntry) {
          booking.testCode = staticEntry.test_code;
          booking.testName = staticEntry.test_name;
          booking.basePrice = staticEntry.base_price;
        }
      }
    }
    // DATE PARSING: supports YYYY-MM-DD plus natural forms ("16th of september", "September 16", "16 sept", "tomorrow", "today", dd/mm/yyyy, dd-mm-yyyy)
    if (!booking.date) {
      const isoMatch = input.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
      const dayMonth1 = input.match(/\b(\d{1,2})(st|nd|rd|th)?\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
      const monthDay1 = input.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th)?\b/i);
      const shortForm = input.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i);
      const dmDash = input.match(/\b(\d{1,2})-(\d{1,2})-(20\d{2})\b/); // dd-mm-yyyy
      const dmSlash = input.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/); // dd/mm/yyyy
      const relativeTomorrow = /\btomorrow\b/.test(lower);
      const relativeToday = /\btoday\b/.test(lower);

      const monthMap = {
        january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,
        jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12
      };
      const pad = n => String(n).padStart(2,'0');
      const build = (y,m,d) => `${y}-${pad(m)}-${pad(d)}`;
      let parsed = null;
      const now = new Date();
      if (isoMatch) parsed = isoMatch[1];
      else if (relativeToday) parsed = build(now.getFullYear(), now.getMonth()+1, now.getDate());
      else if (relativeTomorrow) {
        const t = new Date(now.getTime()+86400000);
        parsed = build(t.getFullYear(), t.getMonth()+1, t.getDate());
      } else if (dayMonth1) {
        const d = parseInt(dayMonth1[1],10);
        const m = monthMap[dayMonth1[3].toLowerCase()];
        parsed = build(now.getFullYear(), m, d);
      } else if (monthDay1) {
        const d = parseInt(monthDay1[2],10);
        const m = monthMap[monthDay1[1].toLowerCase()];
        parsed = build(now.getFullYear(), m, d);
      } else if (shortForm) {
        const d = parseInt(shortForm[1],10);
        const m = monthMap[shortForm[2].toLowerCase()];
        parsed = build(now.getFullYear(), m, d);
      } else if (dmDash) {
        const d = parseInt(dmDash[1],10); const m = parseInt(dmDash[2],10); const y = parseInt(dmDash[3],10); parsed = build(y,m,d);
      } else if (dmSlash) {
        const d = parseInt(dmSlash[1],10); const m = parseInt(dmSlash[2],10); const y = parseInt(dmSlash[3],10); parsed = build(y,m,d);
      }
      // Basic validation (avoid impossible dates)
      if (parsed) {
        const testDate = new Date(parsed);
        if (!isNaN(testDate.getTime())) {
          booking.date = parsed;
        }
      }
    }
    const slotMatch = input.match(/\b(6-8|8-10|10-12|12-14|14-16|16-18)\b/);
    if (!booking.timeSlot && slotMatch) {
      booking.timeSlot = slotMatch[1];
    }
    // If still no timeSlot, attempt to parse explicit time or time range and map to slot
    if (!booking.timeSlot) {
      const timeRange = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      const singleTime = lower.match(/\b(at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);

      const toMinutes = (h, m, meridian) => {
        h = parseInt(h,10);
        m = m ? parseInt(m,10) : 0;
        if (meridian) {
          if (meridian === 'pm' && h !== 12) h += 12;
          if (meridian === 'am' && h === 12) h = 0;
        }
        return h * 60 + m;
      };
      const slotMap = [
        { id: '6-8', start: 6*60, end: 8*60 },
        { id: '8-10', start: 8*60, end: 10*60 },
        { id: '10-12', start: 10*60, end: 12*60 },
        { id: '12-14', start: 12*60, end: 14*60 },
        { id: '14-16', start: 14*60, end: 16*60 },
        { id: '16-18', start: 16*60, end: 18*60 }
      ];

      const findSlotByMinute = (minuteVal) => {
        return slotMap.find(s => minuteVal >= s.start && minuteVal < s.end)?.id;
      };

      if (timeRange) {
        const h1 = timeRange[1]; const m1 = timeRange[2]; const mer1 = timeRange[3];
        const h2 = timeRange[4]; const m2 = timeRange[5]; const mer2 = timeRange[6];
        const startMin = toMinutes(h1,m1,mer1);
        const endMin = toMinutes(h2,m2,mer2 || mer1); // infer second meridian if omitted
        // Choose the first slot fully or partially overlapping
        const chosen = slotMap.find(s => !(endMin <= s.start || startMin >= s.end));
        if (chosen) booking.timeSlot = chosen.id;
      } else if (singleTime) {
        // singleTime regex has multiple groups; extract last non-null trio
        const groups = singleTime.slice(1).filter(Boolean);
        let h=null, m=null, mer=null;
        // Iterate original capturing groups to pick the correct pattern (some alt groups). We'll manually parse.
        const direct = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
        if (direct) { h = direct[1]; m = direct[2]; mer = direct[3]; }
        if (h) {
          const minuteVal = toMinutes(h,m,mer);
          const slotId = findSlotByMinute(minuteVal);
          if (slotId) booking.timeSlot = slotId;
        }
      }
    }
    if (!booking.appointmentType) {
      const selectionIntent = /(i\s*(would )?(like|want|prefer|choose|go with)|book|schedule|set up).{0,20}home collection|home collection please|^home collection$|home collection\.?$/;
      const labSelectionIntent = /(i\s*(would )?(like|want|prefer|choose|go with)|book|schedule|set up).{0,20}lab (visit|centre|center)|lab visit please|^lab visit$/;
      const mentionsHomeCollection = /home collection|home\s+pickup|home visit/.test(lower);
      const mentionsLabVisit = /lab visit|lab centre|lab center/.test(lower);
      // Only assign if it's not merely a pricing inquiry
      if (!homeChargeInquiry) {
        if (mentionsHomeCollection && (selectionIntent.test(lower) || !mentionsLabVisit && !/charge|cost|price|fee|fees/.test(lower))) {
          // If user just says "home collection" alone (without asking about price) we accept it.
          booking.appointmentType = 'Home Collection';
        } else if (mentionsLabVisit && (labSelectionIntent.test(lower) || !mentionsHomeCollection && !/charge|cost|price|fee|fees/.test(lower))) {
          booking.appointmentType = 'Lab Visit';
        }
      }
    }

    // ADDRESS CAPTURE (stricter) - avoid capturing booking command as address
    if (booking.appointmentType === 'Home Collection' && !booking.address) {
      const hasComma = input.includes(',');
      const keyword = /(road|rd|street|st|avenue|ave|sector|block|phase|lane|colony|nagar|layout|apartment|apt|tower|building|flat|house|plot|society)/.test(lower);
      const hasDigit = /\d/.test(lower);
      const bookingWords = /(book|test|home collection|tomorrow|today|slot|am|pm)/.test(lower);
      if ((hasComma || (keyword && hasDigit)) && !bookingWords) {
        booking.address = input.trim();
      }
    }
  }

  _slotToStartTime(slotId) {
    const map = {
      '6-8': '06:00',
      '8-10': '08:00',
      '10-12': '10:00',
      '12-14': '12:00',
      '14-16': '14:00',
      '16-18': '16:00'
    };
    return (map[slotId] || '09:00') + ':00';
  }
}
