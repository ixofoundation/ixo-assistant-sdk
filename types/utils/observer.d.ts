import { ChatMessage } from '../types/assistant';
import { Observer } from '../types/observer';
export default class Observable {
    private observers;
    protected notifyObservers(messages: ChatMessage[]): void;
    subscribe(observer: Observer): void;
    unsubscribe(observer: Observer): void;
}
