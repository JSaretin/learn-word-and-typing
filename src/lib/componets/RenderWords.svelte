<script lang="ts">
	import type { RawWordData, WordData } from '$lib/structure';
	import RenderWord from './RenderWord.svelte';

	let searchWord = '';

	export let searchIsActive: boolean;
	export let title: string;
	export let words: WordData[];
	let displayWords = words;

	const workerCode = URL.createObjectURL(
		new Blob(
			[
				`
					self.onmessage = function(e) {
						const { words, searchWord } = e.data;
						self.postMessage(words.filter((w) => {
							let toCheck = [w.word, ...w.meaning.antonyms, ...w.meaning.synonyms];

							for (const d of w.meaning.meanings) {
								if (typeof d === 'string') {
									toCheck = [d, ...toCheck];
								} else {
									toCheck = [d[1], ...toCheck];
									toCheck = [...d[2], ...toCheck];
									toCheck = [...d[3], ...toCheck];
								}
							}
							return toCheck.some((w) => w.includes(searchWord));
						}));
					};
				`
			],
			{ type: 'application/javascript' }
		)
	);

	const worker = new Worker(workerCode);

	worker.onmessage = (e) => {
		displayWords = e.data;
	};

	$: worker.postMessage({ words, searchWord });
</script>

<div class="flex flex-col w-full">
	<h2
		class="text-2xl text-neutral-700 text-center font-bold bg-neutral-900 uppercase p-2 border-b border-yellow-500"
	>
		{title}
	</h2>

	<div class="w-full p-1">
		<input
			bind:value={searchWord}
			on:click={() => {
				searchIsActive = true;
			}}
			on:blur={() => {
				searchIsActive = false;
			}}
			type="text"
			placeholder="search"
			class="p-2 text-white font-mono w-full rounded-md bg-neutral-600 border-none outline-none"
		/>
	</div>

	<div class="flex flex-1 flex-col overflow-y-scroll gap-1 p-2">
		{#each displayWords as word, index}
			<RenderWord bind:word />
		{/each}
	</div>
</div>
