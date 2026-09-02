<script lang="ts">
	import type { Task2EvaluationResponse } from '@ielts/shared/schemas';
	import { Send } from '@lucide/svelte';
	import { getTaskContext } from '../_contexts/task-context';
	import { setChatContext, type ChatContext } from '../_contexts/chat-context';

	const criteriaMap = {
		task_response: 'Task Response',
		coherence_and_cohesion: 'Coherence and Cohesion',
		lexical_resource: 'Lexical Resource',
		grammatical_range_and_accuracy: 'Grammatical Range and Accuracy'
	} as const satisfies Record<keyof Task2EvaluationResponse['criteria'], string>;

	const taskContext = getTaskContext();
	const chatContext = $state<ChatContext>([
		{
			role: 'user',
			type: 'context',
			context: {
				task: 'Should unpaid community service be compulsory in high school? (Work for charities, neighbourhood improvement, sports mentoring). Discuss both views and give your opinion.',
				response_text: `In recent years, whether high school students should be required to participate in unpaid community work has sparked widespread debate. While some argue that academic focus should remain the sole priority, I firmly agree that mandatory voluntary programmes cultivate crucial civic values, develop practical teamwork abilities, and foster empathy among adolescents.
First and foremost, engaging in community initiatives exposes adolescents to real-world societal challenges outside the classroom. By assisting local charities, cleaning public parks, or mentoring younger children, pupils gain firsthand awareness of social inequality and civic responsibility.`
			}
		},
		{
			role: 'user',
			type: 'content',
			content: 'How should I continue my essay?'
		},
		{
			role: 'assistant',
			type: 'content',
			content:
				'To continue your essay, you could elaborate on the benefits of mandatory community service. For instance, you might discuss how it helps students develop essential life skills such as communication, leadership, and problem-solving. Additionally, you could highlight how these experiences can enhance their college applications and future career prospects. Finally, consider addressing potential counterarguments, such as the concern that mandatory service may detract from academic performance, and provide evidence or examples to support your stance.'
		}
	]);
	setChatContext(chatContext);
</script>

<aside
	class="sticky top-[10.5%] flex h-[calc(100dvh-6rem)] flex-1 flex-col gap-4 p-2 xl:top-[9.5%]">
	<div class="flex justify-between">
		<div class="flex items-center gap-2">
			<h3 class="text-xl font-bold">AI Tutor</h3>
		</div>
		{#if taskContext.task_2.evaluation_result}
			{@const overallBand = taskContext.task_2.evaluation_result.overall_band}
			{#if overallBand}
				<p class="badge badge-info">Est. Band {overallBand.toPrecision(2)}</p>
			{:else}
				<p class="badge animate-pulse badge-info">Estimating...</p>
			{/if}
		{/if}
	</div>

	<div
		class="flex flex-1 flex-col gap-2 overflow-y-auto rounded-md border border-base-300 bg-base-100 p-3">
		{#if taskContext.task_2.evaluation_result === undefined}
			<p class="text-base-content/75">No evaluations yet.</p>
		{:else}
			{#each Object.entries(taskContext.task_2.evaluation_result.criteria) as [criterion, evaluation] (criterion)}
				<details class="collapse-arrow collapse bg-base-100">
					<summary class="collapse-title cursor-pointer p-0 font-semibold">
						<p>
							{criteriaMap[criterion as keyof Task2EvaluationResponse['criteria']] || criterion}
						</p>
						{#if evaluation.band}
							<p
								class:text-green-500={evaluation.band! >= 7.5}
								class:text-yellow-500={evaluation.band! >= 6.5 && evaluation.band! < 7.5}
								class:text-red-500={evaluation.band! < 6.5}>
								Band {evaluation.band.toPrecision(2)}
							</p>
						{:else}
							<p class="animate-pulse text-base-content/75">Analyzing…</p>
						{/if}
					</summary>
					{#if evaluation.why_this_band}
						{@const evaluations = evaluation.checks}
						<div class="collapse-content text-sm">
							<p class="text-base-content/75">{evaluation.why_this_band}</p>
							{#if evaluations && evaluations.length > 0}
								<p class="mt-2 font-semibold text-base-content/75">Checks:</p>
								<ul class="list pl-6">
									{#each evaluations as evaluation (evaluation.id)}
										<li class="list-decimal py-1">
											<details class="collapse">
												<summary
													class="collapse-title flex cursor-pointer flex-col justify-between p-0 sm:flex-row">
													<span>{evaluation.id}</span>
													<span
														class={[
															'badge badge-sm',
															{
																'badge-success': evaluation.status === 'met',
																'badge-warning': evaluation.status === 'partially_met',
																'badge-error': evaluation.status === 'not_met',
																'badge-ghost': evaluation.status === 'not_applicable'
															}
														]}>
														{evaluation.status}
													</span>
												</summary>
												<div class="collapse-content">
													<p class="text-base-content/75">
														<span class="font-semibold">Evidence:</span>
														{evaluation.evidence}
													</p>
													<p class="text-base-content/75">
														<span class="font-semibold">Reason:</span>
														{evaluation.why}
													</p>
												</div>
											</details>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				</details>
			{/each}
		{/if}
	</div>

	<div
		class="flex max-h-[50dvh] flex-2 flex-col gap-2 overflow-y-auto rounded-md border border-base-300 bg-base-100 p-3 text-sm">
		{#if chatContext.length === 0}
			<p class="text-base-content/75">No chats yet.</p>
		{:else}
			{#each chatContext as chat, index (index)}
				{#if chat.type === 'content'}
					<div
						class="chat"
						class:chat-start={chat.role === 'assistant'}
						class:chat-end={chat.role === 'user'}>
						<p class="chat-header">{chat.role === 'user' ? 'You' : 'AI Tutor'}</p>
						<p class="chat-bubble" class:chat-bubble-primary={chat.role === 'user'}>
							{chat.content}
						</p>
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<div class="join">
		<label class="input join-item flex-1">
			<input type="email" placeholder="Ask a question about your essay..." required />
		</label>
		<button class="btn join-item btn-primary" type="submit" onclick={() => alert('In Development')}>
			Send
			<Send size="1em" />
		</button>
	</div>
</aside>
