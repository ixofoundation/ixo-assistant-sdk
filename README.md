# IXO ASSISTANT SDK 💼

![GitHub contributors](https://img.shields.io/github/contributors/ixofoundation/jambo-wallet-sdk)
![GitHub repo size](https://img.shields.io/github/repo-size/ixofoundation/jambo-wallet-sdk)
![Twitter Follow](https://img.shields.io/twitter/follow/ixoworld?style=social)
![Medium](https://img.shields.io/badge/Medium-12100E?style=for-the-badge&logo=medium&logoColor=white)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

<br />

<h2 align="center">
    An SDK to easily access the Ixo transaction assistant
</h2>

<br />

This repo and product is intentionally managed as Open Source and we aim to use this guide to light our way https://opensource.guide/.
Let us know how we are doing!

## 🔨 Install

```sh
npm install @ixo/assistant-sdk
# or
yarn add  @ixo/assistant-sdk
```

## 💻 Usage

The IXO Assistant SDK simplifies interactions with the Ixo blockchain via ChatGPT. It's designed for users of all technical levels to query blockchain data and generate transactions with ease.

Key Features:

1. **Ease of Use**: Users can interact with the ixo blockchain through a friendly AI interface, without needing to manually craft queries or transaction objects.
2. **ChatGPT Integration**: Harnessing the power of ChatGPT, the SDK allows for natural language processing and complex data handling, offering a smooth and intuitive user experience.
3. **ixo Chain Compatibility**: Specifically tailored for the ixo blockchain, the SDK ensures seamless and efficient interactions with the blockchain network.

The SDK acts as a conduit between the assistant server and the ixo blockchain, enabling tasks like querying data or initiating transactions through simple prompts and commands.

## Assistant

The `Assistant` class is central to the SDK, managing chat sessions and blockchain transactions.

```ts
import Assistant from '@ixo/assistant-sdk';

const assistant = new Assistant({
	apiKey: 'your-api-key',
	address: 'user-address',
	did: 'user-did',
	network: 'testnet',
	// Optional: assistantUrl
});
```

Configuration Parameters:

- **apiKey**: API key for accessing the assistant.
- **address**: Logged-in user's address for data queries and transactions.
- **did**: User's Decentralized Identifier for data queries and transactions.
- **network**: Active blockchain network ('mainnet', 'testnet', or 'devnet').
- **assistantUrl** (optional): Custom assistant relayer URL.

**⚠️ Important**: Do not change these parameters during usage. For different networks or user accounts, instantiate a new Assistant.

## Observer

The IXO Assistant SDK utilizes the observer pattern to allow real-time updates to the state of the chat session. This feature is particularly useful for applications that need to react dynamically to changes in chat content, such as updating a UI in response to new messages.

```ts
const [messages, setMessages] = React.useState<ChatMessage[]>([]);

useEffect(() => {
	const observer: Observer = {
		update: (updatedMessages: ChatMessage[]) => setMessages([...updatedMessages]),
	};
	// Subscribe to the observable
	assistant.subscribe(observer);
	// Unsubscribe from the observable when the component unmounts
	return () => {
		assistant.unsubscribe(observer);
	};
}, [assistant]);
```

Once subscribed, the update method of your observer will be called whenever there are new messages. If you need to stop receiving updates (for example, when a user navigates away from a chat screen), you can unsubscribe your observer from the Assistant.

## Methods

### newChat

Start a new chat session with the assistant (no chat will persist past its session).

```ts
const response = await assistant.newChat(stream, contextMessages);
```

Parameters:

- **stream (boolean)**: Stream assistant's responses or receive complete response at once.
- **contextMessages (ChatMessage[]) (optional)**: additional context messages.

### chat

Communicate with the assistant:

```ts
const response = await assistant.chat(stream, message);
```

Parameters:

- **stream (boolean)**: Stream assistant responses or receive complete response at once.
- **message (string)**: The user's input message.

### onTransaction

Set a transaction handler that accepts a transaction and **must** return a string that indicates transaction success or failure or the full blockchain response to correctly determine transaction success or failure.

```ts
assistant.onTransaction((txBody: Uint8Array) => {
	// Process the transaction
});
```

The arguments provided to the transaction handler are as follows:

- **txBody (Uint8Array)**: Encoded transaction body for processing (decoded with `@ixo/impactxclient-sdk` registry)

### getMessages

Retrieve chat messages:

```ts
const messages = assistant.getMessages;
```

Returns an array of chat messages (excluding context and function messages).
