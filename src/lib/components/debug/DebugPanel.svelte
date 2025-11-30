<script lang="ts">
	import { aiLogs, clearLogs } from '$lib/stores/debug';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { Trash2, ChevronDown, ChevronRight, Activity } from '@lucide/svelte';

	let expandedLog = $state<string | null>(null);
	let isExpanded = $state(false);

	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString();
	}

	function formatDuration(duration: number): string {
		if (duration < 1000) {
			return `${duration}ms`;
		}
		return `${(duration / 1000).toFixed(2)}s`;
	}

	function toggleLog(logId: string) {
		expandedLog = expandedLog === logId ? null : logId;
	}

	function truncate(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

{#if $aiLogs.length > 0}
	<div class="fixed right-4 bottom-4 z-50 w-96">
		<Card.Root class="border-2 border-primary/20 bg-background/95 shadow-lg backdrop-blur-sm">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-3">
				<button
					onclick={() => (isExpanded = !isExpanded)}
					class="flex items-center gap-2 text-sm font-medium"
				>
					<Activity class="h-4 w-4 text-primary" />
					<span>AI Debug Log ({$aiLogs.length})</span>
					{#if isExpanded}
						<ChevronDown class="h-4 w-4" />
					{:else}
						<ChevronRight class="h-4 w-4" />
					{/if}
				</button>
				<Button variant="ghost" size="icon" class="h-8 w-8" onclick={clearLogs}>
					<Trash2 class="h-4 w-4" />
				</Button>
			</Card.Header>

			{#if isExpanded}
				<Card.Content class="pt-0">
					<ScrollArea.Root class="h-[500px]">
						<div class="space-y-2 pr-4">
							{#each $aiLogs as log (log.id)}
								<div
									class="rounded-md border border-border bg-card p-2 text-xs transition-colors hover:bg-accent"
								>
									<button
										onclick={() => toggleLog(log.id)}
										class="flex w-full items-start justify-between gap-2 text-left"
									>
										<div class="flex-1 space-y-1">
											<div class="flex items-center gap-2">
												<span class="font-mono text-muted-foreground">
													{formatTimestamp(log.timestamp)}
												</span>
												<span
													class="rounded px-1.5 py-0.5 text-[10px] font-medium {log.provider ===
													'ollama'
														? 'bg-blue-500/20 text-blue-500'
														: 'bg-purple-500/20 text-purple-500'}"
												>
													{log.provider}
												</span>
												<span
													class="rounded px-1.5 py-0.5 text-[10px] font-medium {log.error
														? 'bg-red-500/20 text-red-500'
														: 'bg-green-500/20 text-green-500'}"
												>
													{formatDuration(log.duration)}
												</span>
											</div>
											{#if log.error}
												<div class="text-red-500">
													Error: {truncate(log.error, 80)}
												</div>
											{:else}
												<div class="text-muted-foreground">
													{truncate(log.prompt, 80)}
												</div>
											{/if}
										</div>
										{#if expandedLog === log.id}
											<ChevronDown class="h-4 w-4 shrink-0" />
										{:else}
											<ChevronRight class="h-4 w-4 shrink-0" />
										{/if}
									</button>

									{#if expandedLog === log.id}
										<div class="mt-2 space-y-2 border-t border-border pt-2">
											<div>
												<div class="mb-1 font-medium text-foreground">Prompt:</div>
												<div
													class="max-h-40 overflow-y-auto rounded bg-muted p-2 font-mono text-[10px] leading-relaxed text-muted-foreground"
												>
													{log.prompt}
												</div>
											</div>
											{#if log.error}
												<div>
													<div class="mb-1 font-medium text-red-500">Error:</div>
													<div
														class="max-h-40 overflow-y-auto rounded bg-red-500/10 p-2 font-mono text-[10px] leading-relaxed text-red-500"
													>
														{log.error}
													</div>
												</div>
											{:else if log.response}
												<div>
													<div class="mb-1 font-medium text-foreground">Response:</div>
													<div
														class="max-h-40 overflow-y-auto rounded bg-muted p-2 font-mono text-[10px] leading-relaxed text-muted-foreground"
													>
														{log.response}
													</div>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</ScrollArea.Root>
				</Card.Content>
			{/if}
		</Card.Root>
	</div>
{/if}
