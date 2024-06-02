<script lang="ts">
	import Liker from './Liker.svelte';
	import type { WordData } from '$lib/structure';

	export let word: WordData;
	export let feedBackWord: (string | boolean)[] = [];
</script>

<h1 class="font-bold text-4xl lg:text-9xl relative">
	<button class="absolute top-0 right-0 w-10 h-10 translate-x-10 outline-none" on:click>
		<Liker liked={word.liked} />
	</button>
	{#each word.word as w, _}
		{#if w === ' '}
			<span class={feedBackWord[_] === true ? '' : feedBackWord[_] === false ? 'bg-red-900' : ''}
				>{w}</span
			>
		{:else}
			<span
				class={feedBackWord[_] === true
					? 'text-green-300'
					: feedBackWord[_] === false
						? 'text-red-400'
						: ''}>{w}</span
			>
		{/if}
	{/each}
</h1>
