<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { page } from '$app/state';
	import type { Id } from '$convex/_generated/dataModel';
	import { askAdvisor } from '$lib/ai';
	import { LoaderCircle, User, Send, Bot, RefreshCw } from '@lucide/svelte';
	import { tick } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import MarkdownIt from 'markdown-it';

	const md = new MarkdownIt({
		linkify: true,
		typographer: true,
		breaks: true
	});

	let { open = $bindable(false) } = $props();

	const convex = useConvexClient();
	const gameId = $derived(page.params.gameId as Id<'games'>);

	let query = $state('');
	let isLoading = $state(false);
	const initialMessage = { role: 'advisor' as const, content: m.advisor_initial_greeting() };
	let messages = $state<{ role: 'user' | 'advisor'; content: string }[]>([initialMessage]);
	let scrollViewport = $state<HTMLElement | null>(null);

	async function scrollToBottom() {
		await tick();
		if (scrollViewport) {
			scrollViewport.scrollTop = scrollViewport.scrollHeight;
		}
	}

	function clearMessages() {
		messages = [initialMessage];
		query = '';
	}

	async function handleAsk(text: string) {
		if (!text.trim() || isLoading || !gameId) return;

		const userQuestion = text;
		query = '';
		messages = [...messages, { role: 'user', content: userQuestion }];
		isLoading = true;
		await scrollToBottom();

		try {
			const gameContext = await convex.query(api.games.getGameContext, { gameId });
			if (!gameContext) throw new Error('Could not load game context');

			const response = await askAdvisor(userQuestion, gameContext);
			messages = [...messages, { role: 'advisor', content: response }];
		} catch (error) {
			console.error('Advisor error:', error);
			messages = [
				...messages,
				{
					role: 'advisor',
					content: m.advisor_error_message()
				}
			];
		} finally {
			isLoading = false;
			await scrollToBottom();
		}
	}

	const quickQuestions = $derived([
		m.advisor_quick_strategic(),
		m.advisor_quick_summary(),
		m.advisor_quick_threats()
	]);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex h-[80vh] flex-col gap-0 p-0 sm:max-w-[600px]">
		<Dialog.Header class="border-b px-6 py-4">
			<Dialog.Title class="flex items-center gap-2">
				<Bot class="h-5 w-5" />
				{m.advisor_title()}
			</Dialog.Title>
			<Dialog.Description>
				{m.advisor_description()}
			</Dialog.Description>
		</Dialog.Header>

		<div class="min-h-0 flex-1">
			<ScrollArea class="h-full" bind:viewportRef={scrollViewport}>
				<div class="flex flex-col gap-4 p-4">
					{#each messages as msg, i (i)}
						<div class={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
							<div
								class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
									msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
								}`}
							>
								{#if msg.role === 'user'}
									<User class="h-4 w-4" />
								{:else}
									<Bot class="h-4 w-4" />
								{/if}
							</div>
							<div
								class={`max-w-[80%] rounded-lg p-3 text-sm ${
									msg.role === 'user'
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-foreground'
								}`}
							>
								<div
									class={msg.role === 'advisor'
										? 'prose prose-sm max-w-none dark:prose-invert'
										: 'wrap-break-word'}
								>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html md.render(msg.content)}
								</div>
							</div>
						</div>
					{/each}
					{#if isLoading}
						<div class="flex gap-3">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
								<Bot class="h-4 w-4" />
							</div>
							<div class="flex items-center rounded-lg bg-muted p-3">
								<LoaderCircle class="h-4 w-4 animate-spin" />
							</div>
						</div>
					{/if}
				</div>
			</ScrollArea>
		</div>

		<div class="mt-auto border-t bg-background p-4">
			{#if messages.length < 3}
				<div class="mb-4 flex gap-2 overflow-x-auto pb-2">
					{#each quickQuestions as q (q)}
						<Button
							variant="outline"
							size="sm"
							class="whitespace-nowrap"
							onclick={() => handleAsk(q)}
							disabled={isLoading}
						>
							{q}
						</Button>
					{/each}
				</div>
			{/if}

			<form
				class="flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					handleAsk(query);
				}}
			>
				<Textarea
					bind:value={query}
					placeholder={m.advisor_input_placeholder()}
					disabled={isLoading}
					class="min-h-[40px] flex-1 resize-none"
					rows={1}
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							if (!isLoading && query.trim()) {
								handleAsk(query);
							}
						}
					}}
				/>
				<Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
					<Send class="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon"
					onclick={clearMessages}
					disabled={isLoading || messages.length <= 1}
					title={m.advisor_clear_conversation()}
				>
					<RefreshCw class="h-4 w-4" />
				</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
