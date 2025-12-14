<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';
	import { ModeWatcher } from 'mode-watcher';
	import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	let { children } = $props();
	setupConvex(PUBLIC_CONVEX_URL);
	injectSpeedInsights();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
{@render children()}
<DebugPanel />
