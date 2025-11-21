<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import * as Card from '$lib/components/ui/card';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { Flag } from '@lucide/svelte';

	// Subscribe to the store
	$: ({ nationName, nationFlag, turn, year } = $gameState);
</script>

<div class="min-h-screen bg-background p-4">
	<Card.Root class="mb-4">
		<Card.Content class="flex items-center justify-between p-4">
			<div class="flex items-center gap-4">
				<Avatar.Root>
					<Avatar.Image src={nationFlag} alt={nationName} />
					<Avatar.Fallback>
						<Flag class="h-4 w-4" />
					</Avatar.Fallback>
				</Avatar.Root>
				<div class="text-lg font-bold">{nationName}</div>
			</div>

			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">Turn</span>
					<Badge variant="secondary">{turn}</Badge>
				</div>
				<Separator orientation="vertical" class="h-6" />
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">Year</span>
					<Badge variant="outline">{year}</Badge>
				</div>
				<Separator orientation="vertical" class="h-6" />
				<ThemeToggle />
			</div>
		</Card.Content>
	</Card.Root>

	<slot />
</div>
