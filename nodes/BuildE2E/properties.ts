import type { INodeProperties } from 'n8n-workflow';

/* ------------------------------------------------------------------ */
/*                          Resource / Operation                       */
/* ------------------------------------------------------------------ */

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Scrape', value: 'scrape' },
		{ name: 'Search', value: 'search' },
	],
	default: 'scrape',
};

export const scrapeOperationProperty: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['scrape'] } },
	options: [{ name: 'Batch Scrape', value: 'batchScrape' }],
	default: 'batchScrape',
};

export const searchOperationProperty: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['search'] } },
	options: [{ name: 'Web Search', value: 'webSearch' }],
	default: 'webSearch',
};

/* ------------------------------------------------------------------ */
/*                          Scrape properties                          */
/* ------------------------------------------------------------------ */

const scrapeShow = { resource: ['scrape'], operation: ['batchScrape'] };

export const scrapeProperties: INodeProperties[] = [
	{
		displayName: 'URLs',
		name: 'urls',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com, https://example.org',
		description: 'Comma-separated list of URLs to scrape',
		displayOptions: { show: scrapeShow },
	},
	{
		displayName: 'Output Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Markdown', value: 'markdown' },
			{ name: 'HTML', value: 'html' },
		],
		default: 'markdown',
		description: 'Format of the scraped content',
		displayOptions: { show: scrapeShow },
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: scrapeShow },
		options: [
			{
				displayName: 'Only Main Content',
				name: 'onlyMainContent',
				type: 'boolean',
				default: true,
				description: 'Whether to extract only the main content of the page',
			},
			{
				displayName: 'Summary Query',
				name: 'summaryQuery',
				type: 'string',
				default: '',
				placeholder: 'Summarize the pricing information',
				description: 'An LLM query to summarize or extract specific info from the page',
			},
			{
				displayName: 'PDF Strategy',
				name: 'pdfStrategy',
				type: 'options',
				options: [
					{ name: 'OCR (Vision)', value: 'ocr' },
					{ name: 'Local (pdf-parse)', value: 'local' },
					{ name: 'Auto', value: 'auto' },
				],
				default: 'ocr',
				description: 'Strategy for extracting text from PDF URLs',
			},
			{
				displayName: 'Proxy Country',
				name: 'proxyCountry',
				type: 'string',
				default: '',
				placeholder: 'us',
				description: 'Route the request through a proxy in this country (ISO 3166-1 alpha-2)',
			},
		],
	},
	{
		displayName: 'Actions',
		name: 'actions',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Action',
		default: {},
		displayOptions: { show: scrapeShow },
		options: [
			{
				displayName: 'Action',
				name: 'actionItems',
				values: [
					{
						displayName: 'Action Type',
						name: 'actionType',
						type: 'options',
						options: [
							{ name: 'Click', value: 'click' },
							{ name: 'Evaluate JS', value: 'evaluate' },
							{ name: 'Go Back', value: 'goBack' },
							{ name: 'Navigate', value: 'navigate' },
							{ name: 'Press Key', value: 'press' },
							{ name: 'Scroll', value: 'scroll' },
							{ name: 'Type', value: 'type' },
							{ name: 'Wait', value: 'wait' },
							{ name: 'Wait for Response', value: 'waitForResponse' },
							{ name: 'Wait for Selector', value: 'waitForSelector' },
						],
						default: 'click',
					},
					{
						displayName: 'Selector',
						name: 'selector',
						type: 'string',
						default: '',
						placeholder: '#submit-btn',
						displayOptions: {
							show: { actionType: ['click', 'type', 'scroll', 'waitForSelector'] },
						},
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						displayOptions: { show: { actionType: ['type'] } },
					},
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: 'Enter',
						displayOptions: { show: { actionType: ['press'] } },
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/page2',
						displayOptions: { show: { actionType: ['navigate'] } },
					},
					{
						displayName: 'URL Pattern',
						name: 'urlPattern',
						type: 'string',
						default: '',
						placeholder: '/api/data',
						description: 'URL substring pattern to match for the network response',
						displayOptions: { show: { actionType: ['waitForResponse'] } },
					},
					{
						displayName: 'HTTP Method',
						name: 'method',
						type: 'options',
						options: [
							{ name: 'GET', value: 'GET' },
							{ name: 'POST', value: 'POST' },
							{ name: 'PUT', value: 'PUT' },
							{ name: 'PATCH', value: 'PATCH' },
							{ name: 'DELETE', value: 'DELETE' },
						],
						default: 'GET',
						description: 'Filter by HTTP method',
						displayOptions: { show: { actionType: ['waitForResponse'] } },
					},
					{
						displayName: 'Script',
						name: 'script',
						type: 'string',
						typeOptions: { rows: 4 },
						default: '',
						placeholder: 'document.querySelector("#el").innerText',
						description: 'JavaScript code to evaluate on the page',
						displayOptions: { show: { actionType: ['evaluate'] } },
					},
					{
						displayName: 'Milliseconds',
						name: 'milliseconds',
						type: 'number',
						default: 1000,
						displayOptions: { show: { actionType: ['wait'] } },
					},
					{
						displayName: 'Direction',
						name: 'direction',
						type: 'options',
						options: [
							{ name: 'Down', value: 'down' },
							{ name: 'Up', value: 'up' },
						],
						default: 'down',
						displayOptions: { show: { actionType: ['scroll'] } },
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'options',
						options: [
							{ name: 'Attached', value: 'attached' },
							{ name: 'Visible', value: 'visible' },
							{ name: 'Hidden', value: 'hidden' },
							{ name: 'Detached', value: 'detached' },
						],
						default: 'visible',
						description: 'Wait until the element reaches this state',
						displayOptions: { show: { actionType: ['waitForSelector'] } },
					},
					{
						displayName: 'Timeout (ms)',
						name: 'timeout',
						type: 'number',
						default: 30000,
						displayOptions: { show: { actionType: ['waitForSelector', 'waitForResponse'] } },
					},
				],
			},
		],
	},
];

/* ------------------------------------------------------------------ */
/*                          Search properties                          */
/* ------------------------------------------------------------------ */

const searchShow = { resource: ['search'], operation: ['webSearch'] };

export const searchProperties: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'best restaurants in Berlin',
		description: 'The search query',
		displayOptions: { show: searchShow },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 10,
		description: 'Max number of results to return',
		displayOptions: { show: searchShow },
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: searchShow },
		options: [
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'US',
				description: 'Country code for geo-targeted results (ISO 3166-1 alpha-2)',
			},
			{
				displayName: 'Include Domains',
				name: 'includeDomains',
				type: 'string',
				default: '',
				placeholder: 'reddit.com, stackoverflow.com',
				description: 'Comma-separated list of domains to restrict results to',
			},
			{
				displayName: 'Exclude Domains',
				name: 'excludeDomains',
				type: 'string',
				default: '',
				placeholder: 'pinterest.com',
				description: 'Comma-separated list of domains to exclude from results',
			},
			{
				displayName: 'Engine',
				name: 'engine',
				type: 'options',
				options: [
					{ name: 'Google', value: 'google' },
					{ name: 'Bing', value: 'bing' },
					{ name: 'ChatGPT', value: 'chatgpt' },
					{ name: 'Gemini', value: 'gemini' },
					{ name: 'Perplexity', value: 'perplexity' },
				],
				default: 'google',
				description: 'Search engine to use',
			},
		],
	},
];
