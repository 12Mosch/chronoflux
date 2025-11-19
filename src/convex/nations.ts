import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get a specific nation by ID (internal)
 */
export const getNationById = internalQuery({
	args: { nationId: v.id('nations') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.nationId);
	}
});

/**
 * Get all nations for a game (internal)
 */
export const getNationsForGame = internalQuery({
	args: { gameId: v.id('games') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('nations')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();
	}
});

/**
 * Get all nations for a game (public)
 */
export const listNationsForGame = query({
	args: { gameId: v.id('games') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('nations')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();
	}
});

/**
 * Get player's nation for a game
 */
export const getPlayerNation = query({
	args: { gameId: v.id('games') },
	handler: async (ctx, args) => {
		const game = await ctx.db.get(args.gameId);
		if (!game || !game.playerNationId) return null;

		return await ctx.db.get(game.playerNationId);
	}
});

/**
 * Helper function to clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Update nation resources with clamping (0-100)
 * Internal mutation for use by other Convex functions
 */
export const updateNationResources = internalMutation({
	args: {
		nationId: v.id('nations'),
		resourceChanges: v.object({
			military: v.optional(v.number()),
			economy: v.optional(v.number()),
			stability: v.optional(v.number()),
			influence: v.optional(v.number())
		})
	},
	handler: async (ctx, args) => {
		const nation = await ctx.db.get(args.nationId);
		if (!nation) throw new Error('Nation not found');

		const currentResources = nation.resources;
		const newResources = {
			military: clamp(
				currentResources.military + (args.resourceChanges.military || 0),
				0,
				100
			),
			economy: clamp(currentResources.economy + (args.resourceChanges.economy || 0), 0, 100),
			stability: clamp(
				currentResources.stability + (args.resourceChanges.stability || 0),
				0,
				100
			),
			influence: clamp(
				currentResources.influence + (args.resourceChanges.influence || 0),
				0,
				100
			)
		};

		await ctx.db.patch(args.nationId, {
			resources: newResources
		});

		return await ctx.db.get(args.nationId);
	}
});

/**
 * Set nation resources directly with clamping (0-100)
 * Public mutation for direct resource updates
 */
export const setNationResources = mutation({
	args: {
		nationId: v.id('nations'),
		resources: v.object({
			military: v.number(),
			economy: v.number(),
			stability: v.number(),
			influence: v.number()
		})
	},
	handler: async (ctx, args) => {
		const nation = await ctx.db.get(args.nationId);
		if (!nation) throw new Error('Nation not found');

		const clampedResources = {
			military: clamp(args.resources.military, 0, 100),
			economy: clamp(args.resources.economy, 0, 100),
			stability: clamp(args.resources.stability, 0, 100),
			influence: clamp(args.resources.influence, 0, 100)
		};

		await ctx.db.patch(args.nationId, {
			resources: clampedResources
		});

		return await ctx.db.get(args.nationId);
	}
});
