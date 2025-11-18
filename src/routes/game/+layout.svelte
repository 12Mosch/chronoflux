<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-900 text-white">
	<!-- Game Header -->
	<header class="sticky top-0 z-10 border-b border-slate-700 bg-slate-800">
		<div class="container mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<h1 class="text-2xl font-bold">ChronoFlux</h1>
					<div class="text-sm text-slate-400">
						<p>Game Interface</p>
					</div>
				</div>
				<div class="flex gap-4">
					<a href="/scenarios" class="text-slate-400 transition-colors hover:text-white">
						← Back to Scenarios
					</a>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		background-color: rgb(15, 23, 42);
	}
</style>
