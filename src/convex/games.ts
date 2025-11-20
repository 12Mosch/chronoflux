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
		const scenario = await ctx.db.get(args.scenarioId);

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

		const world = (scenario as unknown as { initialWorldState?: { nations?: unknown[]; relationships?: unknown[] } }).initialWorldState ?? { nations: [], relationships: [] };
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

		await ctx.db.patch(gameId, {
			playerNationId: playerNationDocId,
			updatedAt: Date.now()
		});

		return await ctx.db.get(gameId);
	}
});

export const getGame = query({
	args: {
		gameId: v.id('games')
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.gameId);
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

		games.sort((a, b) => b.createdAt - a.createdAt);
		return games;
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
		const game = await ctx.db.get(args.gameId);
		if (!game) {
			throw new Error('Game not found');
		}

		// Get scenario
		const scenario = await ctx.db.get(game.scenarioId);
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
		const playerNation = game.playerNationId ? await ctx.db.get(game.playerNationId) : null;

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
