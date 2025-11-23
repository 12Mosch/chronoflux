<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	
	let { children, ...restProps } = $props();
</script>

<TooltipPrimitive.Trigger {...restProps}>
	{@render children?.()}
</TooltipPrimitive.Trigger>
