<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { TriangleAlert, ExternalLink, Check, Settings } from '@lucide/svelte';
	import { isOpenRouterError as checkIsOpenRouterError } from '$lib/utils/errorClassification';

	let {
		open = $bindable(false),
		errorMessage = '',
		onOpenSettings
	}: { open: boolean; errorMessage: string; onOpenSettings?: () => void } = $props();

	const OLLAMA_DOCS_URL = 'https://docs.ollama.com/';
	const OPENROUTER_DOCS_URL = 'https://openrouter.ai/docs';

	// Track which command was just copied for visual feedback
	let copiedCommand = $state<string | null>(null);

	// Detect if the error is from OpenRouter
	const isOpenRouterError = $derived(checkIsOpenRouterError(errorMessage));

	// Detect if this is specifically a CORS error
	const isCorsError = $derived(
		errorMessage.toLowerCase().includes('cors') ||
			errorMessage.toLowerCase().includes('failed to fetch') ||
			errorMessage.toLowerCase().includes('networkerror')
	);

	// Get the current origin for the CORS command
	const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '*';

	// Parse the error message to extract helpful steps
	const helpSteps = $derived(() => {
		if (isOpenRouterError) {
			return []; // OpenRouter errors don't need command-line steps
		}
		if (errorMessage.includes('Could not connect') || isCorsError) {
			// If it's a CORS error, provide more specific instructions
			if (isCorsError) {
				return [
					{
						label: m.step_enable_cors(),
						command: `OLLAMA_ORIGINS="${currentOrigin}" ollama serve`,
						description: m.step_enable_cors_remote_desc()
					},
					{
						label: m.step_enable_cors_systemd(),
						command: `sudo systemctl edit ollama.service`,
						description: m.step_enable_cors_systemd_desc(),
						extraInfo: `[Service]\nEnvironment="OLLAMA_ORIGINS=${currentOrigin}"`
					},
					{
						label: m.step_pull_model(),
						command: 'ollama pull qwen3:8b',
						description: m.step_pull_model_desc()
					}
				];
			}
			// Regular connection error
			return [
				{
					label: m.step_start_ollama(),
					command: 'ollama serve',
					description: m.step_start_ollama_desc()
				},
				{
					label: m.step_enable_cors(),
					command: `OLLAMA_ORIGINS="${currentOrigin}" ollama serve`,
					description: m.step_enable_cors_desc()
				},
				{
					label: m.step_pull_model(),
					command: 'ollama pull qwen3:8b',
					description: m.step_pull_model_desc()
				}
			];
		}
		return [];
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		copiedCommand = text;
		setTimeout(() => {
			copiedCommand = null;
		}, 2000);
	}

	function handleOpenSettings() {
		open = false;
		onOpenSettings?.();
	}

	const docsUrl = $derived(isOpenRouterError ? OPENROUTER_DOCS_URL : OLLAMA_DOCS_URL);
	const docsLabel = $derived(isOpenRouterError ? m.open_openrouter_docs() : m.open_ollama_docs());
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<div class="flex items-center gap-3">
				<div class="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
					<TriangleAlert class="h-6 w-6 text-red-600 dark:text-red-500" />
				</div>
				<div>
					<Dialog.Title class="text-xl">{m.ai_error_title()}</Dialog.Title>
					<Dialog.Description>
						{m.ai_error_desc()}
					</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Error Message -->
			<div
				class="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10"
			>
				<p class="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
			</div>

			<!-- Steps to Fix (Ollama only) -->
			{#if helpSteps().length > 0}
				<div>
					<h4 class="mb-3 font-semibold text-foreground">{m.how_to_fix()}</h4>
					<ol class="space-y-3">
						{#each helpSteps() as step, index (step.label)}
							<li class="flex gap-3">
								<div
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
								>
									{index + 1}
								</div>
								<div class="flex-1">
									<div class="mb-1 font-medium text-foreground">{step.label}</div>
									<p class="mb-2 text-sm text-muted-foreground">{step.description}</p>
									{#if step.command}
										<div class="flex items-center gap-2">
											<code
												class="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground"
											>
												{step.command}
											</code>
											<Button
												variant={copiedCommand === step.command ? 'default' : 'outline'}
												size="sm"
												onclick={() => copyToClipboard(step.command)}
												class="transition-all"
											>
												{#if copiedCommand === step.command}
													<Check class="mr-1 h-3 w-3" />
													{m.copied()}
												{:else}
													{m.copy()}
												{/if}
											</Button>
										</div>
									{/if}
									{#if step.extraInfo}
										<div class="mt-2 rounded bg-muted/50 p-3">
											<pre
												class="font-mono text-xs whitespace-pre-wrap text-muted-foreground">{step.extraInfo}</pre>
										</div>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
				</div>
			{/if}
			<!-- Additional Resources -->
			<div class="rounded-md border bg-muted/50 p-4">
				<h4 class="mb-2 font-semibold text-foreground">{m.need_more_help()}</h4>
				<p class="mb-3 text-sm text-muted-foreground">
					{#if isOpenRouterError}
						{m.openrouter_docs_desc()}
					{:else}
						{m.ollama_docs_desc()}
					{/if}
				</p>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" onclick={() => window.open(docsUrl, '_blank')}>
						<ExternalLink class="mr-2 h-4 w-4" />
						{docsLabel}
					</Button>
					{#if onOpenSettings}
						<Button variant="outline" size="sm" onclick={handleOpenSettings}>
							<Settings class="mr-2 h-4 w-4" />
							{m.settings_title()}
						</Button>
					{/if}
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button onclick={() => (open = false)} variant="outline" class="w-full sm:w-auto">
				{m.close()}
			</Button>
			<Button onclick={() => window.location.reload()} class="w-full sm:w-auto">
				{m.retry_connection()}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
