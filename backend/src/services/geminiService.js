import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async streamCompletion({ systemPrompt, model, maxTokens, temperature, prompt, onDelta }) {
    const modelName = this.mapModel(model);
    const geminiModel = this.genAI.getGenerativeModel({ model: modelName });

    const generationConfig = {
      maxOutputTokens: maxTokens || 1024,
      temperature: temperature ?? 1,
    };

    const parts = [];
    if (systemPrompt) {
      parts.push({ text: systemPrompt });
    }
    parts.push({ text: prompt });

    const result = await geminiModel.generateContentStream({
      contents: [{ role: 'user', parts }],
      generationConfig,
    });

    let fullText = '';

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        if (onDelta) onDelta(text);
      }
    }

    const response = await result.response;
    const usage = response.usageMetadata;

    let actualCostUsd = 0;
    if (usage) {
      const rates = {
        'gemini-2.0-flash': { input: 0.10, output: 0.40 },
        'gemini-2.0-pro': { input: 1.25, output: 5.0 },
        'gemini-1.5-pro': { input: 1.25, output: 5.0 },
      };
      const rate = rates[model] || rates['gemini-2.0-flash'];
      const inputCost = ((usage.promptTokenCount || 0) / 1_000_000) * rate.input;
      const outputCost = ((usage.candidatesTokenCount || 0) / 1_000_000) * rate.output;
      actualCostUsd = Math.round((inputCost + outputCost) * 10000) / 10000;
    }

    return {
      output: fullText,
      usage: {
        input_tokens: usage?.promptTokenCount || 0,
        output_tokens: usage?.candidatesTokenCount || 0,
      },
      actualCostUsd,
    };
  }

  mapModel(model) {
    const mapping = {
      'gemini-2.0-flash': 'gemini-2.0-flash',
      'gemini-2.0-pro': 'gemini-2.0-pro-exp-02-05',
      'gemini-1.5-pro': 'gemini-1.5-pro',
    };
    return mapping[model] || 'gemini-2.0-flash';
  }
}

export const geminiService = new GeminiService();
