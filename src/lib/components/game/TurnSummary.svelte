<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	export let open = false;
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Turn Summary</Dialog.Title>
			<Dialog.Description>Here is what happened this turn.</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<p>Summary details...</p>
		</div>
		<Dialog.Footer>
			<Button onclick={() => (open = false)}>Continue</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
