import { AgentBase } from './base/AgentBase.js';

export class ViewReportAgent extends AgentBase {
  async handle(input, session) {
    const vr = session.viewReport;
    if (!vr.reportList) {
      try {
        const results = await this.apiClient.listTestResults();
        vr.reportList = results;
        if (!results || results.length === 0) {
          const msg = await this.respondWithGemini(
            'No reports available notice',
            input,
            {},
            'Inform user that no completed reports are available yet.'
          );
          return { messages: [msg], done: true };
        }
        const msg = await this.respondWithGemini(
          'Ask user to choose a report',
            input,
          { reports: results.map(r => ({ id: r.result_id, test: r.test_name || r.test_code, date: r.processed_at })) },
          'List the reports with a short index number and ask user which one they want details for.'
        );
        return { messages: [msg], done: false };
      } catch (e) {
        const err = await this.respondWithGemini(
          'Report list error',
          input,
          { error: e.message },
          'Apologize for the error retrieving reports and ask user if they want to retry.'
        );
        return { messages: [err], done: false };
      }
    }

    const numMatch = input.match(/\b(\d{1,3})\b/);
    if (!vr.selectedReportId && numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < vr.reportList.length) {
        vr.selectedReportId = vr.reportList[idx].result_id;
      }
    }

    if (!vr.selectedReportId) {
      const clarify = await this.respondWithGemini(
        'Clarify report selection',
        input,
        { reports: vr.reportList.map((r, i) => ({ index: i + 1, id: r.result_id, test: r.test_name || r.test_code })) },
        'User input did not match a valid index. Ask them to specify a valid number.'
      );
      return { messages: [clarify], done: false };
    }

    const report = vr.reportList.find(r => r.result_id === vr.selectedReportId);
    const details = await this.respondWithGemini(
      'Render report details',
      input,
      { report },
      'Summarize interpretation, abnormal values if present, and provide a concise explanation. Offer to download as PDF (tell them to use the dashboard for actual download).'
    );
    return { messages: [details], done: true };
  }
}
