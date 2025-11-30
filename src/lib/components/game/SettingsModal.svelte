<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import * as Select from '$lib/components/ui/select';
	import { setMode, resetMode, userPrefersMode } from 'mode-watcher';
	import { ExternalLink, Eye, EyeOff } from '@lucide/svelte';
	import {
		loadSettings,
		saveSettings as saveSettingsToStorage,
		defaultSettings,
		popularOpenRouterModels,
		type AIProvider
	} from '$lib/stores/settings';
	import { testOpenRouterConnection } from '$lib/utils/openrouter';
	import { checkOllamaModelExists } from '$lib/utils/ollama';

	let { open = $bindable(false) } = $props();

	// Provider settings
	let provider = $state<AIProvider>('ollama');
	// Ollama settings
	let ollamaUrl = $state('http://localhost:11434');
	let ollamaModel = $state('qwen3:8b');
	// OpenRouter settings
	let openrouterApiKey = $state('');
	let openrouterModel = $state('x-ai/grok-4.1-fast:free');
	let showApiKey = $state(false);

	let errorMessage = $state('');
	let isChecking = $state(false);

	onMount(() => {
		const settings = loadSettings();
		provider = settings.provider;
		ollamaUrl = settings.ollamaUrl;
		ollamaModel = settings.ollamaModel;
		openrouterApiKey = settings.openrouterApiKey;
		openrouterModel = settings.openrouterModel;
	});

	async function saveSettings() {
		errorMessage = '';
		isChecking = true;

		try {
			if (provider === 'openrouter') {
				// Validate OpenRouter settings
				if (!openrouterApiKey) {
					errorMessage = m.error_openrouter_no_key();
					return;
				}
				const isValid = await testOpenRouterConnection(openrouterApiKey);
				if (!isValid) {
					errorMessage = m.error_openrouter_invalid_key();
					return;
				}
			} else {
				// Validate Ollama settings
				const cleanUrl = ollamaUrl.replace(/\/$/, '');
				const response = await fetch(`${cleanUrl}/api/tags`);

				if (!response.ok) {
					throw new Error(m.error_failed_to_connect({ statusText: response.statusText }));
				}

				const data = await response.json();
				const models = data.models || [];

				const modelExists = checkOllamaModelExists(models, ollamaModel);

				if (!modelExists) {
					errorMessage = m.error_model_not_found({
						modelName: ollamaModel,
						installedModels: models.map((model: { name: string }) => model.name).join(', ')
					});
					return;
				}
			}

			// Save all settings
			saveSettingsToStorage({
				provider,
				ollamaUrl,
				ollamaModel,
				openrouterApiKey,
				openrouterModel
			});
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
		errorMessage = '';
		provider = defaultSettings.provider;
		ollamaUrl = defaultSettings.ollamaUrl;
		ollamaModel = defaultSettings.ollamaModel;
		openrouterApiKey = defaultSettings.openrouterApiKey;
		openrouterModel = defaultSettings.openrouterModel;
		resetMode();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>{m.settings_title()}</Dialog.Title>
			<Dialog.Description>
				{m.settings_description_provider()}
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			{#if errorMessage}
				<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
					{errorMessage}
				</div>
			{/if}

			<!-- Provider Selection -->
			<div class="grid grid-cols-4 items-start gap-4">
				<label for="provider" class="pt-2 text-right text-sm font-medium text-foreground">
					{m.provider_label()}
				</label>
				<div class="col-span-3">
					<Select.Root
						type="single"
						value={provider}
						onValueChange={(v) => {
							if (v) provider = v as AIProvider;
						}}
					>
						<Select.Trigger class="w-full" disabled={isChecking}>
							{#if provider === 'ollama'}
								{m.provider_ollama()}
							{:else}
								{m.provider_openrouter()}
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="ollama">{m.provider_ollama()}</Select.Item>
							<Select.Item value="openrouter">{m.provider_openrouter()}</Select.Item>
						</Select.Content>
					</Select.Root>
					{#if provider === 'openrouter'}
						<p class="mt-1.5 text-xs text-muted-foreground">
							{m.openrouter_info()}
						</p>
					{/if}
				</div>
			</div>

			{#if provider === 'ollama'}
				<!-- Ollama Settings -->
				<div class="grid grid-cols-4 items-center gap-4">
					<label for="ollama-url" class="text-right text-sm font-medium text-foreground">
						{m.ollama_url_label()}
					</label>
					<Input id="ollama-url" bind:value={ollamaUrl} class="col-span-3" disabled={isChecking} />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<label for="ollama-model" class="text-right text-sm font-medium text-foreground">
						{m.model_name_label()}
					</label>
					<Input
						id="ollama-model"
						bind:value={ollamaModel}
						class="col-span-3"
						disabled={isChecking}
					/>
				</div>
			{:else}
				<!-- OpenRouter Settings -->
				<div class="grid grid-cols-4 items-start gap-4">
					<label for="openrouter-key" class="pt-2 text-right text-sm font-medium text-foreground">
						{m.openrouter_api_key_label()}
					</label>
					<div class="col-span-3">
						<div class="flex gap-2">
							<Input
								id="openrouter-key"
								type={showApiKey ? 'text' : 'password'}
								bind:value={openrouterApiKey}
								placeholder={m.openrouter_api_key_placeholder()}
								class="flex-1"
								disabled={isChecking}
							/>
							<Button
								variant="ghost"
								size="icon"
								onclick={() => (showApiKey = !showApiKey)}
								type="button"
								title={showApiKey ? m.hide_api_key() : m.show_api_key()}
							>
								{#if showApiKey}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</Button>
						</div>
						<div class="mt-1 text-right">
							<Button
								variant="link"
								size="sm"
								class="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
								onclick={() => window.open('https://openrouter.ai/keys', '_blank')}
							>
								{m.openrouter_get_api_key()}
								<ExternalLink class="ml-1 h-3 w-3" />
							</Button>
						</div>
					</div>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<label for="openrouter-model" class="text-right text-sm font-medium text-foreground">
						{m.openrouter_model_label()}
					</label>
					<div class="col-span-3">
						<Select.Root
							type="single"
							value={openrouterModel}
							onValueChange={(v) => {
								if (v) openrouterModel = v;
							}}
						>
							<Select.Trigger class="w-full" disabled={isChecking}>
								{popularOpenRouterModels.find((m) => m.id === openrouterModel)?.name ||
									openrouterModel}
							</Select.Trigger>
							<Select.Content>
								{#each popularOpenRouterModels as model (model.id)}
									<Select.Item value={model.id}>
										<span>{model.name}</span>
										<span class="ml-2 text-xs text-muted-foreground">{model.description}</span>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			{/if}

			<!-- Theme Selection -->
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
			<Button variant="outline" onclick={resetDefaults} disabled={isChecking}>
				{m.reset_button()}
			</Button>
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
