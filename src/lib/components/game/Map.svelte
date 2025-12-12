<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import {
		getTerritoryCoordinates,
		getDefaultLocation,
		getNationColor,
		getRelationshipColor,
		getTradeRouteColor,
		getMilitaryAllianceColor
	} from '$lib/utils/territoryCoordinates';
	import { PLAYER_COLORS } from '$lib/utils/mapColors';

	interface Nation {
		_id: string;
		name: string;
		territories: string[];
		resources: { military: number; economy: number; stability: number; influence: number };
		isPlayerControlled: boolean;
	}

	interface Relationship {
		nation1Id: string;
		nation2Id: string;
		status: 'allied' | 'neutral' | 'hostile' | 'at_war';
		tradeAgreements: boolean;
		militaryAlliance: boolean;
	}

	interface Props {
		nations?: Nation[];
		relationships?: Relationship[];
		playerNationId?: string;
		showTerritories?: boolean;
		showTradeRoutes?: boolean;
		showAlliances?: boolean;
		showWarZones?: boolean;
	}

	let {
		nations = [],
		relationships = [],
		playerNationId = '',
		showTerritories = true,
		showTradeRoutes = true,
		showAlliances = true,
		showWarZones = true
	}: Props = $props();

	let mapContainer = $state<HTMLDivElement | null>(null);
	let map: maplibregl.Map;
	let error = $state<string | null>(null);
	let mapLoaded = $state(false);

	// Build a lookup from nationId to nation data
	const nationById = $derived(
		nations.reduce(
			(acc, n) => {
				acc[n._id] = n;
				return acc;
			},
			{} as Record<string, Nation>
		)
	);

	// Find nations at war
	const nationsAtWar = $derived(
		new Set(
			relationships.filter((r) => r.status === 'at_war').flatMap((r) => [r.nation1Id, r.nation2Id])
		)
	);

	// Generate GeoJSON for territory markers
	function buildTerritoryGeoJSON(): GeoJSON.FeatureCollection {
		const features: GeoJSON.Feature[] = [];

		for (const nation of nations) {
			const isPlayer = nation._id === playerNationId;
			const isAtWar = nationsAtWar.has(nation._id);

			for (const territory of nation.territories) {
				const coords = getTerritoryCoordinates(territory);
				if (!coords) continue;

				features.push({
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: coords.center
					},
					properties: {
						nationId: nation._id,
						nationName: nation.name,
						territoryName: territory,
						color: getNationColor(nation.name, isPlayer),
						isPlayer,
						isAtWar,
						military: nation.resources.military,
						economy: nation.resources.economy,
						stability: nation.resources.stability,
						influence: nation.resources.influence
					}
				});
			}
		}

		return { type: 'FeatureCollection', features };
	}

	// Generate GeoJSON for relationship lines
	function buildRelationshipLinesGeoJSON(
		type: 'trade' | 'alliance' | 'war'
	): GeoJSON.FeatureCollection {
		const features: GeoJSON.Feature[] = [];

		for (const rel of relationships) {
			const nation1 = nationById[rel.nation1Id];
			const nation2 = nationById[rel.nation2Id];
			if (!nation1 || !nation2) continue;

			// Get center coordinates for first territory of each nation
			const coords1 = nation1.territories[0]
				? getTerritoryCoordinates(nation1.territories[0])
				: null;
			const coords2 = nation2.territories[0]
				? getTerritoryCoordinates(nation2.territories[0])
				: null;
			if (!coords1 || !coords2) continue;

			let shouldInclude = false;
			let color = '';

			switch (type) {
				case 'trade':
					shouldInclude = rel.tradeAgreements;
					color = getTradeRouteColor();
					break;
				case 'alliance':
					shouldInclude = rel.militaryAlliance;
					color = getMilitaryAllianceColor();
					break;
				case 'war':
					shouldInclude = rel.status === 'at_war';
					color = getRelationshipColor('at_war');
					break;
			}

			if (shouldInclude) {
				features.push({
					type: 'Feature',
					geometry: {
						type: 'LineString',
						coordinates: [coords1.center, coords2.center]
					},
					properties: {
						nation1: nation1.name,
						nation2: nation2.name,
						type,
						color
					}
				});
			}
		}

		return { type: 'FeatureCollection', features };
	}

	// Update map layers when data changes
	function updateMapLayers() {
		if (!map || !mapLoaded) return;

		// Update territory source
		const territorySource = map.getSource('territories') as maplibregl.GeoJSONSource;
		if (territorySource) {
			territorySource.setData(buildTerritoryGeoJSON());
		}

		// Update relationship sources
		const tradeSource = map.getSource('trade-routes') as maplibregl.GeoJSONSource;
		if (tradeSource) {
			tradeSource.setData(buildRelationshipLinesGeoJSON('trade'));
		}

		const allianceSource = map.getSource('alliances') as maplibregl.GeoJSONSource;
		if (allianceSource) {
			allianceSource.setData(buildRelationshipLinesGeoJSON('alliance'));
		}

		const warSource = map.getSource('war-zones') as maplibregl.GeoJSONSource;
		if (warSource) {
			warSource.setData(buildRelationshipLinesGeoJSON('war'));
		}
	}

	// Update layer visibility
	function updateLayerVisibility() {
		if (!map || !mapLoaded) return;

		const setVisibility = (layerId: string, visible: boolean) => {
			if (map.getLayer(layerId)) {
				map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
			}
		};

		setVisibility('territory-markers', showTerritories);
		setVisibility('territory-markers-glow', showTerritories);
		setVisibility('territory-labels', showTerritories);
		setVisibility('trade-routes-layer', showTradeRoutes);
		setVisibility('alliances-layer', showAlliances);
		setVisibility('war-zones-layer', showWarZones);
	}

	// React to prop changes (including playerNationId for isPlayer styling)
	$effect(() => {
		if (nations && relationships && playerNationId !== undefined) {
			updateMapLayers();
		}
	});

	$effect(() => {
		updateLayerVisibility();
	});

	onMount(() => {
		try {
			const defaultLocation = getDefaultLocation();
			map = new maplibregl.Map({
				container: mapContainer!,
				style: 'https://demotiles.maplibre.org/style.json',
				center: defaultLocation.center,
				zoom: defaultLocation.zoom
			});

			map.on('load', () => {
				console.log('Map loaded successfully');
				mapLoaded = true;

				// Add sources
				map.addSource('territories', {
					type: 'geojson',
					data: buildTerritoryGeoJSON()
				});

				map.addSource('trade-routes', {
					type: 'geojson',
					data: buildRelationshipLinesGeoJSON('trade')
				});

				map.addSource('alliances', {
					type: 'geojson',
					data: buildRelationshipLinesGeoJSON('alliance')
				});

				map.addSource('war-zones', {
					type: 'geojson',
					data: buildRelationshipLinesGeoJSON('war')
				});

				// Add trade routes layer (dashed blue lines)
				map.addLayer({
					id: 'trade-routes-layer',
					type: 'line',
					source: 'trade-routes',
					paint: {
						'line-color': ['get', 'color'],
						'line-width': 2,
						'line-dasharray': [4, 2],
						'line-opacity': 0.7
					}
				});

				// Add alliance layer (solid purple lines)
				map.addLayer({
					id: 'alliances-layer',
					type: 'line',
					source: 'alliances',
					paint: {
						'line-color': ['get', 'color'],
						'line-width': 3,
						'line-opacity': 0.8
					}
				});

				// Add war zones layer (bold red lines)
				map.addLayer({
					id: 'war-zones-layer',
					type: 'line',
					source: 'war-zones',
					paint: {
						'line-color': ['get', 'color'],
						'line-width': 4,
						'line-opacity': 0.9
					}
				});

				// Add territory glow layer (for player nation)
				map.addLayer({
					id: 'territory-markers-glow',
					type: 'circle',
					source: 'territories',
					paint: {
						'circle-radius': ['case', ['get', 'isPlayer'], 25, 0],
						'circle-color': PLAYER_COLORS.glow,
						'circle-opacity': 0.3,
						'circle-blur': 1
					}
				});

				// Add territory markers layer
				map.addLayer({
					id: 'territory-markers',
					type: 'circle',
					source: 'territories',
					paint: {
						'circle-radius': ['interpolate', ['linear'], ['get', 'military'], 0, 8, 100, 20],
						'circle-color': ['get', 'color'],
						'circle-stroke-width': ['case', ['get', 'isPlayer'], 3, ['get', 'isAtWar'], 2, 1],
						'circle-stroke-color': [
							'case',
							['get', 'isPlayer'],
							'#16a34a',
							['get', 'isAtWar'],
							'#ef4444',
							'#ffffff'
						],
						'circle-opacity': 0.9
					}
				});

				// Add territory labels
				map.addLayer({
					id: 'territory-labels',
					type: 'symbol',
					source: 'territories',
					layout: {
						'text-field': ['get', 'nationName'],
						'text-size': 12,
						'text-offset': [0, 2],
						'text-anchor': 'top',
						'text-font': ['Open Sans Regular']
					},
					paint: {
						'text-color': '#ffffff',
						'text-halo-color': '#000000',
						'text-halo-width': 1.5
					}
				});

				// Add click handler for territory popups
				map.on('click', 'territory-markers', (e) => {
					if (!e.features || e.features.length === 0) return;

					const feature = e.features[0];
					const props = feature.properties;
					const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [
						number,
						number
					];

					// Build popup DOM safely to prevent XSS
					const popupContainer = document.createElement('div');
					popupContainer.className = 'p-2';

					const title = document.createElement('h3');
					title.className = 'font-bold text-sm';
					title.textContent = props?.nationName ?? '';
					popupContainer.appendChild(title);

					const subtitle = document.createElement('p');
					subtitle.className = 'text-xs text-gray-500';
					subtitle.textContent = props?.territoryName ?? '';
					popupContainer.appendChild(subtitle);

					const statsGrid = document.createElement('div');
					statsGrid.className = 'mt-2 text-xs grid grid-cols-2 gap-1';

					const stats = [
						{ icon: '⚔️ Military:', value: props?.military },
						{ icon: '💰 Economy:', value: props?.economy },
						{ icon: '⚖️ Stability:', value: props?.stability },
						{ icon: '🌐 Influence:', value: props?.influence }
					];

					stats.forEach(({ icon, value }) => {
						const labelSpan = document.createElement('span');
						labelSpan.textContent = icon;
						statsGrid.appendChild(labelSpan);

						const valueSpan = document.createElement('span');
						valueSpan.textContent = String(value ?? '');
						statsGrid.appendChild(valueSpan);
					});

					popupContainer.appendChild(statsGrid);

					new maplibregl.Popup().setLngLat(coordinates).setDOMContent(popupContainer).addTo(map);
				});

				// Change cursor on hover
				map.on('mouseenter', 'territory-markers', () => {
					map.getCanvas().style.cursor = 'pointer';
				});

				map.on('mouseleave', 'territory-markers', () => {
					map.getCanvas().style.cursor = '';
				});

				// Initial visibility setup
				updateLayerVisibility();
			});

			// Handle runtime errors
			map.on('error', (e) => {
				console.error('MapLibre error:', e);
				if (!map.loaded()) {
					const message = e.error?.message ?? e.message ?? 'Unknown error';
					error = `Map error: ${message}`;
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

	export function zoomIn() {
		map?.zoomIn();
	}

	export function zoomOut() {
		map?.zoomOut();
	}

	export function resetNorth() {
		map?.resetNorthPitch();
	}

	export function flyToTerritory(territoryName: string) {
		const coords = getTerritoryCoordinates(territoryName);
		if (coords) {
			map?.flyTo({
				center: coords.center,
				zoom: coords.zoom,
				duration: 1500
			});
		}
	}
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

	:global(.maplibregl-popup-content) {
		background: rgba(15, 23, 42, 0.95);
		color: white;
		border-radius: 8px;
		padding: 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	:global(.maplibregl-popup-tip) {
		border-top-color: rgba(15, 23, 42, 0.95);
	}

	:global(.maplibregl-popup-close-button) {
		color: white;
		font-size: 18px;
		padding: 4px 8px;
	}
</style>
