import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createGame = mutation({
	args: {
		scenarioId: v.id('scenarios'),
		playerNationId: v.string(),
		playerId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const scenario = await ctx.db.get('scenarios', args.scenarioId);

		if (!scenario) {
			throw new Error('Scenario not found');
		}

		const now = Date.now();

		const gameId = await ctx.db.insert('games', {
			scenarioId: args.scenarioId,
			playerId: args.playerId,
			currentTurn: 1,
			status: 'active',
			createdAt: now,
			updatedAt: now
		});

		type NationData = {
			id?: string;
			name: string;
			government: string;
			resources: {
				military: number;
				economy: number;
				stability: number;
				influence: number;
			};
			territories?: string[];
		};

		type RelationshipData = {
			nation1Id?: string;
			nation2Id?: string;
			status: 'allied' | 'neutral' | 'hostile' | 'at_war';
			tradeAgreements: boolean;
			militaryAlliance: boolean;
			relationshipScore: number;
		};

		const world = (
			scenario as unknown as {
				initialWorldState?: { nations?: unknown[]; relationships?: unknown[] };
			}
		).initialWorldState ?? { nations: [], relationships: [] };
		const nations = (world.nations ?? []) as NationData[];
		const relationships = (world.relationships ?? []) as RelationshipData[];

		const nationIdMap: Record<string, Id<'nations'>> = {};
		let playerNationDocId: Id<'nations'> | null = null;

		for (const nation of nations) {
			const insertedNationId = await ctx.db.insert('nations', {
				gameId,
				name: nation.name,
				government: nation.government,
				resources: nation.resources,
				territories: nation.territories ?? [],
				isPlayerControlled: nation.id === args.playerNationId
			});

			if (nation.id) {
				nationIdMap[nation.id] = insertedNationId;
			}

			if (nation.id === args.playerNationId) {
				playerNationDocId = insertedNationId;
			}
		}

		for (const rel of relationships) {
			const nation1Id = rel.nation1Id && nationIdMap[rel.nation1Id];
			const nation2Id = rel.nation2Id && nationIdMap[rel.nation2Id];

			if (!nation1Id || !nation2Id) continue;

			await ctx.db.insert('relationships', {
				gameId,
				nation1Id,
				nation2Id,
				status: rel.status,
				tradeAgreements: rel.tradeAgreements,
				militaryAlliance: rel.militaryAlliance,
				relationshipScore: rel.relationshipScore
			});
		}

		if (!playerNationDocId) {
			throw new Error('Player nation not found in scenario initialWorldState');
		}

		await ctx.db.patch('games', gameId, {
			playerNationId: playerNationDocId,
			updatedAt: Date.now()
		});

		return gameId;
	}
});

export const getGame = query({
	args: {
		gameId: v.id('games')
	},
	handler: async (ctx, args) => {
		return await ctx.db.get('games', args.gameId);
	}
});

export const listGamesForUser = query({
	args: {
		playerId: v.string()
	},
	handler: async (ctx, args) => {
		const games = await ctx.db
			.query('games')
			.filter((q) => q.eq(q.field('playerId'), args.playerId))
			.collect();

		games.sort((a, b) => b.updatedAt - a.updatedAt);
		return games;
	}
});

export const updateGamePlayerId = mutation({
	args: {
		gameId: v.id('games'),
		playerId: v.string()
	},
	handler: async (ctx, args) => {
		await ctx.db.patch('games', args.gameId, {
			playerId: args.playerId,
			updatedAt: Date.now()
		});
	}
});

/**
 * Get comprehensive world state for a game
 * Combines game info, nations, relationships, and scenario data
 */
export const getWorldState = query({
	args: {
		gameId: v.id('games')
	},
	handler: async (ctx, args) => {
		// Get game
		const game = await ctx.db.get('games', args.gameId);
		if (!game) {
			throw new Error('Game not found');
		}

		// Get scenario
		const scenario = await ctx.db.get('scenarios', game.scenarioId);
		if (!scenario) {
			throw new Error('Scenario not found');
		}

		// Get all nations for this game
		const nations = await ctx.db
			.query('nations')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		// Get all relationships for this game
		const relationships = await ctx.db
			.query('relationships')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		// Get player nation
		const playerNation = game.playerNationId
			? await ctx.db.get('nations', game.playerNationId)
			: null;

		return {
			game: {
				_id: game._id,
				scenarioId: game.scenarioId,
				currentTurn: game.currentTurn,
				status: game.status,
				createdAt: game.createdAt,
				updatedAt: game.updatedAt
			},
			scenario: {
				_id: scenario._id,
				name: scenario.name,
				description: scenario.description,
				historicalPeriod: scenario.historicalPeriod,
				startYear: scenario.startYear
			},
			nations,
			relationships,
			playerNation
		};
	}
});

/**
 * Get context for AI processing
 * Fetches player nation, resources, relationships, and recent events
 */
export const getGameContext = query({
	args: {
		gameId: v.id('games')
	},
	handler: async (ctx, args) => {
		const game = await ctx.db.get('games', args.gameId);
		if (!game) throw new Error('Game not found');

		const scenario = await ctx.db.get('scenarios', game.scenarioId);
		if (!scenario) throw new Error('Scenario not found');

		const playerNation = game.playerNationId
			? await ctx.db.get('nations', game.playerNationId)
			: null;
		if (!playerNation) throw new Error('Player nation not found');

		// Get all nations for name resolution
		const allNations = await ctx.db
			.query('nations')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		// Get relationships involving player
		const relationships = await ctx.db
			.query('relationships')
			.filter((q) =>
				q.and(
					q.eq(q.field('gameId'), args.gameId),
					q.or(
						q.eq(q.field('nation1Id'), playerNation._id),
						q.eq(q.field('nation2Id'), playerNation._id)
					)
				)
			)
			.collect();

		// Get recent turns for historical context (last 5 turns)
		const recentTurns = await ctx.db
			.query('turns')
			.withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
			.order('desc')
			.take(5);

		// Build comprehensive turn history for AI
		const turnHistory = recentTurns.reverse().map((turn) => ({
			turnNumber: turn.turnNumber,
			playerAction: turn.playerAction,
			narrative: turn.aiResponse.narrative,
			consequences: turn.aiResponse.consequences,
			events: turn.aiResponse.events.map((e) => ({
				title: e.title,
				description: e.description,
				type: e.type
			})),
			worldStateChanges: turn.aiResponse.worldStateChanges
		}));

		// Format relationships for AI
		const formattedRelationships = relationships.map((rel) => {
			const otherNationId = rel.nation1Id === playerNation._id ? rel.nation2Id : rel.nation1Id;
			const otherNation = allNations.find((n) => n._id === otherNationId);
			return {
				name: otherNation?.name || 'Unknown',
				status: rel.status,
				score: rel.relationshipScore
			};
		});

		return {
			playerNationName: playerNation.name,
			currentYear: scenario.startYear + game.currentTurn - 1,
			turnNumber: game.currentTurn,
			worldState: {
				playerResources: playerNation.resources,
				relationships: formattedRelationships,
				turnHistory,
				historySummary: game.historySummary,
				otherNations: allNations
					.filter((n) => n._id !== playerNation._id)
					.map((n) => ({
						name: n.name,
						government: n.government,
						resources: n.resources,
						territories: n.territories
					}))
			}
		};
	}
});

/**
 * Delete a game and all associated data
 * This includes nations, relationships, and turns
 */
export const deleteGame = mutation({
	args: {
		gameId: v.id('games')
	},
	handler: async (ctx, args) => {
		const game = await ctx.db.get('games', args.gameId);
		if (!game) {
			throw new Error('Game not found');
		}

		// Delete all relationships associated with this game
		const relationships = await ctx.db
			.query('relationships')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		for (const relationship of relationships) {
			await ctx.db.delete('relationships', relationship._id);
		}

		// Delete all turns associated with this game
		const turns = await ctx.db
			.query('turns')
			.withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
			.collect();

		for (const turn of turns) {
			await ctx.db.delete('turns', turn._id);
		}

		// Delete all nations associated with this game
		const nations = await ctx.db
			.query('nations')
			.filter((q) => q.eq(q.field('gameId'), args.gameId))
			.collect();

		for (const nation of nations) {
			await ctx.db.delete('nations', nation._id);
		}

		// Finally, delete the game itself
		await ctx.db.delete('games', args.gameId);
	}
});
