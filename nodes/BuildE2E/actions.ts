import type { IDataObject } from 'n8n-workflow';

export interface RawAction {
	actionType: string;
	selector?: string;
	text?: string;
	key?: string;
	url?: string;
	urlPattern?: string;
	method?: string;
	milliseconds?: number;
	direction?: string;
	timeout?: number;
	state?: string;
	script?: string;
}

export function buildActions(raw: { actionItems?: RawAction[] } | undefined): IDataObject[] | undefined {
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
				if (a.state) action.state = a.state;
				break;
			case 'waitForResponse':
				action.urlPattern = a.urlPattern;
				if (a.method) action.method = a.method;
				if (a.timeout) action.timeout = a.timeout;
				break;
			case 'navigate':
				action.url = a.url;
				break;
			case 'goBack':
				break;
			case 'evaluate':
				action.script = a.script;
				break;
		}
		return action;
	});
}
