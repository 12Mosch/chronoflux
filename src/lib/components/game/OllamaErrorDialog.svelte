<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { TriangleAlert, ExternalLink, Check } from '@lucide/svelte';

	let { open = $bindable(false), errorMessage = '' }: { open: boolean; errorMessage: string } =
		$props();

	const OLLAMA_DOCS_URL = 'https://docs.ollama.com/';

	// Track which command was just copied for visual feedback
	let copiedCommand = $state<string | null>(null);

	// Parse the error message to extract helpful steps
	const helpSteps = $derived(() => {
		if (errorMessage.includes('Could not connect to Ollama')) {
			return [
				{ label: 'Start Ollama', command: 'ollama serve', description: 'Ensure Ollama is running' },
				{
					label: 'Enable CORS',
					command: 'OLLAMA_ORIGINS="*"',
					description: 'Allow browser connections'
				},
				{
					label: 'Pull the model',
					command: 'ollama pull qwen3:8b',
					description: 'Download the required AI model'
				}
			];
		}
		return [];
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		// Show feedback
		copiedCommand = text;
		// Reset after 2 seconds
		setTimeout(() => {
			copiedCommand = null;
		}, 2000);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<div class="flex items-center gap-3">
				<div class="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
					<TriangleAlert class="h-6 w-6 text-red-600 dark:text-red-500" />
				</div>
				<div>
					<Dialog.Title class="text-xl">Unable to Connect to Ollama</Dialog.Title>
					<Dialog.Description>
						ChronoFlux needs a local Ollama instance to process AI turns
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

			<!-- Steps to Fix -->
			{#if helpSteps().length > 0}
				<div>
					<h4 class="mb-3 font-semibold text-foreground">How to Fix:</h4>
					<ol class="space-y-3">
						{#each helpSteps() as step, index (step.label)}
							<li class="flex gap-3">
								<div
									class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
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
													Copied!
												{:else}
													Copy
												{/if}
											</Button>
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
				<h4 class="mb-2 font-semibold text-foreground">Need More Help?</h4>
				<p class="mb-3 text-sm text-muted-foreground">
					Check the official Ollama documentation for detailed setup instructions and
					troubleshooting.
				</p>
				<Button variant="outline" size="sm" onclick={() => window.open(OLLAMA_DOCS_URL, '_blank')}>
					<ExternalLink class="mr-2 h-4 w-4" />
					Open Ollama Documentation
				</Button>
			</div>
		</div>

		<Dialog.Footer>
			<Button onclick={() => (open = false)} variant="outline" class="w-full sm:w-auto">
				Close
			</Button>
			<Button onclick={() => window.location.reload()} class="w-full sm:w-auto">
				Retry Connection
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
