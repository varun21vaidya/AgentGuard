import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  async streamCompletion({ systemPrompt, model, maxTokens, temperature, prompt, onDelta }) {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    let fullText = '';
    let usage = null;

    const stream = await anthropic.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const delta = chunk.delta.text;
        fullText += delta;
        if (onDelta) onDelta(delta);
      }
      if (chunk.type === 'message_delta' && chunk.usage) {
        usage = chunk.usage;
      }
    }

    const finalMessage = await stream.finalMessage();
    usage = finalMessage.usage;

    const rates = {
      'claude-opus-4-6': { input: 5.0, output: 15.0 },
      'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
      'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
    };
    const rate = rates[model];
    const inputCost = (usage.input_tokens / 1_000_000) * rate.input;
    const outputCost = (usage.output_tokens / 1_000_000) * rate.output;
    const actualCostUsd = Math.round((inputCost + outputCost) * 10000) / 10000;

    return {
      output: fullText,
      usage,
      actualCostUsd,
    };
  }
}

export const claudeService = new ClaudeService();
