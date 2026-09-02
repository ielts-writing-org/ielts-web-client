import { createContext } from 'svelte';
import type { Task2EvaluationHandler } from '../_handlers/task2-evaluation-handler.svelte';

type HandlerContext = {
	task2EvaluationHandler: Task2EvaluationHandler;
};

export const [getHandlerContext, setHandlerContext] = createContext<HandlerContext>();
