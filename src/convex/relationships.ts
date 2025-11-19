import { internalQuery, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get all relationships for a nation (internal)
 */
export const getRelationshipsForNation = internalQuery({
	args: {
		gameId: v.id('games'),
		nationId: v.id('nations')
	},
	handler: async (ctx, args) => {
		const allRelationships = await ctx.db
			.query('relationships')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		// Filter relationships involving this nation
		return allRelationships.filter(
			(rel) => rel.nation1Id === args.nationId || rel.nation2Id === args.nationId
		);
	}
});

/**
 * Get all relationships for a game (public)
 */
export const listRelationshipsForGame = query({
	args: { gameId: v.id('games') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('relationships')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();
	}
});
