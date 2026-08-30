import { createContext } from 'svelte';

export type ChatMessage =
	| {
			role: 'user' | 'assistant';
			type: 'content';
			content: string;
	  }
	| {
			role: 'user' | 'assistant';
			type: 'context';
			context: {
				task: string;
				response_text: string;
			};
	  };

export type ChatContext = ChatMessage[];

export const [getChatContext, setChatContext, hasChatContext] = createContext<ChatContext>();
