<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	let { open = $bindable(false) } = $props();

	let ollamaUrl = $state('http://localhost:11434');
	let modelName = $state('qwen3:8b');

	let errorMessage = $state('');
	let isChecking = $state(false);

	onMount(() => {
		const storedUrl = localStorage.getItem('OLLAMA_URL');
		const storedModel = localStorage.getItem('OLLAMA_MODEL');

		if (storedUrl) ollamaUrl = storedUrl;
		if (storedModel) modelName = storedModel;
	});

	async function saveSettings() {
		errorMessage = '';
		isChecking = true;

		try {
			// Remove trailing slash if present for the API call
			const cleanUrl = ollamaUrl.replace(/\/$/, '');
			const response = await fetch(`${cleanUrl}/api/tags`);

			if (!response.ok) {
				throw new Error(`Failed to connect: ${response.statusText}`);
			}

			const data = await response.json();
			const models = data.models || [];

			// Check if model exists (handle implicit :latest)
			const modelExists = models.some((m: { name: string }) => {
				const name = m.name;
				const input = modelName;

				// Exact match
				if (name === input) return true;

				// Handle implicit :latest for input without tag
				if (!input.includes(':') && name === `${input}:latest`) return true;

				return false;
			});

			if (!modelExists) {
				errorMessage = `Model '${modelName}' not found. Installed models: ${models.map((m: { name: string }) => m.name).join(', ')}`;
				return;
			}

			localStorage.setItem('OLLAMA_URL', ollamaUrl);
			localStorage.setItem('OLLAMA_MODEL', modelName);
			open = false;
		} catch (error) {
			console.error('Settings validation error:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to connect to Ollama';
			if (errorMessage.includes('Failed to fetch')) {
				errorMessage = 'Could not connect. Check URL and ensure OLLAMA_ORIGINS="*" is set.';
			}
		} finally {
			isChecking = false;
		}
	}

	function resetDefaults() {
		ollamaUrl = 'http://localhost:11434';
		modelName = 'qwen3:8b';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Settings</Dialog.Title>
			<Dialog.Description>
				Configure your local Ollama instance connection details.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			{#if errorMessage}
				<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
					{errorMessage}
				</div>
			{/if}
			<div class="grid grid-cols-4 items-center gap-4">
				<label for="ollama-url" class="text-right text-sm font-medium text-foreground">
					Ollama URL
				</label>
				<Input id="ollama-url" bind:value={ollamaUrl} class="col-span-3" disabled={isChecking} />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<label for="model-name" class="text-right text-sm font-medium text-foreground">
					Model Name
				</label>
				<Input id="model-name" bind:value={modelName} class="col-span-3" disabled={isChecking} />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={resetDefaults} disabled={isChecking}>Reset</Button>
			<Button onclick={saveSettings} disabled={isChecking}>
				{#if isChecking}
					Checking...
				{:else}
					Save changes
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
