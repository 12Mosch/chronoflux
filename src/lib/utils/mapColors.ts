/**
 * Centralized color constants for map visualizations.
 * Single source of truth for relationship, trade route, alliance, and nation colors.
 *
 * These colors are derived from Tailwind's default palette for consistency:
 * - Green (22c55e) = green-500
 * - Orange (f97316) = orange-500
 * - Red (ef4444) = red-500
 * - Gray (6b7280) = gray-500
 * - Blue (3b82f6) = blue-500
 * - Purple (a855f7) = purple-500
 */

/**
 * Player-related colors
 */
export const PLAYER_COLORS = {
	/** Primary player marker color */
	primary: '#22c55e', // Tailwind green-500
	/** Player territory glow effect */
	glow: '#22c55e'
} as const;

/**
 * Relationship status colors for diplomatic relations between nations
 */
export const RELATIONSHIP_COLORS = {
	/** Allied nations - positive diplomatic relations */
	allied: '#22c55e', // Tailwind green-500
	/** Hostile nations - negative diplomatic relations */
	hostile: '#f97316', // Tailwind orange-500
	/** Nations at war - active military conflict */
	at_war: '#ef4444', // Tailwind red-500
	/** Neutral nations - no significant relations */
	neutral: '#6b7280' // Tailwind gray-500
} as const;

/**
 * Trade and economic visualization colors
 */
export const TRADE_COLORS = {
	/** Trade route lines */
	route: '#3b82f6' // Tailwind blue-500
} as const;

/**
 * Military and alliance visualization colors
 */
export const ALLIANCE_COLORS = {
	/** Military alliance connections */
	military: '#a855f7' // Tailwind purple-500
} as const;

export type RelationshipStatus = keyof typeof RELATIONSHIP_COLORS;
