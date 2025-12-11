import { internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';

const initialWorldStateValidator = v.object({
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
});

export const createOrUpdateScenario = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		period: v.string(),
		startYear: v.number(),
		initialWorldState: initialWorldStateValidator,
		aiContext: v.string()
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('scenarios')
			.filter((q) =>
				q.and(
					q.eq(q.field('name'), args.name),
					q.eq(q.field('historicalPeriod'), args.period),
					q.eq(q.field('startYear'), args.startYear)
				)
			)
			.first();

		if (existing) {
			await ctx.db.patch('scenarios', existing._id, {
				name: args.name,
				description: args.description,
				historicalPeriod: args.period,
				startYear: args.startYear,
				initialWorldState: args.initialWorldState,
				aiContext: args.aiContext
			});

			return await ctx.db.get('scenarios', existing._id);
		}

		const id = await ctx.db.insert('scenarios', {
			name: args.name,
			description: args.description,
			historicalPeriod: args.period,
			startYear: args.startYear,
			initialWorldState: args.initialWorldState,
			aiContext: args.aiContext,
			isUserCreated: true
		});

		return await ctx.db.get('scenarios', id);
	}
});

export const listScenarios = query({
	args: {},
	handler: async (ctx) => {
		const scenarios = await ctx.db.query('scenarios').collect();
		return scenarios;
	}
});

export const getScenario = query({
	args: {
		id: v.id('scenarios')
	},
	handler: async (ctx, args) => {
		return await ctx.db.get('scenarios', args.id);
	}
});

export const getScenarioById = internalQuery({
	args: {
		scenarioId: v.id('scenarios')
	},
	handler: async (ctx, args) => {
		return await ctx.db.get('scenarios', args.scenarioId);
	}
});

export const seedScenarios = mutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db.query('scenarios').collect();
		if (existing.length > 0) {
			return 'Scenarios already seeded';
		}

		const scenarios = [
			{
				name: 'World War I',
				description: 'The Great War begins in Europe.',
				historicalPeriod: 'Early 20th Century',
				startYear: 1914,
				aiContext: 'Europe is a powder keg. Alliances are rigid. Nationalism is high.',
				initialWorldState: {
					nations: [
						{
							id: 'germany',
							name: 'Germany',
							government: 'Empire',
							resources: { military: 80, economy: 70, stability: 60, influence: 70 },
							territories: ['Germany']
						},
						{
							id: 'france',
							name: 'France',
							government: 'Republic',
							resources: { military: 70, economy: 60, stability: 50, influence: 60 },
							territories: ['France']
						},
						{
							id: 'russia',
							name: 'Russia',
							government: 'Empire',
							resources: { military: 60, economy: 40, stability: 30, influence: 50 },
							territories: ['Russia']
						},
						{
							id: 'uk',
							name: 'United Kingdom',
							government: 'Monarchy',
							resources: { military: 90, economy: 80, stability: 80, influence: 90 },
							territories: ['UK']
						},
						{
							id: 'austria',
							name: 'Austria-Hungary',
							government: 'Empire',
							resources: { military: 50, economy: 40, stability: 20, influence: 40 },
							territories: ['Austria']
						}
					],
					relationships: [],
					globalEvents: ['Assassination of Archduke Franz Ferdinand']
				}
			},
			{
				name: 'Cold War',
				description: 'The world is divided between East and West.',
				historicalPeriod: 'Post-WWII',
				startYear: 1947,
				aiContext: 'The Iron Curtain has descended. Nuclear proliferation is a threat.',
				initialWorldState: {
					nations: [
						{
							id: 'usa',
							name: 'USA',
							government: 'Democracy',
							resources: { military: 90, economy: 95, stability: 80, influence: 90 },
							territories: ['USA']
						},
						{
							id: 'ussr',
							name: 'USSR',
							government: 'Communist State',
							resources: { military: 90, economy: 60, stability: 50, influence: 80 },
							territories: ['USSR']
						}
					],
					relationships: [],
					globalEvents: ['Truman Doctrine']
				}
			},
			{
				name: 'Ancient Rome',
				description: 'The Republic is crumbling.',
				historicalPeriod: 'Antiquity',
				startYear: -44,
				aiContext: 'Caesar has been assassinated. Civil war looms.',
				initialWorldState: {
					nations: [
						{
							id: 'rome_octavian',
							name: 'Rome (Octavian)',
							government: 'Republic',
							resources: { military: 70, economy: 60, stability: 40, influence: 70 },
							territories: ['Italy']
						},
						{
							id: 'rome_antony',
							name: 'Rome (Antony)',
							government: 'Republic',
							resources: { military: 70, economy: 50, stability: 40, influence: 60 },
							territories: ['Egypt']
						}
					],
					relationships: [],
					globalEvents: ['Ides of March']
				}
			},
			{
				name: 'Custom',
				description: 'A blank slate for your own history.',
				historicalPeriod: 'Custom',
				startYear: 2000,
				aiContext: 'A custom scenario.',
				initialWorldState: {
					nations: [],
					relationships: [],
					globalEvents: []
				}
			}
		];

		await Promise.all(
			scenarios.map(async (scenario) => {
				try {
					await ctx.db.insert('scenarios', scenario);
				} catch (error) {
					console.error(`Failed to seed scenario ${scenario.name}:`, error);
				}
			})
		);

		return 'Scenarios seeded';
	}
});

export const deleteScenario = mutation({
	args: {
		id: v.id('scenarios')
	},
	handler: async (ctx, args) => {
		// Get the scenario to check if it's user-created
		const scenario = await ctx.db.get('scenarios', args.id);

		if (!scenario) {
			throw new Error('Scenario not found');
		}

		// Only allow deletion of user-created scenarios
		if (!scenario.isUserCreated) {
			throw new Error('Cannot delete pre-defined scenarios');
		}

		// Check if there are any games using this scenario
		const gamesUsingScenario = await ctx.db
			.query('games')
			.filter((q) =>
				q.and(q.eq(q.field('scenarioId'), args.id), q.neq(q.field('status'), 'completed'))
			)
			.collect();

		if (gamesUsingScenario.length > 0) {
			throw new Error('Cannot delete scenario that is being used in active or paused games');
		}

		// Delete the scenario
		await ctx.db.delete('scenarios', args.id);

		return { success: true };
	}
});
