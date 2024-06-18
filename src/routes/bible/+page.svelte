<script lang="ts">
	import { onMount } from 'svelte';
	import RenderTypedWord from '$lib/componets/RenderTypedWord.svelte';
	import { json } from '@sveltejs/kit';

	let words: {
		book_name: string;
		book: number;
		chapter: number;
		verse: number;
		text: string;
	}[] = [];

	let word: {
		book_name: string;
		book: number;
		chapter: number;
		verse: number;
		text: string;
	};

	let typedWord = '';
	let index = 0;
	let targetWordPerMinute = 170 / 60;
	let timeRemaining = 0;

	function pickWord() {
		if (index >= words.length - 1) index = 0;
		let pickedWord = words[index];
		index++;
		word = pickedWord;
		timeRemaining = pickedWord.text.length / targetWordPerMinute;
	}

	onMount(async () => {
		const req = await fetch('/kjv.json');
		words = ((await req.json()).results as any[])
			.map((value) => ({ value, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ value }) => value);
		pickWord();
	});
</script>

<div class="max-w-3xl w-full">
	<div class="mb-4">
		<span class="text-xl bg-neutral-600 text-neutral-800 p-2 rounded-md"
			>{timeRemaining.toFixed(1)}s</span
		>
	</div>
	<div class="w-full font-medium text-2xl leading-relaxed relative">
		{#if word !== undefined}
			<RenderTypedWord
				word={word.text}
				liked={false}
				bind:timeRemaining
				bind:typedWord
				on:error={pickWord}
				on:won={pickWord}
			/>

			<div class="mt-4">
				{word.book_name}
				{word.chapter}:{word.verse}
			</div>
		{/if}
	</div>
</div>
