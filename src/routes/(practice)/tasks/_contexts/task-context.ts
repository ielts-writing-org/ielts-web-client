import type { Task2EvaluationResponse } from '@ielts/shared';
import { createContext } from 'svelte';

export type TaskContext = {
	task_2: {
		topic: string;
		response: string;
		evaluation_result?: Task2EvaluationResponse;
	};
};

export const [getTaskContext, setTaskContext, hasTaskContext] = createContext<TaskContext>();
