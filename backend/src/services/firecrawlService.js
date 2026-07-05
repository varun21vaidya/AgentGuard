const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v2';

export class FirecrawlService {
  async search(query, limit = 10) {
    const body = { query, limit };
    const res = await this._request('/search', body);
    const data = res.data || [];
    return data.map(d => ({
      title: d.title || '',
      url: d.url || '',
      description: d.description || '',
      content: d.markdown || '',
    }));
  }

  async scrape(url) {
    const body = { url, formats: ['markdown'] };
    const res = await this._request('/scrape', body);
    if (!res.success) throw new Error(`Firecrawl scrape failed: ${res.error || 'unknown'}`);
    return {
      title: res.data?.title || '',
      content: res.data?.markdown || '',
      url: res.data?.url || url,
    };
  }

  async interact(url, actions = []) {
    const body = { url, actions };
    const res = await this._request('/interact', body);
    if (!res.success) throw new Error(`Firecrawl interact failed: ${res.error || 'unknown'}`);
    return {
      content: res.data?.markdown || '',
      screenshot: res.data?.screenshot || null,
    };
  }

  async _request(endpoint, body) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(`${FIRECRAWL_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firecrawl ${endpoint} ${res.status}: ${text}`);
    }

    return res.json();
  }
}

export const firecrawlService = new FirecrawlService();
