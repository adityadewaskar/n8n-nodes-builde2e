"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildE2EApi = void 0;
class BuildE2EApi {
    constructor() {
        this.name = 'buildE2EApi';
        this.displayName = 'BuildE2E API';
        this.documentationUrl = 'https://docs.builde2e.com';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'x-api-key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
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
}
exports.BuildE2EApi = BuildE2EApi;
//# sourceMappingURL=BuildE2EApi.credentials.js.map