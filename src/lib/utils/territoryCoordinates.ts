/**
 * Territory coordinates mapping for map visualization.
 * Maps territory names to geographic center points.
 */

import {
	PLAYER_COLORS,
	RELATIONSHIP_COLORS,
	TRADE_COLORS,
	ALLIANCE_COLORS,
	type RelationshipStatus
} from './mapColors';

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface TerritoryLocation {
	center: [number, number]; // [longitude, latitude]
	zoom: number;
}

/**
 * Predefined coordinates for common historical territories.
 * Coordinates are approximate center points.
 */
const TERRITORY_COORDINATES: Record<string, TerritoryLocation> = {
	// European Powers
	Germany: { center: [10.4515, 51.1657], zoom: 5 },
	France: { center: [2.2137, 46.2276], zoom: 5 },
	'United Kingdom': { center: [-3.436, 55.3781], zoom: 5 },
	UK: { center: [-3.436, 55.3781], zoom: 5 },
	Britain: { center: [-3.436, 55.3781], zoom: 5 },
	Russia: { center: [105.3188, 61.524], zoom: 3 },
	USSR: { center: [105.3188, 61.524], zoom: 3 },
	'Soviet Union': { center: [105.3188, 61.524], zoom: 3 },
	Italy: { center: [12.5674, 41.8719], zoom: 5 },
	Spain: { center: [-3.7492, 40.4637], zoom: 5 },
	Portugal: { center: [-8.2245, 39.3999], zoom: 6 },
	Austria: { center: [14.5501, 47.5162], zoom: 6 },
	'Austria-Hungary': { center: [16.3738, 48.2082], zoom: 5 },
	Hungary: { center: [19.5033, 47.1625], zoom: 6 },
	Poland: { center: [19.1451, 51.9194], zoom: 5 },
	Netherlands: { center: [5.2913, 52.1326], zoom: 7 },
	Belgium: { center: [4.4699, 50.5039], zoom: 7 },
	Switzerland: { center: [8.2275, 46.8182], zoom: 7 },
	Sweden: { center: [18.6435, 60.1282], zoom: 4 },
	Norway: { center: [8.4689, 60.472], zoom: 4 },
	Denmark: { center: [9.5018, 56.2639], zoom: 6 },
	Finland: { center: [25.7482, 61.9241], zoom: 4 },
	Greece: { center: [21.8243, 39.0742], zoom: 6 },
	Turkey: { center: [35.2433, 38.9637], zoom: 5 },
	'Ottoman Empire': { center: [32.8597, 39.9334], zoom: 4 },
	Serbia: { center: [21.0059, 44.0165], zoom: 6 },
	Romania: { center: [24.9668, 45.9432], zoom: 5 },
	Bulgaria: { center: [25.4858, 42.7339], zoom: 6 },

	// Americas
	USA: { center: [-95.7129, 37.0902], zoom: 3 },
	'United States': { center: [-95.7129, 37.0902], zoom: 3 },
	America: { center: [-95.7129, 37.0902], zoom: 3 },
	Canada: { center: [-106.3468, 56.1304], zoom: 3 },
	Mexico: { center: [-102.5528, 23.6345], zoom: 4 },
	Brazil: { center: [-51.9253, -14.235], zoom: 3 },
	Argentina: { center: [-63.6167, -38.4161], zoom: 4 },

	// Asia
	China: { center: [104.1954, 35.8617], zoom: 3 },
	Japan: { center: [138.2529, 36.2048], zoom: 5 },
	India: { center: [78.9629, 20.5937], zoom: 4 },
	Persia: { center: [53.688, 32.4279], zoom: 5 },
	Iran: { center: [53.688, 32.4279], zoom: 5 },
	Korea: { center: [127.7669, 35.9078], zoom: 6 },

	// Middle East & Africa
	Egypt: { center: [30.8025, 26.8206], zoom: 5 },
	'North Africa': { center: [9.5375, 28.0339], zoom: 4 },
	Palestine: { center: [35.2332, 31.9522], zoom: 7 },
	Arabia: { center: [45.0792, 23.8859], zoom: 4 },
	'Saudi Arabia': { center: [45.0792, 23.8859], zoom: 4 },
	Iraq: { center: [43.6793, 33.2232], zoom: 5 },
	Syria: { center: [38.9968, 34.8021], zoom: 6 },
	'South Africa': { center: [22.9375, -30.5595], zoom: 4 },

	// Ancient territories
	Rome: { center: [12.4964, 41.9028], zoom: 5 },
	Gaul: { center: [2.2137, 46.2276], zoom: 5 },
	Hispania: { center: [-3.7492, 40.4637], zoom: 5 },
	Britannia: { center: [-1.1743, 52.3555], zoom: 6 },
	Carthage: { center: [10.1815, 36.8065], zoom: 6 },
	Macedonia: { center: [21.7453, 41.5122], zoom: 6 },
	Athens: { center: [23.7275, 37.9838], zoom: 7 },
	Sparta: { center: [22.4297, 37.0755], zoom: 7 },
	Persia_Ancient: { center: [52.5311, 29.5918], zoom: 4 }
};

/**
 * Get coordinates for a territory name.
 * Returns undefined if territory is not found.
 */
export function getTerritoryCoordinates(name: string): TerritoryLocation | undefined {
	// Try exact match first
	if (TERRITORY_COORDINATES[name]) {
		return TERRITORY_COORDINATES[name];
	}

	// Try case-insensitive match
	const lowerName = name.toLowerCase();
	for (const [key, value] of Object.entries(TERRITORY_COORDINATES)) {
		if (key.toLowerCase() === lowerName) {
			return value;
		}
	}

	// Try partial match (for composite names like "Northern Germany")
	// Only match if the input contains a known territory as a whole word,
	// or if the input is a known territory abbreviation/alias.
	// Avoid reverse substring matching to prevent false positives (e.g., "US" matching "Russia").
	for (const [key, value] of Object.entries(TERRITORY_COORDINATES)) {
		const keyLower = key.toLowerCase();
		// Check if input contains the territory name as a word boundary match
		const wordBoundaryRegex = new RegExp(`\\b${escapeRegExp(keyLower)}\\b`, 'i');
		if (wordBoundaryRegex.test(lowerName)) {
			return value;
		}
	}

	return undefined;
}

/**
 * Get a default location for unknown territories.
 * Returns a point in the Atlantic Ocean.
 */
export function getDefaultLocation(): TerritoryLocation {
	return { center: [0, 20], zoom: 2 };
}

/**
 * Generate a unique color for a nation based on its name.
 * Uses a hash function to generate consistent colors.
 * Nation names are normalized to lowercase for case-insensitive color stability.
 */
export function getNationColor(nationName: string, isPlayer: boolean = false): string {
	if (isPlayer) {
		return PLAYER_COLORS.primary;
	}

	// Normalize to lowercase for case-insensitive color stability
	const normalized = nationName.toLowerCase();

	// Simple hash function for consistent colors
	let hash = 0;
	for (let i = 0; i < normalized.length; i++) {
		hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
	}

	// Generate HSL color with good saturation and lightness
	const hue = Math.abs(hash % 360);
	return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Get relationship line color based on status.
 */
export function getRelationshipColor(status: RelationshipStatus): string {
	return RELATIONSHIP_COLORS[status] ?? RELATIONSHIP_COLORS.neutral;
}

/**
 * Get trade route color.
 */
export function getTradeRouteColor(): string {
	return TRADE_COLORS.route;
}

/**
 * Get military alliance color.
 */
export function getMilitaryAllianceColor(): string {
	return ALLIANCE_COLORS.military;
}
