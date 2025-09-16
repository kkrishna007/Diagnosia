import axios from 'axios';

export class ApiClient {
  constructor({ baseUrl, userToken, employeeToken } = {}) {
    this.baseUrl = baseUrl || process.env.API_BASE_URL || 'http://localhost:5000/api';
    this.userToken = userToken || null;
    this.employeeToken = employeeToken || null;
    this.http = axios.create({ baseURL: this.baseUrl, timeout: 60000 });
  }

  _authHeaders(type = 'user') {
    const token = type === 'employee' ? this.employeeToken : this.userToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async searchTests(q) {
    const r = await this.http.get(`/tests/search?q=${encodeURIComponent(q)}`);
    return r.data;
  }
  async getTestByCode(code) {
    const r = await this.http.get(`/tests/${encodeURIComponent(code)}`);
    return r.data;
  }

  async createBooking(payload) {
    const r = await this.http.post('/bookings', payload, { headers: this._authHeaders('user') });
    return r.data;
  }
  async listAppointments() {
    const r = await this.http.get('/users/appointments', { headers: this._authHeaders('user') });
    return r.data;
  }

  async listTestResults() {
    const r = await this.http.get('/users/test-results', { headers: this._authHeaders('user') });
    return r.data;
  }

  async getProfile() {
    const r = await this.http.get('/users/profile', { headers: this._authHeaders('user') });
    return r.data;
  }

  async getSlots() {
    return [
      { id: '6-8', label: '06:00-08:00' },
      { id: '8-10', label: '08:00-10:00' },
      { id: '10-12', label: '10:00-12:00' },
      { id: '12-14', label: '12:00-14:00' },
      { id: '14-16', label: '14:00-16:00' },
      { id: '16-18', label: '16:00-18:00' }
    ];
  }
}
