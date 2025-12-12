declare module '@openhistoricalmap/maplibre-gl-dates' {
	import type { Map } from 'maplibre-gl';

	export function filterByDate(map: Map, date: string | Date): void;
	export function dateRangeFromDate(date: string | Date): DateRange | undefined;
	export function decimalYearFromDate(date: Date): number;
	export function dateRangeFromISODate(isoDate: string): DateRange | undefined;
	export function constrainFilterByDateRange(filter: unknown, dateRange: DateRange): unknown;
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
		startDate: Date | false;
		startDecimalYear: number | false;
		startISODate: string | false;
		endDate: Date | false;
		endDecimalYear: number | false;
		endISODate: string | false;
	}
}
