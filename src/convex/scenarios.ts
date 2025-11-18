import { mutation, query } from './_generated/server';
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
			await ctx.db.patch(existing._id, {
				name: args.name,
				description: args.description,
				historicalPeriod: args.period,
				startYear: args.startYear,
				initialWorldState: args.initialWorldState,
				aiContext: args.aiContext
			});

			return await ctx.db.get(existing._id);
		}

		const id = await ctx.db.insert('scenarios', {
			name: args.name,
			description: args.description,
			historicalPeriod: args.period,
			startYear: args.startYear,
			initialWorldState: args.initialWorldState,
			aiContext: args.aiContext
		});

		return await ctx.db.get(id);
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
		return await ctx.db.get(args.id);
	}
});
