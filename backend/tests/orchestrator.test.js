import { describe, it, expect, beforeEach } from 'vitest';
import { PipelineExecutor } from '../src/services/orchestrator.js';

function makeExecutor(nodes = [], edges = []) {
  return new PipelineExecutor(
    null, // ws
    { nodes, edges },
    'test-exec-1'
  );
}

describe('PipelineExecutor', () => {
  describe('topologicalSort', () => {
    it('sorts simple linear pipeline', () => {
      const exec = makeExecutor(
        [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]
      );
      expect(exec.topologicalSort(exec.pipelineDoc.nodes, exec.pipelineDoc.edges)).toEqual(['a', 'b', 'c']);
    });

    it('handles diamond shape', () => {
      const exec = makeExecutor(
        [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
        [
          { source: 'a', target: 'b' },
          { source: 'a', target: 'c' },
          { source: 'b', target: 'd' },
          { source: 'c', target: 'd' },
        ]
      );
      const order = exec.topologicalSort(exec.pipelineDoc.nodes, exec.pipelineDoc.edges);
      expect(order.indexOf('a')).toBe(0);
      expect(order.indexOf('d')).toBe(3);
      expect(order.indexOf('b')).toBeGreaterThan(0);
      expect(order.indexOf('c')).toBeGreaterThan(0);
    });

    it('throws on cycle', () => {
      const exec = makeExecutor(
        [{ id: 'a' }, { id: 'b' }],
        [{ source: 'a', target: 'b' }, { source: 'b', target: 'a' }]
      );
      expect(() => exec.topologicalSort(exec.pipelineDoc.nodes, exec.pipelineDoc.edges)).toThrow('Cycle detected');
    });

    it('handles single node', () => {
      const exec = makeExecutor([{ id: 'a' }], []);
      expect(exec.topologicalSort(exec.pipelineDoc.nodes, exec.pipelineDoc.edges)).toEqual(['a']);
    });

    it('handles disconnected nodes', () => {
      const exec = makeExecutor(
        [{ id: 'a' }, { id: 'b' }],
        []
      );
      const order = exec.topologicalSort(exec.pipelineDoc.nodes, exec.pipelineDoc.edges);
      expect(order).toContain('a');
      expect(order).toContain('b');
      expect(order.length).toBe(2);
    });
  });

  describe('interpolate', () => {
    it('replaces {{key}} with input value', () => {
      const exec = makeExecutor();
      expect(exec.interpolate('Hello {{name}}', { name: 'World' })).toBe('Hello World');
    });

    it('falls back to inputs.input', () => {
      const exec = makeExecutor();
      expect(exec.interpolate('{{foo}}', { input: 'fallback' })).toBe('fallback');
    });

    it('leaves unmatched placeholders empty', () => {
      const exec = makeExecutor();
      expect(exec.interpolate('{{missing}}', {})).toBe('');
    });

    it('handles multiple placeholders', () => {
      const exec = makeExecutor();
      expect(exec.interpolate('{{a}}-{{b}}', { a: '1', b: '2' })).toBe('1-2');
    });

    it('returns template unchanged when no placeholders', () => {
      const exec = makeExecutor();
      expect(exec.interpolate('plain text', {})).toBe('plain text');
    });
  });

  describe('interpolateObject', () => {
    it('interpolates string values', () => {
      const exec = makeExecutor();
      expect(exec.interpolateObject({ prompt: 'Hello {{name}}' }, { name: 'World' }))
        .toEqual({ prompt: 'Hello World' });
    });

    it('recurses into nested objects', () => {
      const exec = makeExecutor();
      expect(exec.interpolateObject({ nested: { msg: 'Hi {{x}}' } }, { x: 'there' }))
        .toEqual({ nested: { msg: 'Hi there' } });
    });

    it('passes non-string values through', () => {
      const exec = makeExecutor();
      expect(exec.interpolateObject({ count: 42, flag: true, data: null }, {}))
        .toEqual({ count: 42, flag: true, data: null });
    });
  });

  describe('collectInputs', () => {
    it('collects outputs from source nodes by handle', () => {
      const exec = makeExecutor();
      exec.results = { 'src-1': { output: 'hello' } };
      const edges = [{ source: 'src-1', target: 'dest', targetHandle: 'input' }];
      expect(exec.collectInputs('dest', edges)).toEqual({ input: 'hello' });
    });

    it('returns empty object when no edges', () => {
      const exec = makeExecutor();
      expect(exec.collectInputs('dest', [])).toEqual({});
    });

    it('groups by targetHandle', () => {
      const exec = makeExecutor();
      exec.results = { a: { output: '1' }, b: { output: '2' } };
      const edges = [
        { source: 'a', target: 'dest', targetHandle: 'left' },
        { source: 'b', target: 'dest', targetHandle: 'right' },
      ];
      expect(exec.collectInputs('dest', edges)).toEqual({ left: '1', right: '2' });
    });
  });

  describe('condition branch execution', () => {
    it('returns branchTaken=true when condition matches', async () => {
      const exec = makeExecutor();
      const result = await exec.executeNode(
        { id: 'cond', type: 'condition', data: { operator: '>', value: '5', leftHandle: 'input' } },
        { input: '10' }
      );
      expect(result.branchTaken).toBe('true');
      expect(result.output).toBe('10');
    });

    it('returns branchTaken=false when condition fails', async () => {
      const exec = makeExecutor();
      const result = await exec.executeNode(
        { id: 'cond', type: 'condition', data: { operator: '>', value: '5', leftHandle: 'input' } },
        { input: '1' }
      );
      expect(result.branchTaken).toBe('false');
    });

    it('handles == operator', async () => {
      const exec = makeExecutor();
      const r1 = await exec.executeNode(
        { id: 'c', type: 'condition', data: { operator: '==', value: 'hello', leftHandle: 'input' } },
        { input: 'hello' }
      );
      expect(r1.branchTaken).toBe('true');

      const r2 = await exec.executeNode(
        { id: 'c', type: 'condition', data: { operator: '==', value: 'hello', leftHandle: 'input' } },
        { input: 'world' }
      );
      expect(r2.branchTaken).toBe('false');
    });

    it('handles != operator', async () => {
      const exec = makeExecutor();
      const r = await exec.executeNode(
        { id: 'c', type: 'condition', data: { operator: '!=', value: 'x', leftHandle: 'input' } },
        { input: 'y' }
      );
      expect(r.branchTaken).toBe('true');
    });

    it('handles contains operator', async () => {
      const exec = makeExecutor();
      const r1 = await exec.executeNode(
        { id: 'c', type: 'condition', data: { operator: 'contains', value: 'break', leftHandle: 'input' } },
        { input: 'breakthrough news' }
      );
      expect(r1.branchTaken).toBe('true');

      const r2 = await exec.executeNode(
        { id: 'c', type: 'condition', data: { operator: 'contains', value: 'break', leftHandle: 'input' } },
        { input: 'no match here' }
      );
      expect(r2.branchTaken).toBe('false');
    });

    it('defaults leftHandle to "input"', async () => {
      const exec = makeExecutor();
      const r = await exec.executeNode(
        { id: 'c', type: 'condition', data: { operator: '==', value: 'val' } },
        { input: 'val' }
      );
      expect(r.branchTaken).toBe('true');
    });
  });

  describe('markDownstreamSkipped', () => {
    it('skips linear downstream chain', () => {
      const exec = makeExecutor();
      const nodes = [{ id: 'b' }, { id: 'c' }];
      const edges = [{ source: 'b', target: 'c' }];
      const skipped = new Set();
      exec.markDownstreamSkipped('b', nodes, edges, skipped);
      expect(skipped.has('b')).toBe(true);
      expect(skipped.has('c')).toBe(true);
    });

    it('does not skip diamond merge node when other branch is live', () => {
      const exec = makeExecutor();
      const nodes = [{ id: 'b' }, { id: 'c' }, { id: 'd' }];
      const edges = [
        { source: 'b', target: 'd' },
        { source: 'c', target: 'd' },
      ];
      const skipped = new Set();
      // skip 'b', but 'c' is still live → 'd' should NOT be skipped
      exec.markDownstreamSkipped('b', nodes, edges, skipped);
      expect(skipped.has('b')).toBe(true);
      expect(skipped.has('d')).toBe(false);
    });
  });

  describe('output node execution', () => {
    it('interpolates template with inputs', async () => {
      const exec = makeExecutor();
      const result = await exec.executeNode(
        { id: 'out', type: 'output', data: { value: 'Result: {{input}}' } },
        { input: '42' }
      );
      expect(result.output).toBe('Result: 42');
    });

    it('passes zero cost and duration', async () => {
      const exec = makeExecutor();
      const result = await exec.executeNode(
        { id: 'out', type: 'output', data: { value: '' } },
        {}
      );
      expect(result.actualCost).toBe(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('input node execution', () => {
    it('interpolates value with inputs', async () => {
      const exec = makeExecutor();
      const result = await exec.executeNode(
        { id: 'in', type: 'input', data: { value: '{{input}}' } },
        { input: 'hello' }
      );
      expect(result.output).toBe('hello');
    });
  });

  describe('executeNode unknown type', () => {
    it('throws for unknown node type', async () => {
      const exec = makeExecutor();
      await expect(
        exec.executeNode({ id: 'x', type: 'unknown', data: {} }, {})
      ).rejects.toThrow('Unknown node type');
    });
  });
});
