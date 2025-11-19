import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	games: defineTable({
		scenarioId: v.id('scenarios'),
		playerId: v.optional(v.string()),
		playerNationId: v.optional(v.id('nations')),
		currentTurn: v.number(),
		status: v.union(v.literal('active'), v.literal('paused'), v.literal('completed')),
		createdAt: v.number(),
		updatedAt: v.number()
	}),

	scenarios: defineTable({
		name: v.string(),
		description: v.string(),
		historicalPeriod: v.string(),
		startYear: v.number(),
		initialWorldState: v.object({
			nations: v.array(
				v.object({
					id: v.string(),
					name: v.string(),
					government: v.string(),
					resources: v.object({
						military: v.number(),
						economy: v.number(),
						stability: v.number(),
						influence: v.number()
					}),
					territories: v.array(v.string())
				})
			),
			relationships: v.array(
				v.object({
					nation1Id: v.string(),
					nation2Id: v.string(),
					status: v.union(
						v.literal('allied'),
						v.literal('neutral'),
						v.literal('hostile'),
						v.literal('at_war')
					),
					tradeAgreements: v.boolean(),
					militaryAlliance: v.boolean(),
					relationshipScore: v.number()
				})
			),
			globalEvents: v.array(v.string())
		}),
		aiContext: v.string()
	}),

	nations: defineTable({
		gameId: v.id('games'),
		name: v.string(),
		government: v.string(),
		resources: v.object({
			military: v.number(),
			economy: v.number(),
			stability: v.number(),
			influence: v.number()
		}),
		territories: v.array(v.string()),
		isPlayerControlled: v.boolean()
	}),

	turns: defineTable({
		gameId: v.id('games'),
		turnNumber: v.number(),
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
					affectedNations: v.array(v.id('nations')),
					impact: v.any()
				})
			),
			consequences: v.string(),
			narrative: v.string(),
			worldStateChanges: v.any()
		}),
		timestamp: v.number()
	}).index('by_gameId', ['gameId']),

	events: defineTable({
		gameId: v.id('games'),
		turnNumber: v.number(),
		type: v.union(
			v.literal('political'),
			v.literal('military'),
			v.literal('diplomatic'),
			v.literal('economic'),
			v.literal('other')
		),
		title: v.string(),
		description: v.string(),
		affectedNations: v.array(v.id('nations')),
		impact: v.any()
	}),

	relationships: defineTable({
		gameId: v.id('games'),
		nation1Id: v.id('nations'),
		nation2Id: v.id('nations'),
		status: v.union(
			v.literal('allied'),
			v.literal('neutral'),
			v.literal('hostile'),
			v.literal('at_war')
		),
		tradeAgreements: v.boolean(),
		militaryAlliance: v.boolean(),
		relationshipScore: v.number()
	})
});
