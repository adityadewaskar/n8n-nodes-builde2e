import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BuildE2EApi implements ICredentialType {
	name = 'buildE2EApi';
	displayName = 'BuildE2E API';
	documentationUrl = 'https://docs.builde2e.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'uc-...',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.builde2e.com/api/v1',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.baseUrl}}/search',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ queries: ['test'], limit: 1 }),
		},
	};
}
