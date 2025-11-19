import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const submitTurn = mutation({
	args: { gameId: v.id('games'), playerAction: v.string() },
	handler: async (ctx, args) => {
		const game = await ctx.db.get(args.gameId);
		if (!game) throw new Error('Game not found');

		const turnNumber = (game.currentTurn || 0) + 1;

		await ctx.db.insert('turns', {
			gameId: args.gameId,
			playerAction: args.playerAction,
			aiResponse: {
				events: [],
				consequences: 'AI processing - consequences will be generated',
				narrative: 'AI processing - narrative will be generated',
				worldStateChanges: {}
			},
			turnNumber: turnNumber,
			timestamp: Date.now()
		});

		// Re-check game state to prevent race conditions
		const currentGame = await ctx.db.get(args.gameId);
		if (!currentGame) throw new Error('Game not found');

		// Only update if current turn hasn't changed (prevents duplicate turn numbers)
		if (currentGame.currentTurn !== game.currentTurn) {
			throw new Error('Game state changed during turn submission. Please retry.');
		}

		await ctx.db.patch(args.gameId, {
			currentTurn: turnNumber,
			updatedAt: Date.now()
		});

		return { success: true, turnNumber };
	}
});

export const getTurnsForGame = query({
	args: { gameId: v.id('games') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('turns')
			.withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
			.order('desc')
			.collect();
	}
});
