declare module '@openhistoricalmap/maplibre-gl-dates' {
	import type { Map } from 'maplibre-gl';

	export function filterByDate(map: Map, date: string | Date): void;
	export function dateRangeFromDate(date: string | Date): DateRange | undefined;
	export function decimalYearFromDate(date: Date): number;
	export function dateRangeFromISODate(isoDate: string): DateRange | undefined;
	export function constrainFilterByDateRange(filter: unknown, dateRange: DateRange): unknown[];
	export function constrainLegacyFilterByDateRange(
		filter: unknown[],
		dateRange: DateRange
	): unknown[];
	export function constrainExpressionFilterByDateRange(
		filter: unknown,
		dateRange: DateRange
	): unknown[];
	export function isLegacyFilter(filter: unknown): boolean;
	export function updateVariable(letExpression: unknown[], name: string, newValue: unknown): void;

	interface DateRange {
		startDate?: Date | number | string | false;
		startDecimalYear?: Date | number | string | false;
		startISODate?: Date | number | string | false;
		endDate?: Date | number | string | false;
		endDecimalYear?: Date | number | string | false;
		endISODate?: Date | number | string | false;
	}
}
