<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;

	onMount(() => {
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
			// Temporarily disabled to debug rendering issues
			// updateTimeFilter();
		});

		// Cleanup on destroy
		return () => {
			map.remove();
		};
	});
</script>

<div class="h-full w-full" bind:this={mapContainer}></div>

<style>
	:global(.maplibregl-map) {
		height: 100%;
		width: 100%;
	}
</style>
