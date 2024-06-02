<script lang="ts">
	import { getContext } from 'svelte';
	import WordMeaning from '../../routes/WordMeaning.svelte';
	import Liker from './Liker.svelte';
	import type { Writable } from 'svelte/store';
	import type { WordData } from '$lib/structure';
	export let word: WordData;

	let expand = false;

	const toggleLikeWord = getContext('toggleLikeWord') as (w: WordData) => void;
</script>

<div class="bg-neutral-600 w-full rounded-md">
	<div class="w-full flex justify-between">
		<button
			class="p-2 font-mono flex-1 w-full text-left text-lg text-neutral-200 font-medium"
			on:click={() => {
				expand = !expand;
			}}
		>
			{word.word}

			{#if word.checked_meaning}
				<span class="bg-green-700 text-white p-1 rounded-md text-xs">checked</span>
			{/if}
		</button>
		<button on:click={() => toggleLikeWord(word)} class="mr-2 w-6 text-gray-300">
			<Liker liked={word.liked} />
		</button>
	</div>

	{#if expand}
		<div class="">
			<WordMeaning {word} />
		</div>
	{/if}
</div>
