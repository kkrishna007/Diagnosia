class SessionStateManager {
  constructor() {
    this.sessions = new Map();
    this.ttlMs = 1000 * 60 * 60; // 1 hour
  }

  _ensure(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        history: [],
        activeAgent: null,
        booking: {
          testName: null,
          testCode: null,
          date: null,
          timeSlot: null,
          appointmentType: null,
          confirmed: false,
          pendingApproval: false
        },
        viewReport: {
          reportList: null,
          selectedReportId: null
        },
        appointmentStatus: {
          appointments: null,
          selectedAppointmentId: null
        }
      });
    }
    return this.sessions.get(sessionId);
  }

  get(sessionId) {
    return this._ensure(sessionId);
  }

  appendHistory(sessionId, role, content) {
    const s = this._ensure(sessionId);
    s.history.push({ role, content, ts: Date.now() });
    s.lastUpdated = Date.now();
  }

  setActiveAgent(sessionId, agentName) {
    const s = this._ensure(sessionId);
    s.activeAgent = agentName;
    s.lastUpdated = Date.now();
  }

  resetAgentState(sessionId, agentKey) {
    const s = this._ensure(sessionId);
    if (agentKey === 'booking') {
      s.booking = { testName: null, testCode: null, date: null, timeSlot: null, appointmentType: null, confirmed: false, pendingApproval: false };
    } else if (agentKey === 'viewReport') {
      s.viewReport = { reportList: null, selectedReportId: null };
    } else if (agentKey === 'appointmentStatus') {
      s.appointmentStatus = { appointments: null, selectedAppointmentId: null };
    }
  }

  garbageCollect() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastUpdated > this.ttlMs) this.sessions.delete(id);
    }
  }
}

export const sessionStateManager = new SessionStateManager();
