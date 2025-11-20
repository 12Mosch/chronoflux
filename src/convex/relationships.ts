import { internalMutation, internalQuery, mutation, query } from './_generated/server';
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

/**
 * Helper function to clamp relationship score between -100 and 100
 */
function clampRelationshipScore(score: number): number {
	return Math.max(-100, Math.min(100, score));
}

/**
 * Update relationship score with clamping (-100 to 100)
 * Internal mutation for use by other Convex functions
 */
export const updateRelationshipScore = internalMutation({
	args: {
		gameId: v.id('games'),
		nation1Id: v.id('nations'),
		nation2Id: v.id('nations'),
		scoreChange: v.number(),
		newStatus: v.optional(
			v.union(v.literal('allied'), v.literal('neutral'), v.literal('hostile'), v.literal('at_war'))
		)
	},
	handler: async (ctx, args) => {
		// Find the relationship (bidirectional)
		const relationship = await ctx.db
			.query('relationships')
			.filter((q) =>
				q.and(
					q.eq(q.field('gameId'), args.gameId),
					q.or(
						q.and(
							q.eq(q.field('nation1Id'), args.nation1Id),
							q.eq(q.field('nation2Id'), args.nation2Id)
						),
						q.and(
							q.eq(q.field('nation1Id'), args.nation2Id),
							q.eq(q.field('nation2Id'), args.nation1Id)
						)
					)
				)
			)
			.first();

		if (!relationship) {
			throw new Error('Relationship not found');
		}

		const newScore = clampRelationshipScore(relationship.relationshipScore + args.scoreChange);

		const updates: {
			relationshipScore: number;
			status?: 'allied' | 'neutral' | 'hostile' | 'at_war';
		} = {
			relationshipScore: newScore
		};

		if (args.newStatus !== undefined) {
			updates.status = args.newStatus;
		}

		await ctx.db.patch(relationship._id, updates);

		return await ctx.db.get(relationship._id);
	}
});

/**
 * Set relationship status and optionally update score
 * Public mutation for direct relationship updates
 */
export const setRelationshipStatus = mutation({
	args: {
		gameId: v.id('games'),
		nation1Id: v.id('nations'),
		nation2Id: v.id('nations'),
		status: v.union(
			v.literal('allied'),
			v.literal('neutral'),
			v.literal('hostile'),
			v.literal('at_war')
		),
		relationshipScore: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		// Find the relationship (bidirectional)
		const relationship = await ctx.db
			.query('relationships')
			.filter((q) =>
				q.and(
					q.eq(q.field('gameId'), args.gameId),
					q.or(
						q.and(
							q.eq(q.field('nation1Id'), args.nation1Id),
							q.eq(q.field('nation2Id'), args.nation2Id)
						),
						q.and(
							q.eq(q.field('nation1Id'), args.nation2Id),
							q.eq(q.field('nation2Id'), args.nation1Id)
						)
					)
				)
			)
			.first();

		if (!relationship) {
			throw new Error('Relationship not found');
		}

		const updates: {
			status: 'allied' | 'neutral' | 'hostile' | 'at_war';
			relationshipScore?: number;
		} = {
			status: args.status
		};

		if (args.relationshipScore !== undefined) {
			updates.relationshipScore = clampRelationshipScore(args.relationshipScore);
		}

		await ctx.db.patch(relationship._id, updates);

		return await ctx.db.get(relationship._id);
	}
});
