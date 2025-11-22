<script lang="ts">
	import ScenarioEditor from '$lib/components/scenarios/ScenarioEditor.svelte';
	import * as m from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.scenario_editor_title()}</title>
</svelte:head>

<div class="container py-8">
	<ScenarioEditor />
</div>
