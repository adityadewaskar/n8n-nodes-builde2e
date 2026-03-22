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

import { buildActions, type RawAction } from './actions';
import {
	resourceProperty,
	scrapeOperationProperty,
	searchOperationProperty,
	scrapeProperties,
	searchProperties,
} from './properties';

function splitCsv(value: string | undefined): string[] {
	if (!value) return [];
	return value.split(',').map((s) => s.trim()).filter(Boolean);
}

async function executeScrape(
	ctx: IExecuteFunctions,
	i: number,
	baseUrl: string,
): Promise<INodeExecutionData[]> {
	const urlsRaw = ctx.getNodeParameter('urls', i) as string;
	const type = ctx.getNodeParameter('type', i) as string;
	const additionalOptions = ctx.getNodeParameter('additionalOptions', i) as IDataObject;
	const actionsParam = ctx.getNodeParameter('actions', i) as IDataObject;

	const rawUrls = splitCsv(urlsRaw);
	if (!rawUrls.length) {
		throw new Error('No URLs provided. Enter at least one URL to scrape.');
	}
	const actions = buildActions(actionsParam as { actionItems?: RawAction[] });

	// Actions belong per-URL (BatchScrapeOptionsSchema doesn't accept top-level actions)
	const urls: (IDataObject | string)[] = actions
		? rawUrls.map((u) => ({ url: u, actions }) as IDataObject)
		: rawUrls;

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

	const options: IHttpRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		url: `${baseUrl}/scrape/batch`,
		body,
		json: true,
	};

	const response = (await ctx.helpers.httpRequestWithAuthentication.call(
		ctx,
		'buildE2EApi',
		options,
	)) as IDataObject;

	const results = (response.results as IDataObject[]) ?? [];
	if (results.length) {
		return results.flatMap((result) =>
			ctx.helpers.constructExecutionMetaData(
				ctx.helpers.returnJsonArray(result),
				{ itemData: { item: i } },
			),
		);
	}

	return ctx.helpers.constructExecutionMetaData(
		ctx.helpers.returnJsonArray(response),
		{ itemData: { item: i } },
	);
}

async function executeSearch(
	ctx: IExecuteFunctions,
	i: number,
	baseUrl: string,
): Promise<INodeExecutionData[]> {
	const query = ctx.getNodeParameter('query', i) as string;
	const limit = ctx.getNodeParameter('limit', i) as number;
	const searchOptions = ctx.getNodeParameter('searchOptions', i) as IDataObject;

	const body: IDataObject = { queries: [query], limit };

	if (searchOptions.location) body.location = searchOptions.location;
	if (searchOptions.includeDomains) body.includeDomains = splitCsv(searchOptions.includeDomains as string);
	if (searchOptions.excludeDomains) body.excludeDomains = splitCsv(searchOptions.excludeDomains as string);
	if (searchOptions.engine) body.engine = searchOptions.engine;

	const options: IHttpRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		url: `${baseUrl}/search`,
		body,
		json: true,
	};

	const response = (await ctx.helpers.httpRequestWithAuthentication.call(
		ctx,
		'buildE2EApi',
		options,
	)) as IDataObject;

	const returnData: INodeExecutionData[] = [];
	const results = response.results as IDataObject[] | undefined;
	if (results?.length) {
		for (const queryResult of results) {
			const webResults = (queryResult.results as IDataObject[]) ?? [];
			for (const webResult of webResults) {
				returnData.push(
					...ctx.helpers.constructExecutionMetaData(
						ctx.helpers.returnJsonArray(webResult),
						{ itemData: { item: i } },
					),
				);
			}
		}
	}

	return returnData;
}

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
		credentials: [{ name: 'buildE2EApi', required: true }],
		properties: [
			resourceProperty,
			scrapeOperationProperty,
			searchOperationProperty,
			...scrapeProperties,
			...searchProperties,
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
					returnData.push(...await executeScrape(this, i, baseUrl));
				} else if (resource === 'search' && operation === 'webSearch') {
					returnData.push(...await executeSearch(this, i, baseUrl));
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push(
						...this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray({ error: (error as Error).message }),
							{ itemData: { item: i } },
						),
					);
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
