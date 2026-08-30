<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import { EventSourceParserStream } from 'eventsource-parser/stream';
	import { evaluateTask2 } from './_apis/evaluation-api.svelte';
	import { setTaskContext, type TaskContext } from './_contexts/task-context';
	import type { Task2EvaluationCriterion, Task2EvaluationResponse } from '@ielts/shared';
	import JSONParser from '@streamparser/json/jsonparser.js';

	let { children } = $props();
	let isEvaluating = $state(false);
	let evaluationModal: HTMLDialogElement;

	const taskContext = $state<TaskContext>({
		task_2: {
			topic:
				'Should unpaid community service be compulsory in high school? (Work for charities, neighbourhood improvement, sports mentoring). Discuss both views and give your opinion.',
			response: `In recent years, whether high school students should be required to participate in unpaid community work has sparked widespread debate. While some argue that academic focus should remain the sole priority, I firmly agree that mandatory voluntary programmes cultivate crucial civic values, develop practical teamwork abilities, and foster empathy among adolescents.
First and foremost, engaging in community initiatives exposes adolescents to real-world societal challenges outside the classroom. By assisting local charities, cleaning public parks, or mentoring younger children, pupils gain firsthand awareness of social inequality and civic responsibility.`
		}
	});
	setTaskContext(taskContext);

	const EMPTY_CRITERION: Task2EvaluationCriterion = {
		band: null,
		completion: null,
		checks: [],
		evidence: [],
		strengths: [],
		limitations: [],
		why_this_band: '',
		why_not_next_band: null
	};

	const CRITERIA_KEYS = [
		'task_response',
		'coherence_and_cohesion',
		'lexical_resource',
		'grammatical_range_and_accuracy'
	] as const satisfies readonly (keyof Task2EvaluationResponse['criteria'])[];

	const isCriteriaKey = (key: unknown): key is (typeof CRITERIA_KEYS)[number] =>
		CRITERIA_KEYS.includes(key as (typeof CRITERIA_KEYS)[number]);

	const handleEvaluateTask2 = async () => {
		try {
			isEvaluating = true;

			const stream = await evaluateTask2({
				topic: taskContext.task_2.topic,
				response_text: taskContext.task_2.response,
				context: { partial_response: true }
			});

			const reader = stream.pipeThrough(new EventSourceParserStream()).getReader();
			if (!reader) {
				throw new Error('Failed to get reader from response body');
			}

			// Initialize empty values to show the action is in progress
			taskContext.task_2.evaluation_result = {
				criteria: {
					task_response: { ...EMPTY_CRITERION },
					coherence_and_cohesion: { ...EMPTY_CRITERION },
					lexical_resource: { ...EMPTY_CRITERION },
					grammatical_range_and_accuracy: { ...EMPTY_CRITERION }
				},
				overall_band: null,
				feedback: { strongest_areas: [], highest_impact_problems: [], next_step: '' }
			};

			const jsonParser = new JSONParser({
				paths: ['$.overall_band', '$.feedback', '$.criteria.*']
			});
			jsonParser.onValue = ({ key, stack, value }) => {
				if (!taskContext.task_2.evaluation_result || !value) return;

				switch (stack.length) {
					case 0:
						break;
					case 1:
						if (key === 'overall_band') {
							taskContext.task_2.evaluation_result[key] =
								value as Task2EvaluationResponse['overall_band'];
						} else if (key === 'feedback') {
							taskContext.task_2.evaluation_result[key] =
								value as Task2EvaluationResponse['feedback'];
						}
						break;
					case 2:
						if (stack[1]?.key === 'criteria' && isCriteriaKey(key)) {
							taskContext.task_2.evaluation_result.criteria[key] =
								value as Task2EvaluationCriterion;
						}
						break;
				}
			};

			while (true) {
				const stringRaw = await reader.read();
				if (stringRaw.done || stringRaw.value.data === '[DONE]') {
					break;
				}

				const data = JSON.parse(stringRaw.value.data);
				jsonParser.write(data.choices?.[0]?.delta?.content ?? '');
			}
		} catch (error) {
			console.error(
				`Error during evaluation: ${error instanceof Error ? error.message : String(error)}`
			);
			evaluationModal.showModal();
		} finally {
			isEvaluating = false;
		}
	};
</script>

<header class="navbar sticky top-0 z-50 border-b border-base-300 bg-base-100">
	<div class="navbar-start lg:gap-4">
		<a
			href={resolve(localizeHref('/', { locale: getLocale() }) as Pathname)}
			class="lg:btn- btn btn-sm not-lg:btn-ghost lg:btn-md">
			<ArrowLeft size="1em" />
			<span class="hidden lg:inline">Dashboard</span>
		</a>
		<div>
			<h2 class="font-bold lg:hidden">Task 2</h2>
			<h2 class="hidden font-bold lg:block">IELTS Writing Task 2</h2>
			<h3 class="hidden text-xs lg:block">Write an essay on the given topic</h3>
		</div>
	</div>

	<div class="navbar-end">
		<button class="group btn btn-primary" onclick={handleEvaluateTask2} disabled={isEvaluating}>
			<span class="loading loading-spinner not-group-disabled:hidden"></span>
			Evaluate
			<ArrowRight size="1em" />
		</button>
	</div>
</header>

<dialog bind:this={evaluationModal} class="modal" id="my_modal_1">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Error during evaluation</h3>
		<p class="py-4">There was an error during the evaluation process.</p>
		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Close</button>
			</form>
		</div>
	</div>
</dialog>

{@render children()}
