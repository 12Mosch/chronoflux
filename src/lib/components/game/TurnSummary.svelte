<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowRight, TrendingUp, TrendingDown, Minus } from '@lucide/svelte';

	type TurnData = {
		turnNumber: number;
		playerAction: string;
		narrative?: string;
		consequences?: string;
		events?: Array<{
			type: string;
			title: string;
			description: string;
		}>;
		resourceChanges?: Record<string, number>;
	} | null;

	let { open = $bindable(false), turnData = null }: { open: boolean; turnData: TurnData } =
		$props();

	function getChangeIcon(value: number) {
		if (value > 0) return TrendingUp;
		if (value < 0) return TrendingDown;
		return Minus;
	}

	function getChangeColor(value: number) {
		if (value > 0) return 'text-green-500';
		if (value < 0) return 'text-red-500';
		return 'text-muted-foreground';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90vh] max-w-3xl flex-col">
		<Dialog.Header>
			<Dialog.Title class="text-2xl">Turn Complete</Dialog.Title>
			<Dialog.Description>
				Review the consequences of your actions for Turn {turnData?.turnNumber || '...'}
			</Dialog.Description>
		</Dialog.Header>

		{#if !turnData}
			<div class="py-8 text-center text-muted-foreground">Loading turn data...</div>
		{:else}
			<Tabs value="narrative" class="flex flex-1 flex-col overflow-hidden">
				<TabsList class="grid w-full grid-cols-3">
					<TabsTrigger value="narrative">Narrative</TabsTrigger>
					<TabsTrigger value="events">Events ({turnData.events?.length || 0})</TabsTrigger>
					<TabsTrigger value="changes">Changes</TabsTrigger>
				</TabsList>

				<div class="mt-4 flex-1 overflow-hidden">
					<ScrollArea class="h-[400px] pr-4">
						<!-- Narrative Tab -->
						<TabsContent value="narrative" class="mt-0 space-y-4">
							<div class="rounded-md bg-secondary/20 p-4">
								<h4
									class="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase"
								>
									Your Action
								</h4>
								<p class="text-foreground/80 italic">"{turnData.playerAction}"</p>
							</div>

							<Separator />

							<div>
								<h4
									class="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase"
								>
									Outcome
								</h4>
								<div class="prose prose-sm max-w-none dark:prose-invert">
									<p class="leading-relaxed">{turnData.narrative}</p>
								</div>
							</div>

							{#if turnData.consequences}
								<div class="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-4">
									<h4 class="mb-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
										Immediate Consequences
									</h4>
									<p class="text-sm">{turnData.consequences}</p>
								</div>
							{/if}
						</TabsContent>

						<!-- Events Tab -->
						<TabsContent value="events" class="mt-0 space-y-3">
							{#if !turnData.events || turnData.events.length === 0}
								<div class="py-8 text-center text-muted-foreground">
									No significant events occurred this turn.
								</div>
							{:else}
								{#each turnData.events as event (event.title)}
									<div class="rounded-lg border bg-card p-4 shadow-sm">
										<div class="mb-2 flex items-center gap-2">
											<Badge variant="outline" class="capitalize">{event.type}</Badge>
											<span class="font-bold">{event.title}</span>
										</div>
										<p class="text-sm text-muted-foreground">{event.description}</p>
									</div>
								{/each}
							{/if}
						</TabsContent>

						<!-- Changes Tab -->
						<TabsContent value="changes" class="mt-0 space-y-6">
							<!-- Resource Changes -->
							{#if turnData.resourceChanges}
								<div>
									<h4
										class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase"
									>
										Resource Updates
									</h4>
									<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
										{#each Object.entries(turnData.resourceChanges) as [resource, change] (resource)}
											{@const Icon = getChangeIcon(change as number)}
											<div class="rounded-lg border bg-card p-3 text-center">
												<div class="mb-1 text-xs font-medium text-muted-foreground uppercase">
													{resource}
												</div>
												<div
													class={`flex items-center justify-center gap-1 text-lg font-bold ${getChangeColor(change as number)}`}
												>
													<Icon class="h-4 w-4" />
													<span>{(change as number) > 0 ? '+' : ''}{change}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<Separator />

							<!-- Relationship Changes could go here if available in turnData -->
							<div class="text-center text-sm text-muted-foreground">
								Check the World Map for updated relationships.
							</div>
						</TabsContent>
					</ScrollArea>
				</div>
			</Tabs>
		{/if}

		<Dialog.Footer class="mt-6">
			<Button onclick={() => (open = false)} class="w-full sm:w-auto">
				Continue to Turn {(turnData?.turnNumber || 0) + 1}
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
