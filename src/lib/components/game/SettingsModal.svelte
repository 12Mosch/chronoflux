<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import * as Select from '$lib/components/ui/select';
	import { setMode, resetMode, userPrefersMode } from 'mode-watcher';

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
				throw new Error(m.error_failed_to_connect({ statusText: response.statusText }));
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
				errorMessage = m.error_model_not_found({
					modelName,
					installedModels: models.map((m: { name: string }) => m.name).join(', ')
				});
				return;
			}

			localStorage.setItem('OLLAMA_URL', ollamaUrl);
			localStorage.setItem('OLLAMA_MODEL', modelName);
			open = false;
		} catch (error) {
			console.error('Settings validation error:', error);
			errorMessage = error instanceof Error ? error.message : m.error_failed_connect_ollama();
			if (errorMessage.includes('Failed to fetch')) {
				errorMessage = m.error_cors_issue();
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
			<Dialog.Title>{m.settings_title()}</Dialog.Title>
			<Dialog.Description>
				{m.settings_description()}
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
					{m.ollama_url_label()}
				</label>
				<Input id="ollama-url" bind:value={ollamaUrl} class="col-span-3" disabled={isChecking} />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<label for="model-name" class="text-right text-sm font-medium text-foreground">
					{m.model_name_label()}
				</label>
				<Input id="model-name" bind:value={modelName} class="col-span-3" disabled={isChecking} />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<label for="theme" class="text-right text-sm font-medium text-foreground">
					{m.settings_theme_label()}
				</label>
				<div class="col-span-3">
					<Select.Root
						type="single"
						value={userPrefersMode.current}
						onValueChange={(v) => {
							if (v) setMode(v as 'light' | 'dark' | 'system');
							else resetMode();
						}}
					>
						<Select.Trigger class="w-full">
							{#if userPrefersMode.current === 'light'}
								{m.theme_light()}
							{:else if userPrefersMode.current === 'dark'}
								{m.theme_dark()}
							{:else}
								{m.theme_system()}
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="light">{m.theme_light()}</Select.Item>
							<Select.Item value="dark">{m.theme_dark()}</Select.Item>
							<Select.Item value="system">{m.theme_system()}</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={resetDefaults} disabled={isChecking}
				>{m.reset_button()}</Button
			>
			<Button onclick={saveSettings} disabled={isChecking}>
				{#if isChecking}
					{m.checking_button()}
				{:else}
					{m.save_changes_button()}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
