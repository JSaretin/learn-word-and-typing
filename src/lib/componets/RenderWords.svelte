<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let title: string;
	export let currentWord: string;
	export let words: string[];

	const emiter = createEventDispatcher();
</script>

<div class="flex flex-col w-full">
	<h2
		class="text-2xl text-neutral-700 text-center font-bold bg-neutral-900 uppercase p-2 border-b border-yellow-500"
	>
		{title}
	</h2>

	<div class="flex flex-col overflow-y-scroll">
		{#each words as word, index}
			<button
				on:click={() => {
					emiter('selectword', word);
				}}
				class={'p-1 text-lg font-bold ' +
					(word === currentWord ? 'text-green-400' : 'text-neutral-400')}>{word}</button
			>
		{/each}
	</div>
</div>
