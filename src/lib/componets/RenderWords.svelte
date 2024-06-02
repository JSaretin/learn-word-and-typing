<script lang="ts">
	import type { WordData } from '$lib/structure';
	import RenderWord from './RenderWord.svelte';

	export let title: string;
	export let words: WordData[];
</script>

<div class="flex flex-col w-full">
	<h2
		class="text-2xl text-neutral-700 text-center font-bold bg-neutral-900 uppercase p-2 border-b border-yellow-500"
	>
		{title}
	</h2>

	<div class="flex flex-col overflow-y-scroll gap-1 p-2">
		{#each words as word, index}
			<RenderWord bind:word />
		{/each}
	</div>

	<div class="w-full p-1">
		<button
			class="p-2 rounded-md w-full text-green-400 border-2 border-green-400 hover:bg-green-400 hover:text-white"
			>Practice</button
		>
	</div>
</div>
