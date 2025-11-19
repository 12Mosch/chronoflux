import { action, mutation, query } from './_generated/server';
import { api as fullApi } from './_generated/api';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

// Use an untyped alias for `api` here to avoid circular type inference issues (TS7022/TS7023).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = fullApi;

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

/**
 * Submit turn with AI processing
 * This action:
 * 1. Calls AI to process the player action
 * 2. Creates events based on AI response
 * 3. Updates nation resources
 * 4. Updates relationships
 * 5. Persists the turn with full AI response
 */
export const submitTurnWithAI = action({
	args: { gameId: v.id('games'), playerAction: v.string() },
	handler: async (ctx, args) => {
		// Get AI response
		const aiResponse = await ctx.runAction(api.ai.processTurnWithAI, {
			gameId: args.gameId,
			playerAction: args.playerAction
		});

		// Call mutation to persist the turn and update state
		const result = await ctx.runMutation(api.turns.persistTurnWithAIResponse, {
			gameId: args.gameId,
			playerAction: args.playerAction,
			aiResponse
		});

		return result;
	}
});

/**
 * Internal mutation to persist turn and update world state
 * This is called by submitTurnWithAI after AI processing
 */
export const persistTurnWithAIResponse = mutation({
	args: {
		gameId: v.id('games'),
		playerAction: v.string(),
		aiResponse: v.object({
			events: v.array(
				v.object({
					type: v.union(
						v.literal('political'),
						v.literal('military'),
						v.literal('diplomatic'),
						v.literal('economic'),
						v.literal('other')
					),
					title: v.string(),
					description: v.string(),
					affected_nations: v.array(v.string()),
					impact: v.any()
				})
			),
			consequences: v.string(),
			narrative: v.string(),
			resourceChanges: v.any(),
			relationshipChanges: v.array(
				v.object({
					nation1: v.string(),
					nation2: v.string(),
					scoreChange: v.number(),
					statusChange: v.optional(
						v.union(
							v.literal('allied'),
							v.literal('neutral'),
							v.literal('hostile'),
							v.literal('at_war')
						)
					)
				})
			),
			feasibility: v.union(v.literal('high'), v.literal('medium'), v.literal('low'))
		})
	},
	handler: async (ctx, args) => {
		const game = await ctx.db.get(args.gameId);
		if (!game) throw new Error('Game not found');
		if (!game.playerNationId) throw new Error('Player nation not set');

		const turnNumber = (game.currentTurn || 0) + 1;

		// Re-check game state to prevent race conditions
		const currentGame = await ctx.db.get(args.gameId);
		if (!currentGame) throw new Error('Game not found');

		// Only update if current turn hasn't changed (prevents duplicate turn numbers)
		if (currentGame.currentTurn !== game.currentTurn) {
			throw new Error('Game state changed during turn submission. Please retry.');
		}

		// Get player nation
		const playerNation = await ctx.db.get(game.playerNationId);
		if (!playerNation) throw new Error('Player nation not found');

		// Get all nations for name mapping
		const allNations = await ctx.db
			.query('nations')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		const nationNameToId = new Map<string, Id<'nations'>>();
		allNations.forEach((nation) => {
			nationNameToId.set(nation.name, nation._id);
		});

		// Update player nation resources based on AI response
		if (args.aiResponse.resourceChanges) {
			const currentResources = playerNation.resources;
			const newResources = {
				military: Math.max(
					0,
					currentResources.military + (args.aiResponse.resourceChanges.military || 0)
				),
				economy: Math.max(
					0,
					currentResources.economy + (args.aiResponse.resourceChanges.economy || 0)
				),
				stability: Math.max(
					0,
					currentResources.stability + (args.aiResponse.resourceChanges.stability || 0)
				),
				influence: Math.max(
					0,
					currentResources.influence + (args.aiResponse.resourceChanges.influence || 0)
				)
			};

			await ctx.db.patch(game.playerNationId, {
				resources: newResources
			});
		}

		// Update relationships based on AI response
		if (args.aiResponse.relationshipChanges) {
			for (const relChange of args.aiResponse.relationshipChanges) {
				const nation1Id = nationNameToId.get(relChange.nation1);
				const nation2Id = nationNameToId.get(relChange.nation2);

				if (nation1Id && nation2Id) {
					// Find existing relationship
					const existingRel = await ctx.db
						.query('relationships')
						.filter((q) =>
							q.and(
								q.eq(q.field('gameId'), args.gameId),
								q.or(
									q.and(
										q.eq(q.field('nation1Id'), nation1Id),
										q.eq(q.field('nation2Id'), nation2Id)
									),
									q.and(
										q.eq(q.field('nation1Id'), nation2Id),
										q.eq(q.field('nation2Id'), nation1Id)
									)
								)
							)
						)
						.first();

					if (existingRel) {
						const newScore = Math.max(
							-100,
							Math.min(100, existingRel.relationshipScore + relChange.scoreChange)
						);

						await ctx.db.patch(existingRel._id, {
							relationshipScore: newScore,
							...(relChange.statusChange && { status: relChange.statusChange })
						});
					}
				}
			}
		}

		// Convert AI events to database events with nation IDs
		const eventsForDB = args.aiResponse.events.map((event) => ({
			...event,
			affectedNations: event.affected_nations
				.map((name) => nationNameToId.get(name))
				.filter((id): id is Id<'nations'> => id !== undefined)
		}));

		// Insert turn document
		const turnId = await ctx.db.insert('turns', {
			gameId: args.gameId,
			playerAction: args.playerAction,
			aiResponse: {
				events: eventsForDB,
				consequences: args.aiResponse.consequences,
				narrative: args.aiResponse.narrative,
				worldStateChanges: args.aiResponse.resourceChanges
			},
			turnNumber: turnNumber,
			timestamp: Date.now()
		});

		// Create individual event documents
		for (const event of eventsForDB) {
			await ctx.db.insert('events', {
				gameId: args.gameId,
				turnNumber: turnNumber,
				type: event.type,
				title: event.title,
				description: event.description,
				affectedNations: event.affectedNations,
				impact: event.impact
			});
		}

		// Update game state
		await ctx.db.patch(args.gameId, {
			currentTurn: turnNumber,
			updatedAt: Date.now()
		});

		// Return turn summary data
		return {
			success: true,
			turnNumber,
			turnId,
			events: eventsForDB,
			narrative: args.aiResponse.narrative,
			consequences: args.aiResponse.consequences,
			resourceChanges: args.aiResponse.resourceChanges
		};
	}
});
