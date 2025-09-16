import { AgentBase } from './base/AgentBase.js';

export class AppointmentStatusAgent extends AgentBase {
  async handle(input, session) {
    const ap = session.appointmentStatus;
    if (!ap.appointments) {
      try {
        const list = await this.apiClient.listAppointments();
        ap.appointments = list;
        if (!list || list.length === 0) {
          const msg = await this.respondWithGemini(
            'No appointments available notice',
            input,
            {},
            'Inform user they have no appointments yet.'
          );
          return { messages: [msg], done: true };
        }
        const msg = await this.respondWithGemini(
          'Ask user to pick appointment for status',
          input,
          { appointments: list.map((a, i) => ({ index: i + 1, id: a.appointment_id, date: a.appointment_date, status: a.status || a.appointment_status })) },
          'List appointments with index and ask which one they want the status for.'
        );
        return { messages: [msg], done: false };
      } catch (e) {
        const err = await this.respondWithGemini(
          'Appointment list retrieval error',
          input,
          { error: e.message },
          'Apologize for the error and offer to retry.'
        );
        return { messages: [err], done: false };
      }
    }

    if (!ap.selectedAppointmentId) {
      const numMatch = input.match(/\b(\d{1,3})\b/);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < ap.appointments.length) {
          ap.selectedAppointmentId = ap.appointments[idx].appointment_id;
        }
      }
      if (!ap.selectedAppointmentId) {
        const clarify = await this.respondWithGemini(
          'Clarify appointment selection',
          input,
          { appointments: ap.appointments.map((a, i) => ({ index: i + 1, id: a.appointment_id })) },
          'User input did not match a valid index. Ask them again politely.'
        );
        return { messages: [clarify], done: false };
      }
    }

    const appointment = ap.appointments.find(a => a.appointment_id === ap.selectedAppointmentId);
    const status = await this.respondWithGemini(
      'Provide appointment status',
      input,
      { appointment },
      'Provide current status and brief next steps if applicable.'
    );
    return { messages: [status], done: true };
  }
}
