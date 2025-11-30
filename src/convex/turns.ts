import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

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
			feasibility: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
			new_nations: v.optional(
				v.record(
					v.string(),
					v.object({
						government: v.string(),
						territories: v.array(v.string()),
						resources: v.object({
							military: v.number(),
							economy: v.number(),
							stability: v.number(),
							influence: v.number()
						})
					})
				)
			)
		}),
		historySummary: v.optional(v.string())
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

		const getOrCreateNationId = async (name: string): Promise<Id<'nations'>> => {
			if (nationNameToId.has(name)) {
				return nationNameToId.get(name)!;
			}

			const newNationData = args.aiResponse.new_nations?.[name];

			const newNationId = await ctx.db.insert('nations', {
				gameId: args.gameId,
				name,
				government: newNationData?.government || 'Unknown',
				resources: newNationData?.resources || {
					military: 50,
					economy: 50,
					stability: 50,
					influence: 50
				},
				territories: newNationData?.territories || [],
				isPlayerControlled: false
			});

			nationNameToId.set(name, newNationId);
			return newNationId;
		};

		// Update player nation resources based on AI response
		if (args.aiResponse.resourceChanges) {
			const currentResources = playerNation.resources;
			const newResources = {
				military: Math.max(
					0,
					Math.min(100, currentResources.military + (args.aiResponse.resourceChanges.military || 0))
				),
				economy: Math.max(
					0,
					Math.min(100, currentResources.economy + (args.aiResponse.resourceChanges.economy || 0))
				),
				stability: Math.max(
					0,
					Math.min(
						100,
						currentResources.stability + (args.aiResponse.resourceChanges.stability || 0)
					)
				),
				influence: Math.max(
					0,
					Math.min(
						100,
						currentResources.influence + (args.aiResponse.resourceChanges.influence || 0)
					)
				)
			};

			await ctx.db.patch(game.playerNationId, {
				resources: newResources
			});
		}

		// Update relationships based on AI response
		if (args.aiResponse.relationshipChanges) {
			for (const relChange of args.aiResponse.relationshipChanges) {
				const nation1Id = await getOrCreateNationId(relChange.nation1);
				const nation2Id = await getOrCreateNationId(relChange.nation2);

				// Find existing relationship
				const existingRel = await ctx.db
					.query('relationships')
					.filter((q) =>
						q.and(
							q.eq(q.field('gameId'), args.gameId),
							q.or(
								q.and(q.eq(q.field('nation1Id'), nation1Id), q.eq(q.field('nation2Id'), nation2Id)),
								q.and(q.eq(q.field('nation1Id'), nation2Id), q.eq(q.field('nation2Id'), nation1Id))
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
				} else {
					// Create new relationship if it doesn't exist
					await ctx.db.insert('relationships', {
						gameId: args.gameId,
						nation1Id,
						nation2Id,
						status: relChange.statusChange || 'neutral',
						tradeAgreements: false,
						militaryAlliance: false,
						relationshipScore: Math.max(-100, Math.min(100, relChange.scoreChange))
					});
				}
			}
		}

		// Convert AI events to database events with nation IDs
		const eventsForDB = [];
		for (const event of args.aiResponse.events) {
			const { affected_nations, ...rest } = event;
			const affectedNationIds = [];
			for (const name of affected_nations) {
				affectedNationIds.push(await getOrCreateNationId(name));
			}
			eventsForDB.push({
				...rest,
				affectedNations: affectedNationIds
			});
		}

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
			updatedAt: Date.now(),
			...(args.historySummary && { historySummary: args.historySummary })
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
