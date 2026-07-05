const BASE = '';

export async function fetchPipelines(page = 0, limit = 20) {
  const res = await fetch(`${BASE}/api/pipelines?page=${page}&limit=${limit}`);
  return res.json();
}

export async function fetchPipeline(id: string) {
  const res = await fetch(`${BASE}/api/pipelines/${id}`);
  return res.json();
}

export async function fetchPipelineByShareId(shareId: string) {
  const res = await fetch(`${BASE}/api/pipelines/share/${shareId}`);
  return res.json();
}

export async function createPipeline(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/pipelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePipeline(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/pipelines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePipeline(id: string) {
  const res = await fetch(`${BASE}/api/pipelines/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function fetchMcpServers() {
  const res = await fetch(`${BASE}/api/mcp/servers`);
  return res.json();
}

export async function fetchMcpTools(serverId: string) {
  const res = await fetch(`${BASE}/api/mcp/tools/${serverId}`);
  return res.json();
}

export async function fetchAudit(pipelineId: string) {
  const res = await fetch(`${BASE}/api/audit/${pipelineId}`);
  return res.json();
}
