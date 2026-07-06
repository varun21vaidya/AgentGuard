const MODEL_RATES = {
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.0-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
};

const ESTIMATED_TOKENS_PER_CHAR = 0.25;

export class CostEstimator {
  estimateTokens(text) {
    return Math.ceil(text.length * ESTIMATED_TOKENS_PER_CHAR);
  }

  estimateClaudeCall(nodeData) {
    const systemPrompt = nodeData.systemPrompt || '';
    const model = nodeData.model || 'claude-sonnet-4-6';
    const maxTokens = nodeData.maxTokens || 1024;

    const systemTokens = this.estimateTokens(systemPrompt);
    const outputTokens = maxTokens;

    const rates = MODEL_RATES[model];
    if (!rates) throw new Error(`Unknown model: ${model}`);

    const inputCost = (systemTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;
    const totalCost = inputCost + outputCost;

    return {
      estimatedInputTokens: systemTokens,
      estimatedOutputTokens: outputTokens,
      estimatedCostUsd: Math.round(totalCost * 10000) / 10000,
      model,
    };
  }

  calculateActualCost(model, usage) {
    const rates = MODEL_RATES[model];
    if (!rates) throw new Error(`Unknown model: ${model}`);

    const inputCost = (usage.input_tokens / 1_000_000) * rates.input;
    const outputCost = (usage.output_tokens / 1_000_000) * rates.output;
    const totalCost = inputCost + outputCost;

    return Math.round(totalCost * 10000) / 10000;
  }

  estimateGeminiCall(nodeData) {
    const systemPrompt = nodeData.systemPrompt || '';
    const model = nodeData.model || 'gemini-2.0-flash';
    const maxTokens = nodeData.maxTokens || 1024;

    const systemTokens = this.estimateTokens(systemPrompt);
    const outputTokens = maxTokens;

    const rates = MODEL_RATES[model];
    if (!rates) throw new Error(`Unknown model: ${model}`);

    const inputCost = (systemTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;
    const totalCost = inputCost + outputCost;

    return {
      estimatedInputTokens: systemTokens,
      estimatedOutputTokens: outputTokens,
      estimatedCostUsd: Math.round(totalCost * 10000) / 10000,
      model,
    };
  }

  suggestOptimization(model, estimate, actual) {
    if (model === 'claude-opus-4-6') {
      const sonnetRates = MODEL_RATES['claude-sonnet-4-6'];
      const opusRates = MODEL_RATES['claude-opus-4-6'];

      const savings = actual * (1 - (sonnetRates.output / opusRates.output));
      if (savings > 0.01) {
        return {
          suggestion: 'Try claude-sonnet-4-6 to reduce costs',
          potentialSavings: Math.round(savings * 10000) / 10000,
          savingsPercent: Math.round((savings / actual) * 100),
        };
      }
    }
    if (model === 'gemini-2.0-pro') {
      const flashRates = MODEL_RATES['gemini-2.0-flash'];
      const proRates = MODEL_RATES['gemini-2.0-pro'];

      const savings = actual * (1 - (flashRates.output / proRates.output));
      if (savings > 0.01) {
        return {
          suggestion: 'Try gemini-2.0-flash to reduce costs',
          potentialSavings: Math.round(savings * 10000) / 10000,
          savingsPercent: Math.round((savings / actual) * 100),
        };
      }
    }
    return null;
  }
}

export const costEstimator = new CostEstimator();
