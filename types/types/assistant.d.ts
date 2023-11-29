import { DeliverTxResponse } from '@cosmjs/stargate';
export type Config = {
    apiKey: string;
    address: string;
    did: string;
    network: string;
    expiration?: number;
    assistantUrl?: string;
};
export type ChatMessage = {
    role: string;
    content: string;
};
export type StreamingChatMessage = {
    role?: string;
    content?: string;
};
export type TransactionMessage = {
    role: string;
    name: string;
    content: string;
};
export type Message = ChatMessage | TransactionMessage;
export type TransactionHandler = (txBody: Uint8Array) => Promise<DeliverTxResponse | string>;
export interface NewChatRequest {
    address: string;
    did: string;
    network: string;
    messages?: ChatMessage[];
}
export interface NewChatResponse extends ChatMessage {
    id: string;
}
export interface ChatRequest {
    messages: ChatMessage[];
}
export type ChatResponse = Message;
