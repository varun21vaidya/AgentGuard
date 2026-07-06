const BASE = '';

function authHeaders() {
  const token = localStorage.getItem('agentguard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...options.headers } as Record<string, string>,
  });
  if (res.status === 401) {
    localStorage.removeItem('agentguard_token');
    window.location.reload();
  }
  return res.json();
}

export async function fetchPipelines(page = 0, limit = 20) {
  return authFetch(`${BASE}/api/pipelines?page=${page}&limit=${limit}`);
}

export async function fetchPipeline(id: string) {
  return authFetch(`${BASE}/api/pipelines/${id}`);
}

export async function fetchPipelineByShareId(shareId: string) {
  const res = await fetch(`${BASE}/api/public/pipelines/share/${shareId}`);
  return res.json();
}

export async function createPipeline(data: Record<string, unknown>) {
  return authFetch(`${BASE}/api/pipelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updatePipeline(id: string, data: Record<string, unknown>) {
  return authFetch(`${BASE}/api/pipelines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletePipeline(id: string) {
  return authFetch(`${BASE}/api/pipelines/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchMcpServers() {
  return authFetch(`${BASE}/api/mcp/servers`);
}

export async function fetchMcpTools(serverId: string) {
  return authFetch(`${BASE}/api/mcp/tools/${serverId}`);
}

export async function fetchAudit(pipelineId: string) {
  return authFetch(`${BASE}/api/audit/${pipelineId}`);
}

export async function fetchTemplates() {
  return authFetch(`${BASE}/api/pipelines/templates/list`);
}

export async function instantiateTemplate(name: string) {
  return authFetch(`${BASE}/api/pipelines/templates/${encodeURIComponent(name)}/instantiate`, {
    method: 'POST',
  });
}
