export class AgentBase {
  constructor({ apiClient, gemini }) {
    this.apiClient = apiClient;
    this.gemini = gemini;
  }

  agentName() {
    return this.constructor.name;
  }

  async respondWithGemini(systemPurpose, userGoal, structuredContext, instructions) {
    const prompt = [
      'You are an assistant in a pathology lab platform.',
      `Purpose: ${systemPurpose}`,
      'User Goal / Latest Input:',
      userGoal,
      'Structured Context (JSON):',
      JSON.stringify(structuredContext || {}, null, 2),
      'Instructions:',
      instructions,
      'Return ONLY natural language (no JSON unless explicitly requested by instruction).'
    ].join('\n\n');

    return await this.gemini.generateText(prompt);
  }
}
