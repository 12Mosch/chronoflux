<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Switch } from '$lib/components/ui/switch';

	interface Props {
		showTerritories: boolean;
		showTradeRoutes: boolean;
		showAlliances: boolean;
		showWarZones: boolean;
		onToggleTerritories?: (value: boolean) => void;
		onToggleTradeRoutes?: (value: boolean) => void;
		onToggleAlliances?: (value: boolean) => void;
		onToggleWarZones?: (value: boolean) => void;
	}

	let {
		showTerritories = $bindable(true),
		showTradeRoutes = $bindable(true),
		showAlliances = $bindable(true),
		showWarZones = $bindable(true),
		onToggleTerritories,
		onToggleTradeRoutes,
		onToggleAlliances,
		onToggleWarZones
	}: Props = $props();
</script>

<div class="rounded-lg border border-border/50 bg-background/90 p-3 shadow-lg backdrop-blur-sm">
	<h4 class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
		{m.map_legend_title()}
	</h4>

	<div class="space-y-3">
		<!-- Territories -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full bg-emerald-500 shadow-sm"></div>
				<label for="territories-toggle" class="cursor-pointer text-xs">
					{m.map_layer_territories()}
				</label>
			</div>
			<Switch
				id="territories-toggle"
				checked={showTerritories}
				onCheckedChange={(checked) => {
					showTerritories = checked;
					onToggleTerritories?.(checked);
				}}
				class="scale-75"
			/>
		</div>

		<!-- Trade Routes -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<div class="h-0.5 w-3 bg-blue-500" style="border-style: dashed;"></div>
				<label for="trade-toggle" class="cursor-pointer text-xs">
					{m.map_layer_trade_routes()}
				</label>
			</div>
			<Switch
				id="trade-toggle"
				checked={showTradeRoutes}
				onCheckedChange={(checked) => {
					showTradeRoutes = checked;
					onToggleTradeRoutes?.(checked);
				}}
				class="scale-75"
			/>
		</div>

		<!-- Military Alliances -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<div class="h-0.5 w-3 bg-purple-500"></div>
				<label for="alliances-toggle" class="cursor-pointer text-xs">
					{m.map_layer_alliances()}
				</label>
			</div>
			<Switch
				id="alliances-toggle"
				checked={showAlliances}
				onCheckedChange={(checked) => {
					showAlliances = checked;
					onToggleAlliances?.(checked);
				}}
				class="scale-75"
			/>
		</div>

		<!-- War Zones -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<div class="h-0.5 w-3 bg-red-500"></div>
				<label for="wars-toggle" class="cursor-pointer text-xs">
					{m.map_layer_wars()}
				</label>
			</div>
			<Switch
				id="wars-toggle"
				checked={showWarZones}
				onCheckedChange={(checked) => {
					showWarZones = checked;
					onToggleWarZones?.(checked);
				}}
				class="scale-75"
			/>
		</div>
	</div>

	<!-- Status Legend -->
	<div class="mt-4 border-t border-border/50 pt-3">
		<div class="grid grid-cols-2 gap-2 text-xs">
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-400/50"></div>
				<span class="text-muted-foreground">{m.map_status_player()}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full bg-red-500 ring-2 ring-red-400/50"></div>
				<span class="text-muted-foreground">{m.map_status_at_war()}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full bg-green-500"></div>
				<span class="text-muted-foreground">{m.map_status_allied()}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full bg-gray-500"></div>
				<span class="text-muted-foreground">{m.map_status_neutral()}</span>
			</div>
		</div>
	</div>
</div>
