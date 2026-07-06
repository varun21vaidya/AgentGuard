import { describe, it, expect } from 'vitest';
import { CostEstimator } from '../src/services/costEstimator.js';

const estimator = new CostEstimator();

describe('CostEstimator', () => {
  describe('estimateTokens', () => {
    it('returns ceil of length * 0.25', () => {
      expect(estimator.estimateTokens('hello')).toBe(2);      // 5*0.25=1.25→2
      expect(estimator.estimateTokens('a')).toBe(1);           // 1*0.25=0.25→1
      expect(estimator.estimateTokens('')).toBe(0);            // 0
      expect(estimator.estimateTokens('abcd')).toBe(1);        // 4*0.25=1
    });
  });

  describe('estimateClaudeCall', () => {
    it('estimates sonnet with default params', () => {
      const est = estimator.estimateClaudeCall({});
      expect(est.model).toBe('claude-sonnet-4-6');
      expect(est.estimatedInputTokens).toBe(0);
      expect(est.estimatedOutputTokens).toBe(1024);
      expect(est.estimatedCostUsd).toBeGreaterThan(0);
    });

    it('uses provided system prompt for input tokens', () => {
      const est = estimator.estimateClaudeCall({ systemPrompt: 'Hello world' });
      expect(est.estimatedInputTokens).toBe(3); // 11*0.25=2.75→3
    });

    it('uses provided maxTokens', () => {
      const est = estimator.estimateClaudeCall({ maxTokens: 2048 });
      expect(est.estimatedOutputTokens).toBe(2048);
    });

    it('uses opus rates', () => {
      const est = estimator.estimateClaudeCall({ model: 'claude-opus-4-6', systemPrompt: 'x'.repeat(4000) });
      expect(est.model).toBe('claude-opus-4-6');
      expect(est.estimatedCostUsd).toBeGreaterThan(0);
    });

    it('throws for unknown model', () => {
      expect(() => estimator.estimateClaudeCall({ model: 'fake-model' })).toThrow('Unknown model');
    });
  });

  describe('estimateGeminiCall', () => {
    it('estimates flash with default params', () => {
      const est = estimator.estimateGeminiCall({});
      expect(est.model).toBe('gemini-2.0-flash');
      expect(est.estimatedCostUsd).toBeGreaterThan(0);
    });

    it('throws for unknown model', () => {
      expect(() => estimator.estimateGeminiCall({ model: 'fake-model' })).toThrow('Unknown model');
    });
  });

  describe('calculateActualCost', () => {
    it('calculates sonnet cost from token usage', () => {
      const cost = estimator.calculateActualCost('claude-sonnet-4-6', { input_tokens: 1000, output_tokens: 500 });
      // (1000/1e6)*3 + (500/1e6)*15 = 0.003 + 0.0075 = 0.0105
      expect(cost).toBe(0.0105);
    });

    it('calculates flash cost', () => {
      const cost = estimator.calculateActualCost('gemini-2.0-flash', { input_tokens: 2000, output_tokens: 1000 });
      // (2000/1e6)*0.1 + (1000/1e6)*0.4 = 0.0002 + 0.0004 = 0.0006
      expect(cost).toBe(0.0006);
    });

    it('throws for unknown model', () => {
      expect(() => estimator.calculateActualCost('fake', { input_tokens: 0, output_tokens: 0 })).toThrow('Unknown model');
    });
  });

  describe('suggestOptimization', () => {
    it('suggests sonnet when using opus and savings > $0.01', () => {
      const suggestion = estimator.suggestOptimization('claude-opus-4-6', { estimatedCostUsd: 1 }, 0.5);
      expect(suggestion).not.toBeNull();
      expect(suggestion.suggestion).toContain('sonnet');
      expect(suggestion.potentialSavings).toBeGreaterThan(0);
    });

    it('returns null for cheap opus calls', () => {
      const suggestion = estimator.suggestOptimization('claude-opus-4-6', { estimatedCostUsd: 0.01 }, 0.005);
      expect(suggestion).toBeNull();
    });

    it('returns null for non-opus models', () => {
      const suggestion = estimator.suggestOptimization('claude-sonnet-4-6', { estimatedCostUsd: 1 }, 0.5);
      expect(suggestion).toBeNull();
    });

    it('suggests flash when using pro', () => {
      const suggestion = estimator.suggestOptimization('gemini-2.0-pro', { estimatedCostUsd: 1 }, 0.5);
      expect(suggestion).not.toBeNull();
      expect(suggestion.suggestion).toContain('flash');
    });
  });
});
