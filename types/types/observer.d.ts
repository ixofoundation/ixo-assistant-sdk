import { ChatMessage } from './assistant';
export interface Observer {
    update(messages: ChatMessage[]): void;
}
