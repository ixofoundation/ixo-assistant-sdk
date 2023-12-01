import * as AssistantTypes from '../types/assistant';
import { hex_to_uint8Arr } from './encoding';
import { fetchPolyfill } from './fetch-polyfill';
import Observable from './observer';

export default class Assistant extends Observable {
	private url = 'https://relayer.assistant.ixo.earth';
	private apiKey: string;
	private address: string;
	private did: string;
	private network: string;
	private count: number = 0;
	private maxCount: number = 1;

	private id?: string = undefined;
	private messages: AssistantTypes.Message[] = [];
	private transactionHandler?: AssistantTypes.TransactionHandler = undefined;

	constructor({ apiKey, address, did, network, assistantUrl }: AssistantTypes.Config) {
		super();
		if (!apiKey) throw new Error('API Key is required to use the Assistant');
		this.apiKey = apiKey;
		if (!address) throw new Error('User Address is required to use the Assistant');
		this.address = address;
		if (!did) throw new Error('User DID is required to use the Assistant');
		this.did = did;
		if (!network) throw new Error('Network is required to use the Assistant');
		if (network !== 'mainnet' && network !== 'testnet' && network !== 'devnet')
			throw new Error('Invalid network, cannot use the Assistant');
		if (assistantUrl && typeof assistantUrl === 'string') this.url = assistantUrl;
		this.network = network;
	}

	private resetCount() {
		this.count = 0;
	}

	private incrementCount() {
		this.count += 1;
	}

	private get countReached() {
		return this.count === this.maxCount;
	}

	private get countExceeded() {
		return this.count > this.maxCount;
	}

	private addMessage(message: AssistantTypes.Message) {
		this.messages.push(message);
		this.notifyObservers(this.getMessages);
		return this.getMessages;
	}

	private addStreamMessage(message: AssistantTypes.StreamingChatMessage) {
		if (message.role) {
			this.messages.push(message as AssistantTypes.ChatMessage);
		} else {
			if (message.content) this.messages[this.messages.length - 1].content += message.content;
		}
		this.notifyObservers(this.getMessages);
	}

	private async requestNewChat(
		contextMessages?: AssistantTypes.ChatMessage[],
	): Promise<AssistantTypes.NewChatResponse> {
		const data: AssistantTypes.NewChatRequest = {
			address: this.address,
			did: this.did,
			network: this.network,
		};
		if (contextMessages?.length) data.messages = contextMessages;
		const response = await fetch(this.url + '/assistant/chat/new', {
			method: 'post',
			headers: {
				Accept: 'application/json, text/plain, */*',
				'Content-Type': 'application/json',
				Authorization: this.apiKey,
			},
			body: JSON.stringify(data),
		});
		if (!response.ok || !response.body) throw response.statusText;
		return response.json() as unknown as AssistantTypes.NewChatResponse;
	}

	private async requestChat(messages: AssistantTypes.Message[]): Promise<AssistantTypes.ChatResponse> {
		const data: AssistantTypes.ChatRequest = {
			messages,
		};
		const response = await fetch(this.url + '/assistant/chat/' + this.id, {
			method: 'post',
			headers: {
				Accept: 'application/json, text/plain, */*',
				'Content-Type': 'application/json',
				Authorization: this.apiKey,
			},
			body: JSON.stringify(data),
		});
		if (!response.ok || !response.body) throw response.statusText;
		return response.json() as unknown as AssistantTypes.ChatResponse;
	}

	private async requestChatStream(
		messages: AssistantTypes.Message[],
	): Promise<ReadableStreamDefaultReader<Uint8Array>> {
		const data: AssistantTypes.ChatRequest = {
			messages,
		};
		const response = await fetch(this.url + '/assistant/stream/' + this.id, {
			method: 'post',
			headers: {
				Accept: 'application/json, text/plain, */*',
				'Content-Type': 'application/json',
				Authorization: this.apiKey,
			},
			body: JSON.stringify(data),
		});
		// @ts-ignore
		if (!response.ok || !response.body || typeof response.body.getReader !== 'function') throw response.statusText;
		// @ts-ignore
		return response.body.getReader() as unknown as ReadableStreamDefaultReader<Uint8Array>;
	}

	private async requestNewChatStream(
		contextMessages?: AssistantTypes.ChatMessage[],
	): Promise<ReadableStreamDefaultReader<Uint8Array>> {
		const data: AssistantTypes.NewChatRequest = {
			address: this.address,
			did: this.did,
			network: this.network,
		};
		if (contextMessages?.length) data.messages = contextMessages;
		const response = await fetch(this.url + '/assistant/stream/new', {
			method: 'post',
			headers: {
				Accept: 'application/json, text/plain, */*',
				'Content-Type': 'application/json',
				Authorization: this.apiKey,
			},
			body: JSON.stringify(data),
		});
		// @ts-ignore
		if (!response.ok || !response.body || typeof response.body.getReader !== 'function') throw response.statusText;
		// @ts-ignore
		return response.body.getReader() as unknown as ReadableStreamDefaultReader<Uint8Array>;
	}

	async newChat(stream = false, contextMessages?: AssistantTypes.ChatMessage[]) {
		await fetchPolyfill();
		if (this.id) throw new Error('Chat already instantiated');
		if (this.messages.length) return;
		if (contextMessages?.length) this.messages = contextMessages;
		if (!stream) {
			const response = await this.requestNewChat(contextMessages);
			const { id, ...message } = response;
			this.id = id;
			this.addMessage(message);
			return this.getMessages;
		}
		const response = await this.requestNewChatStream(contextMessages);
		const decoder = new TextDecoder();
		const loopRunner = true;
		while (loopRunner) {
			const { value, done } = await response.read();
			if (done) break;
			const decodedChunk = decoder.decode(value, { stream: true });
			decodedChunk.split('|\n|').forEach((chunk: string) => {
				if (!chunk || chunk === '{}') return;
				const data = JSON.parse(chunk);
				if (data.id && !this.id) this.id = data.id;
				this.addStreamMessage(data);
			});
		}
		return this.getMessages;
	}

	async chat(stream = false, message: string) {
		await fetchPolyfill();
		if (!this.id) throw new Error('Instantiate a new chat before sending messages');
		this.resetCount();
		this.addMessage({
			role: 'user',
			content: message,
		});
		return this.assistantChat(stream, this.messages);
	}

	private async assistantChat(stream = false, messages: AssistantTypes.ChatMessage[]) {
		if (this.countExceeded)
			return this.addMessage({
				role: 'assistant',
				content: 'An unexpected error occurred with the assistant. Please try again later.',
			});
		this.incrementCount();
		if (!stream) {
			const response = await this.requestChat(messages);
			if (response?.role === 'transaction')
				return this.handleTransaction(stream, response as AssistantTypes.TransactionMessage);
			return this.addMessage(response);
		}
		const response = await this.requestChatStream(messages);
		const decoder = new TextDecoder();
		const loopRunner = true;
		let transactionMessage: AssistantTypes.TransactionMessage | undefined;
		while (loopRunner) {
			const { value, done } = await response.read();
			if (done) break;
			const decodedChunk = decoder.decode(value, { stream: true });
			decodedChunk.split('|\n|').forEach((chunk: string) => {
				if (!chunk || chunk === '{}') return;
				const data = JSON.parse(chunk);
				if (data.role) {
					if (data.role !== 'transaction') return this.addStreamMessage(data);
					return (transactionMessage = data);
				}
				if (!transactionMessage) return this.addStreamMessage(data);
				if (data.content) transactionMessage.content += data.content;
				if (data.name) (transactionMessage as AssistantTypes.TransactionMessage).name += data.name;
			});
		}
		if (transactionMessage) return this.handleTransaction(stream, transactionMessage);
		return this.getMessages;
	}

	private async handleTransaction(
		stream = false,
		message: AssistantTypes.TransactionMessage,
	): Promise<AssistantTypes.ChatMessage[]> {
		if (!this.transactionHandler)
			return this.assistantChat(stream, [
				...this.messages,
				{
					role: 'function',
					name: message.name,
					content: 'No transaction handler provided. The user must log in with their wallet or try again later.',
				},
			]);
		const txBody = hex_to_uint8Arr(message.content);
		if (!(txBody instanceof Uint8Array))
			return this.assistantChat(stream, [
				...this.messages,
				{
					role: 'function',
					name: message.name,
					content: 'Invalid transaction body.',
				},
			]);
		try {
			const result = await this.transactionHandler(txBody);
			const messages = this.messages.concat([
				{
					role: 'function',
					name: message.name,
					content: !result
						? 'unknown result - user must manually check to confirm tx success or failure on mintscan'
						: typeof result === 'object'
						? 'Transaction success - ' + JSON.stringify(result)
						: 'Transaction success - ' + result,
				},
			]);
			return this.assistantChat(stream, messages);
		} catch (error) {
			console.error('handleTransaction::', error);
			const messages = this.messages.concat([
				{
					role: 'function',
					name: message.name,
					content: `Transaction Failed - ` + (error as { message: string }).message,
				},
			]);
			return this.assistantChat(stream, messages);
		}
	}

	async onTransaction(handler: AssistantTypes.TransactionHandler) {
		if (handler && typeof handler === 'function') this.transactionHandler = handler;
	}

	get getMessages() {
		return this.messages.filter((m) => m.role === 'assistant' || m.role === 'user') as AssistantTypes.ChatMessage[];
	}
}
