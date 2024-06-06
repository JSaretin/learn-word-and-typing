<script lang="ts">
	import '../app.css';
</script>

<div
	class="p-4 w-full h-screen flex justify-center align-middle place-items-center text-neutral-500 overflow-y-scroll"
>
	<slot />
</div>

<style lang="postcss">
	:global(html) {
		background-color: theme(colors.neutral.800);
		font-family: theme(fontFamily.Montserrat);
	}
</style>
