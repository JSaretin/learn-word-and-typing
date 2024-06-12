<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { onMount, setContext } from 'svelte';
	import '../app.css';

	const winSound: Writable<HTMLAudioElement> = writable();
	const wrongSound: Writable<HTMLAudioElement> = writable();

	setContext('winSound', winSound)
	setContext('wrongSound', wrongSound)

	onMount(async()=>{
		$winSound = new Audio('/win.wav');
		$wrongSound = new Audio('/wrong.wav');
	})
</script>

<div
	class="p-4 w-full h-screen flex justify-center align-middle place-items-center text-neutral-500 overflow-y-scroll"
>
	<div class="fixed top-0 left-0 w-full flex justify-center align-middle place-items-center">
		<div class="flex font-medium gap-4 p-4">
			<a href="/">Home</a>
			<a href="/bible">Bibile</a>
		</div>
	</div>
	<slot />
</div>

<style lang="postcss">
	:global(html) {
		background-color: theme(colors.neutral.800);
		font-family: theme(fontFamily.Montserrat);
	}
</style>
