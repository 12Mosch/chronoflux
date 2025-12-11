import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get the full world state for a game
 * This combines nations, relationships, and game status into a single query
 * for efficient frontend loading.
 */
export const getWorldState = query({
	args: { gameId: v.id('games') },
	handler: async (ctx, args) => {
		const game = await ctx.db.get('games', args.gameId);
		if (!game) {
			return null;
		}

		const scenario = await ctx.db.get('scenarios', game.scenarioId);
		if (!scenario) {
			return null;
		}

		const playerNation = game.playerNationId
			? await ctx.db.get('nations', game.playerNationId)
			: null;

		const nations = await ctx.db
			.query('nations')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		const relationships = await ctx.db
			.query('relationships')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		return {
			game,
			scenario,
			playerNation,
			nations,
			relationships
		};
	}
});
