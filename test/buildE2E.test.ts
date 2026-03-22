import http from 'https';

const API_KEY = process.env.BUILDE2E_API_KEY;
if (!API_KEY) {
	console.error('ERROR: BUILDE2E_API_KEY environment variable is required. Set it in .env or export it.');
	process.exit(1);
}
const BASE_URL = 'https://api.builde2e.com/api/v1';

let passed = 0;
let failed = 0;

function request(path: string, body: object): Promise<{ status: number; data: any }> {
	return new Promise((resolve, reject) => {
		const url = new URL(`${BASE_URL}${path}`);
		const payload = JSON.stringify(body);

		const req = http.request(
			{
				hostname: url.hostname,
				path: url.pathname,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': API_KEY,
				},
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					try {
						resolve({ status: res.statusCode ?? 0, data: JSON.parse(data) });
					} catch {
						resolve({ status: res.statusCode ?? 0, data });
					}
				});
			},
		);
		req.on('error', reject);
		req.write(payload);
		req.end();
	});
}

function assert(condition: boolean, msg: string) {
	if (condition) {
		console.log(`  ✓ ${msg}`);
		passed++;
	} else {
		console.error(`  ✗ ${msg}`);
		failed++;
	}
}

async function testSearch() {
	console.log('\n--- Search: /search ---');
	const { status, data } = await request('/search', {
		queries: ['best restaurants in Berlin'],
		limit: 3,
	});

	assert(status === 200, `status is 200 (got ${status})`);
	assert(data.results !== undefined, 'response has results');
	assert(Array.isArray(data.results), 'results is an array');
	if (Array.isArray(data.results) && data.results.length > 0) {
		const first = data.results[0];
		assert(first.results !== undefined, 'first query result has results array');
		assert(first.results.length > 0, `got ${first.results.length} search results`);
	}
}

async function testScrape() {
	console.log('\n--- Scrape: /scrape/batch (plain URLs) ---');
	const { status, data } = await request('/scrape/batch', {
		urls: ['https://example.com'],
		type: 'markdown',
		onlyMainContent: true,
	});

	assert(status === 200, `status is 200 (got ${status})`);
	assert(data.results !== undefined, 'response has results');
	assert(Array.isArray(data.results), 'results is an array');
	if (Array.isArray(data.results) && data.results.length > 0) {
		const first = data.results[0];
		assert(typeof first.markdown === 'string', 'result has markdown content');
		assert(typeof first.success === 'boolean', 'result has success field');
		assert(typeof first.url === 'string', 'result has url field');
	}
}

async function testScrapeWithActions() {
	console.log('\n--- Scrape: /scrape/batch (with per-URL actions) ---');
	// Actions must be sent per-URL as ScrapeOptions objects (not at batch level)
	const { status, data } = await request('/scrape/batch', {
		urls: [
			{
				url: 'https://example.com',
				actions: [
					{ type: 'wait', milliseconds: 500 },
				],
			},
		],
		type: 'markdown',
	});

	assert(status === 200, `status is 200 (got ${status})`);
	assert(data.results !== undefined, 'response has results');
	if (Array.isArray(data.results) && data.results.length > 0) {
		assert(data.results[0].success === true, 'scrape with actions succeeded');
	}
}

async function testSearchWithOptions() {
	console.log('\n--- Search with options: engine + location ---');
	const { status, data } = await request('/search', {
		queries: ['n8n workflow automation'],
		limit: 2,
		engine: 'google',
		location: 'US',
		includeDomains: ['n8n.io'],
	});

	assert(status === 200, `status is 200 (got ${status})`);
	assert(data.results !== undefined, 'response has results');
}

async function testSearchResponseShape() {
	console.log('\n--- Search: response shape validation ---');
	const { status, data } = await request('/search', {
		queries: ['test'],
		limit: 1,
	});

	assert(status === 200, `status is 200 (got ${status})`);
	assert(typeof data.total === 'number', 'response has total');
	assert(typeof data.successful === 'number', 'response has successful');
	assert(typeof data.failed === 'number', 'response has failed');
	assert(typeof data.timestamp === 'string', 'response has timestamp');
	if (Array.isArray(data.results) && data.results.length > 0) {
		const item = data.results[0];
		assert(typeof item.query === 'string', 'result item has query');
		assert(typeof item.success === 'boolean', 'result item has success');
		assert(Array.isArray(item.results), 'result item has results array');
		if (item.results.length > 0) {
			const web = item.results[0];
			assert(typeof web.url === 'string', 'web result has url');
			assert(typeof web.title === 'string', 'web result has title');
			assert(typeof web.description === 'string', 'web result has description');
		}
	}
}

async function main() {
	console.log(`BuildE2E API Tests (key: ${API_KEY.slice(0, 8)}...)\n`);

	try {
		await testSearch();
		await testScrape();
		await testScrapeWithActions();
		await testSearchWithOptions();
		await testSearchResponseShape();
	} catch (err) {
		console.error('\nFatal error:', err);
		process.exit(1);
	}

	console.log(`\n${passed} passed, ${failed} failed`);
	process.exit(failed > 0 ? 1 : 0);
}

main();
