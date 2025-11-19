<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Take Action</Card.Title>
	</Card.Header>
	<Card.Content>
		<Textarea placeholder="Describe your action..." class="min-h-[100px]" />
	</Card.Content>
	<Card.Footer>
		<Button>Submit Turn</Button>
	</Card.Footer>
</Card.Root>
