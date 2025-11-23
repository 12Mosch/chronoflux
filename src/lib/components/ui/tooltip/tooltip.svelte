<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';

	let { children, ...restProps } = $props();
</script>

<TooltipPrimitive.Root {...restProps}>
	{@render children?.()}
</TooltipPrimitive.Root>
