<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { TriangleAlert, House, ArrowLeft } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} - Chronoflux</title>
</svelte:head>

<div
	class="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground"
>
	<!-- Background Effects -->
	<div
		class="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]"
	></div>
	<div
		class="absolute top-1/2 left-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[80px]"
	></div>

	<div class="z-10 flex max-w-md flex-col items-center text-center">
		<div
			class="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-card shadow-2xl ring-1 ring-border/50 backdrop-blur-sm"
		>
			<TriangleAlert class="h-12 w-12 text-destructive" strokeWidth={1.5} />
		</div>

		<h1 class="mb-2 text-8xl font-bold tracking-tighter text-foreground/90">
			{page.status}
		</h1>

		<h2 class="mb-6 text-2xl font-medium text-muted-foreground">
			{page.error?.message || m.error_page_default_message()}
		</h2>

		<p class="mb-8 text-muted-foreground/80">
			{m.error_page_description()}
		</p>

		<div class="flex flex-col gap-3 sm:flex-row">
			<Button
				href="/"
				variant="default"
				size="lg"
				class="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
			>
				<House class="h-4 w-4" />
				{m.error_page_return_home()}
			</Button>
			<Button
				onclick={() => {
					if (window.history.length > 2) {
						history.back();
					} else {
						window.location.href = '/';
					}
				}}
				variant="outline"
				size="lg"
				class="gap-2 backdrop-blur-sm hover:bg-accent/10"
			>
				<ArrowLeft class="h-4 w-4" />
				{m.error_page_go_back()}
			</Button>
		</div>
	</div>

	<!-- Decorative Elements -->
	<div
		class="absolute right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent via-border to-transparent opacity-50"
	></div>
	<div
		class="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-border to-transparent opacity-50"
	></div>
</div>
