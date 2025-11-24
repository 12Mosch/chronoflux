<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;
	let error: string | null = null;

	onMount(() => {
		try {
			map = new maplibregl.Map({
				container: mapContainer,
				// Using reliable demo tiles instead of OHM (which has server issues)
				style: 'https://demotiles.maplibre.org/style.json',
				center: [0, 20],
				zoom: 2
			});

			map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

			map.on('load', () => {
				console.log('Map loaded successfully');
			});

			// Handle runtime errors
			map.on('error', (e) => {
				console.error('MapLibre error:', e);
				// Only set error if it's critical or if the map hasn't loaded yet
				if (!map.loaded()) {
					error = `Map error: ${e.error.message}`;
				}
			});
		} catch (e) {
			console.error('Failed to initialize map:', e);
			error = e instanceof Error ? e.message : 'Failed to initialize map';
		}

		// Cleanup on destroy
		return () => {
			if (map) map.remove();
		};
	});
</script>

{#if error}
	<div class="flex h-full w-full items-center justify-center bg-muted p-4 text-destructive">
		<div class="text-center">
			<p class="mb-2 font-bold">Error loading map</p>
			<p class="text-sm">{error}</p>
		</div>
	</div>
{:else}
	<div class="h-full w-full" bind:this={mapContainer}></div>
{/if}

<style>
	:global(.maplibregl-map) {
		height: 100%;
		width: 100%;
	}
</style>
