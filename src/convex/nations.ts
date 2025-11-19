import { internalQuery, query } from './_generated/server';
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
