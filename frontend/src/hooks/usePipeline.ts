import { useCallback } from 'react';
import { usePipelineStore } from '../store/pipelineStore';
import { Pipeline } from '../types/pipeline';
import { updatePipeline, createPipeline } from '../services/api';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function usePipeline() {
  const { nodes, edges, pipeline, setPipeline } = usePipelineStore();

  const savePipeline = useCallback(
    async (updatedPipeline: Pipeline) => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        try {
          const payload = {
            ...updatedPipeline,
            nodes,
            edges,
          };

          const result = updatedPipeline._id
            ? await updatePipeline(updatedPipeline._id, payload)
            : await createPipeline(payload);

          setPipeline(result);
        } catch (err) {
          console.error('Failed to save pipeline:', err);
        }
      }, 800);
    },
    [nodes, edges, setPipeline]
  );

  const loadPipeline = useCallback(
    async (idOrShareId: string) => {
      try {
        const url = idOrShareId.length === 24
          ? `/api/pipelines/${idOrShareId}`
          : `/api/pipelines/share/${idOrShareId}`;

        const response = await fetch(url);
        const data = await response.json();
        setPipeline(data);
      } catch (err) {
        console.error('Failed to load pipeline:', err);
      }
    },
    [setPipeline]
  );

  return { pipeline, savePipeline, loadPipeline };
}
