<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let isDark = $state(false);

	onMount(() => {
		// Check initial preference
		if (
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			isDark = true;
			document.documentElement.classList.add('dark');
		} else {
			isDark = false;
			document.documentElement.classList.remove('dark');
		}
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.theme = 'dark';
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.theme = 'light';
		}
	}
</script>

<Button variant="ghost" size="icon" onclick={toggleTheme} class="rounded-full">
	{#if isDark}
		<Moon class="h-5 w-5 transition-all" />
		<span class="sr-only">Switch to light mode</span>
	{:else}
		<Sun class="h-5 w-5 transition-all" />
		<span class="sr-only">Switch to dark mode</span>
	{/if}
</Button>
