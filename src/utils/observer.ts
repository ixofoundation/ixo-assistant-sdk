import { ChatMessage } from '../types/assistant';
import { Observer } from '../types/observer';

export default class Observable {
	private observers: Observer[] = [];

	protected notifyObservers(messages: ChatMessage[]): void {
		this.observers.forEach((observer) => observer.update(messages));
	}

	public subscribe(observer: Observer): void {
		this.observers.push(observer);
		console.info(`Successfully subscribed observer ${this.observers.length - 1}`);
	}

	public unsubscribe(observer: Observer): void {
		const index = this.observers.indexOf(observer);
		if (index > -1) {
			this.observers.splice(index, 1);
			console.info(`Successfully unsubscribed observer ${index}`);
		} else {
			console.warn(`Failed to unsubscribe observer ${index}`);
		}
	}
}
