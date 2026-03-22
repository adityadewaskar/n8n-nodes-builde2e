import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

/* ------------------------------------------------------------------ */
/*                        Helper: build actions                       */
/* ------------------------------------------------------------------ */

interface RawAction {
	actionType: string;
	selector?: string;
	text?: string;
	key?: string;
	url?: string;
	milliseconds?: number;
	direction?: string;
	timeout?: number;
}

function buildActions(raw: { actionItems?: RawAction[] } | undefined): IDataObject[] | undefined {
	if (!raw?.actionItems?.length) return undefined;

	return raw.actionItems.map((a) => {
		const action: IDataObject = { type: a.actionType };
		switch (a.actionType) {
			case 'click':
				action.selector = a.selector;
				break;
			case 'wait':
				action.milliseconds = a.milliseconds;
				break;
			case 'type':
				action.selector = a.selector;
				action.text = a.text;
				break;
			case 'press':
				action.key = a.key;
				break;
			case 'scroll':
				if (a.direction) action.direction = a.direction;
				if (a.selector) action.selector = a.selector;
				break;
			case 'waitForSelector':
				action.selector = a.selector;
				if (a.timeout) action.timeout = a.timeout;
				break;
			case 'navigate':
				action.url = a.url;
				break;
			case 'goBack':
				break;
		}
		return action;
	});
}

/* ------------------------------------------------------------------ */
/*                            Main node                               */
/* ------------------------------------------------------------------ */

export class BuildE2E implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BuildE2E',
		name: 'buildE2E',
		icon: 'file:builde2e.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Scrape web pages and search the web with BuildE2E',
		defaults: { name: 'BuildE2E' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'buildE2EApi',
				required: true,
			},
		],
		properties: [
			/* ---- Resource ---- */
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Scrape', value: 'scrape' },
					{ name: 'Search', value: 'search' },
				],
				default: 'scrape',
			},

			/* ---- Operation: Scrape ---- */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['scrape'] } },
				options: [{ name: 'Batch Scrape', value: 'batchScrape' }],
				default: 'batchScrape',
			},

			/* ---- Operation: Search ---- */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['search'] } },
				options: [{ name: 'Web Search', value: 'webSearch' }],
				default: 'webSearch',
			},

			/* ============================================================ */
			/*                     Scrape: batchScrape                      */
			/* ============================================================ */
			{
				displayName: 'URLs',
				name: 'urls',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://example.com, https://example.org',
				description: 'Comma-separated list of URLs to scrape',
				displayOptions: { show: { resource: ['scrape'], operation: ['batchScrape'] } },
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
				displayOptions: { show: { resource: ['scrape'], operation: ['batchScrape'] } },
			},

			/* -- Scrape: additional options -- */
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['scrape'], operation: ['batchScrape'] } },
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

			/* -- Scrape: actions -- */
			{
				displayName: 'Actions',
				name: 'actions',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add Action',
				default: {},
				displayOptions: { show: { resource: ['scrape'], operation: ['batchScrape'] } },
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
									{ name: 'Go Back', value: 'goBack' },
									{ name: 'Navigate', value: 'navigate' },
									{ name: 'Press Key', value: 'press' },
									{ name: 'Scroll', value: 'scroll' },
									{ name: 'Type', value: 'type' },
									{ name: 'Wait', value: 'wait' },
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
								displayName: 'Timeout (ms)',
								name: 'timeout',
								type: 'number',
								default: 30000,
								displayOptions: { show: { actionType: ['waitForSelector'] } },
							},
						],
					},
				],
			},

			/* ============================================================ */
			/*                     Search: webSearch                        */
			/* ============================================================ */
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'best restaurants in Berlin',
				description: 'The search query',
				displayOptions: { show: { resource: ['search'], operation: ['webSearch'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 50 },
				default: 10,
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['search'], operation: ['webSearch'] } },
			},

			/* -- Search: additional options -- */
			{
				displayName: 'Additional Options',
				name: 'searchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['search'], operation: ['webSearch'] } },
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
							{ name: 'Perplexity', value: 'perplexity' },
						],
						default: 'google',
						description: 'Search engine to use',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('buildE2EApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'scrape' && operation === 'batchScrape') {
					const urlsRaw = this.getNodeParameter('urls', i) as string;
					const type = this.getNodeParameter('type', i) as string;
					const additionalOptions = this.getNodeParameter('additionalOptions', i) as IDataObject;
					const actionsParam = this.getNodeParameter('actions', i) as IDataObject;

					const urls = urlsRaw
						.split(',')
						.map((u) => u.trim())
						.filter(Boolean);

					const body: IDataObject = { urls, type };

					if (additionalOptions.onlyMainContent !== undefined) {
						body.onlyMainContent = additionalOptions.onlyMainContent;
					}
					if (additionalOptions.summaryQuery) {
						body.summary = { query: additionalOptions.summaryQuery };
					}
					if (additionalOptions.pdfStrategy) {
						body.pdfStrategy = additionalOptions.pdfStrategy;
					}
					if (additionalOptions.proxyCountry) {
						body.proxy = { country: additionalOptions.proxyCountry };
					}

					const actions = buildActions(actionsParam as { actionItems?: RawAction[] });
					if (actions) {
						body.actions = actions;
					}

					const options: IHttpRequestOptions = {
						method: 'POST' as IHttpRequestMethods,
						url: `${baseUrl}/scrape/batch`,
						body,
						json: true,
					};

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'buildE2EApi',
						options,
					)) as IDataObject;

					// Flatten: each scrape result becomes a separate output item
					const results = (response.results as IDataObject[]) ?? [];
					if (results.length) {
						for (const result of results) {
							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(result),
								{ itemData: { item: i } },
							);
							returnData.push(...executionData);
						}
					} else {
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(response),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					}

				} else if (resource === 'search' && operation === 'webSearch') {
					const query = this.getNodeParameter('query', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;
					const searchOptions = this.getNodeParameter('searchOptions', i) as IDataObject;

					const body: IDataObject = {
						queries: [query],
						limit,
					};

					if (searchOptions.location) {
						body.location = searchOptions.location;
					}
					if (searchOptions.includeDomains) {
						body.includeDomains = (searchOptions.includeDomains as string)
							.split(',')
							.map((d) => d.trim())
							.filter(Boolean);
					}
					if (searchOptions.excludeDomains) {
						body.excludeDomains = (searchOptions.excludeDomains as string)
							.split(',')
							.map((d) => d.trim())
							.filter(Boolean);
					}
					if (searchOptions.engine) {
						body.engine = searchOptions.engine;
					}

					const options: IHttpRequestOptions = {
						method: 'POST' as IHttpRequestMethods,
						url: `${baseUrl}/search`,
						body,
						json: true,
					};

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'buildE2EApi',
						options,
					)) as IDataObject;

					// Flatten: each web result becomes a separate output item
					const results = response.results as IDataObject[] | undefined;
					if (results?.length) {
						for (const queryResult of results) {
							const webResults = (queryResult.results as IDataObject[]) ?? [];
							for (const webResult of webResults) {
								const executionData = this.helpers.constructExecutionMetaData(
									this.helpers.returnJsonArray(webResult),
									{ itemData: { item: i } },
								);
								returnData.push(...executionData);
							}
						}
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
