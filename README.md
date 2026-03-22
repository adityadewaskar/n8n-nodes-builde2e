# n8n-nodes-builde2e

[n8n](https://n8n.io) community node for [BuildE2E](https://builde2e.com) — web scraping and search in your workflows.

## Installation

1. Go to **Settings → Community Nodes** in your n8n instance
2. Click **Install a community node**
3. Enter `n8n-nodes-builde2e`
4. Click **Install**

## Credentials

You need a BuildE2E API key. Get one at [builde2e.com](https://builde2e.com).

| Field    | Description                                      |
| -------- | ------------------------------------------------ |
| API Key  | Your API key (starts with `uc-`)                 |
| Base URL | API base URL (default: `https://api.builde2e.com/api/v1`) |

## Operations

### Scrape → Batch Scrape

Scrape one or more URLs in a single request.

**Fields:**

- **URLs** (required) — comma-separated list of URLs
- **Output Type** — `markdown` (default) or `html`
- **Additional Options:**
  - Only Main Content — extract only primary content (default: true)
  - Summary Query — LLM query to summarize/extract specific info
  - PDF Strategy — `ocr`, `local`, or `auto`
  - Proxy Country — route through a residential proxy (ISO country code)
- **Actions** — ordered list of browser actions to execute before scraping:
  - Click, Type, Press Key, Scroll, Wait, Wait for Selector, Navigate, Go Back

Each URL result is output as a separate n8n item.

### Search → Web Search

Search the web and get structured results.

**Fields:**

- **Query** (required) — search query
- **Limit** — max results (1–50, default: 10)
- **Additional Options:**
  - Location — country code for geo-targeted results
  - Include Domains — restrict to specific domains
  - Exclude Domains — exclude specific domains
  - Engine — `google`, `bing`, `chatgpt`, or `perplexity`

Each search result (url, title, description) is output as a separate n8n item.

## AI Agent Compatibility

This node has `usableAsTool: true`, so it can be used as a tool by n8n AI agents.

## Resources

- [BuildE2E Documentation](https://docs.builde2e.com)
- [BuildE2E API Reference](https://docs.builde2e.com/api)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
