<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	export let word: string;

	const wordsMeaning: Writable<{
		[key: string]: any;
	}> = getContext('wordsMeaning');
</script>

<div
	class="w-[400px] max-h-[250px] h-fit overflow-y-scroll bg-neutral-600 p-2 rounded-xl mx-auto bg-opacity-70 backdrop-blur-sm no-scrollbar"
>
	{#if $wordsMeaning[word] === undefined}
		<div class="w-full h-full flex justify-center align-middle place-items-center">
			<span class="italic text-neutral-500"> loading.... </span>
		</div>
	{:else if Boolean($wordsMeaning[word]?.notFound)}
		<div class="w-full h-full flex justify-center align-middle place-items-center">
			<span class="italic text-neutral-500"> not found </span>
		</div>
	{:else}
		<div class="flex flex-col gap-2 text-neutral-400">
			{#each $wordsMeaning[word] as meaning, _}
				{#each meaning.meanings as singleMeaning, _}
					{#each singleMeaning.definitions as definition, _}
						<div class="p-4 bg-neutral-600 rounded-xl">
                            <!-- {JSON.stringify(definition)} -->
							<p class="">{definition.definition}</p>
							{#if definition.synonyms.length > 0}
								<div class="mt-2 flex gap-2 flex-wrap">
									{#each definition.synonyms as synonym, _}
										<span class="bg-neutral-800 rounded-md p-1 text-neutral-400">
											{synonym}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				{/each}
			{/each}
		</div>
	{/if}
</div>
