import { TestBookingAgent } from './TestBookingAgent.js';
import { ViewReportAgent } from './ViewReportAgent.js';
import { AppointmentStatusAgent } from './AppointmentStatusAgent.js';

export class RouterAgent {
  constructor({ apiClient, gemini, sessionStateManager }) {
    this.apiClient = apiClient;
    this.gemini = gemini;
    this.sessionStateManager = sessionStateManager;

    this.agents = {
      booking: new TestBookingAgent({ apiClient, gemini }),
      view_report: new ViewReportAgent({ apiClient, gemini }),
      appointment_status: new AppointmentStatusAgent({ apiClient, gemini })
    };
  }

  async classifyIntent(session, userInput) {
    if (session.activeAgent) {
      const lower = userInput.toLowerCase();
      if (/(book|test)/.test(lower) && session.activeAgent !== 'booking') return 'booking';
      if (/(report|result)/.test(lower) && session.activeAgent !== 'view_report') return 'view_report';
      if (/(appointment.*status|status.*appointment)/.test(lower) && session.activeAgent !== 'appointment_status') return 'appointment_status';
      return session.activeAgent;
    }

    const prompt = [
      'You are a classifier. Possible intents: booking, view_report, appointment_status.',
      'Return strict JSON: {"intent":"<one>","confidence":0-1}',
      'User Input:',
      userInput
    ].join('\n');
    try {
      const json = await this.gemini.generateJSON(prompt);
      if (json && ['booking', 'view_report', 'appointment_status'].includes(json.intent)) {
        return json.intent;
      }
    } catch {
      const lower = userInput.toLowerCase();
      if (/(book|test)/.test(lower)) return 'booking';
      if (/(report|result)/.test(lower)) return 'view_report';
      if (/(appointment.*status|status.*appointment)/.test(lower)) return 'appointment_status';
    }
    return 'booking';
  }

  async handle(sessionId, userInput) {
    const session = this.sessionStateManager.get(sessionId);
    const intent = await this.classifyIntent(session, userInput);
    session.activeAgent = intent;
    this.sessionStateManager.appendHistory(sessionId, 'user', userInput);

    const agent = this.agents[intent];
    const result = await agent.handle(userInput, session);
    for (const m of result.messages) {
      this.sessionStateManager.appendHistory(sessionId, 'assistant', m);
    }
    return {
      intent,
      messages: result.messages,
      done: !!result.done,
      state: {
        booking: session.booking,
        viewReport: session.viewReport,
        appointmentStatus: session.appointmentStatus
      }
    };
  }
}
