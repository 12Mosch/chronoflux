<script lang="ts">
	import type { Snippet } from 'svelte';
	import { gameState } from '$lib/stores/gameState';
	import { Button } from '$lib/components/ui/button';
	import { Sword, Coins, Scale, Crown, Settings, Menu } from '@lucide/svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as m from '$lib/paraglide/messages';
	import SettingsModal from '$lib/components/game/SettingsModal.svelte';

	// Derive values from the store
	const turn = $derived($gameState.turn);
	const year = $derived($gameState.year);
	const military = $derived($gameState.military);
	const economy = $derived($gameState.economy);
	const stability = $derived($gameState.stability);
	const influence = $derived($gameState.influence);

	let { children }: { children: Snippet } = $props();
	let showSettings = $state(false);
</script>

<div class="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
	<!-- Top Bar -->
	<header class="z-50 flex h-14 items-center justify-between border-b bg-card px-4 py-2 shadow-sm">
		<!-- Left: Stats -->
		<Tooltip.Provider>
			<div class="flex flex-1 items-center gap-6">
				<Tooltip.Root>
					<Tooltip.Trigger class="flex items-center gap-2 text-sm font-medium">
						<Sword class="h-4 w-4 text-muted-foreground" />
						<span>{military}</span>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>{m.resource_military()}</p>
					</Tooltip.Content>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger class="flex items-center gap-2 text-sm font-medium">
						<Coins class="h-4 w-4 text-muted-foreground" />
						<span>{economy}</span>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>{m.resource_economy()}</p>
					</Tooltip.Content>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger class="flex items-center gap-2 text-sm font-medium">
						<Scale class="h-4 w-4 text-muted-foreground" />
						<span>{stability}%</span>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>{m.resource_stability()}</p>
					</Tooltip.Content>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger class="flex items-center gap-2 text-sm font-medium">
						<Crown class="h-4 w-4 text-muted-foreground" />
						<span>{influence}</span>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>{m.resource_influence()}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>

		<!-- Center: Turn Info -->
		<div class="flex flex-1 flex-col items-center justify-center">
			<span class="text-sm font-bold">{m.turn()}: {turn}</span>
			<span class="text-xs text-muted-foreground">{m.year_ad({ year })}</span>
		</div>

		<!-- Right: Actions -->
		<div class="flex flex-1 items-center justify-end gap-2">
			<Button variant="ghost" size="icon" onclick={() => (showSettings = true)}>
				<Settings class="h-5 w-5" />
			</Button>
			<Button variant="ghost" size="icon">
				<Menu class="h-5 w-5" />
			</Button>
		</div>
	</header>

	<!-- Main Content -->
	<main class="relative flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>

<SettingsModal bind:open={showSettings} />
