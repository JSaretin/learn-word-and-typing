<script lang="ts">
	import { getContext } from 'svelte';
	import Say from './Say.svelte';
	import type { RawWordData, WordData } from '$lib/structure';

	export let word: WordData & { meaning: RawWordData };
</script>

<div
	class="max-w-[400px] w-full max-h-[250px] h-fit overflow-y-scroll bg-neutral-600 p-4 rounded-xl mx-auto bg-opacity-70 backdrop-blur-sm no-scrollbar"
>
	<div class="flex flex-col gap-1 text-neutral-400">
		{#each word.meaning.meanings as meaning, _}
			<!-- {JSON.stringify(meaning)} -->
			<div class="border-b py-2 border-neutral-500 last:border-0">
				<span
					class="text-xs font-bold border border-neutral-500 p-1 px-2 rounded-md w-fit text-white"
					>{meaning[0]}</span
				>
				{#if typeof meaning[1] === 'string'}
					{meaning[1]}
				{:else}
					{#each meaning[1] as defination, _}
						{defination}
					{/each}
				{/if}

				{#if meaning[3].length > 0}
					<div class="flex mt-2 flex-col flex-wrap">
						{#each meaning[3] as example, _}
							<p class="text-sm font-medium text-neutral-300 italic">"{example}"</p>
						{/each}
					</div>
				{/if}
			</div>
			<!-- {#if meaning[2].length > 0}
					<div class="flex gap-2 mt-3 flex-wrap">
						{#each meaning[2] as synonym, _}
							<span class="bg-green-500 text-sm font-medium text-white p-1 rounded-md"
								>{synonym}</span
							>
						{/each}
					</div>
				{/if} -->
			<div class="flex gap-2 flex-wrap">
				{#each word.meaning.synonyms as synonym, _}
					<span class="bg-green-500 text-sm font-medium text-white p-1 rounded-md">{synonym}</span>
				{/each}
				{#each word.meaning.antonyms as antonym, _}
					<span class="bg-red-500 text-sm font-medium text-white p-1 rounded-md">{antonym}</span>
				{/each}
			</div>
		{/each}
	</div>
</div>
