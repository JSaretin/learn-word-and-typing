<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Say from './Say.svelte';

	export let word: string;

	const wordsMeaning: Writable<{
		[key: string]: any;
	}> = getContext('wordsMeaning');
</script>

<div
	class="w-[400px] max-h-[250px] h-fit overflow-y-scroll bg-neutral-600 p-2 rounded-xl mx-auto bg-opacity-70 backdrop-blur-sm no-scrollbar"
>
	<Say {word} />
	{#if $wordsMeaning[word] === undefined}
		<div class="w-full h-full flex justify-center align-middle place-items-center">
			<span class="italic text-neutral-500"> loading.... </span>
		</div>
	{:else if Boolean($wordsMeaning[word]?.notFound)}
		<div class="w-full h-full flex justify-center align-middle place-items-center">
			<span class="italic text-neutral-500"> not found </span>
		</div>
	{:else}
		<div class="flex flex-col gap-1 text-neutral-400">
			{#each $wordsMeaning[word] as meaning, _}
				{#if meaning?.phonetic !== undefined}
					<div
						class="flex align-middle place-items-center gap-4 bg-neutral-600 rounded-md p-1 text-blue-400 font-bold w-fit"
					>
						{meaning.phonetic}
						{#each meaning.phonetics as phonetic}
							{#if phonetic.audio !== undefined && phonetic.audio !== ''}
								<button
									on:click={() => {
										// const audio = new SpeechSynthesisUtterance(word);
										// window.speechSynthesis.speak(audio);
										new Audio(phonetic.audio).play();
									}}
									><svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										class="w-6 h-6 fill-gray-200"
									>
										<path
											d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z"
										/>
										<path
											d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z"
										/>
									</svg>
								</button>
							{/if}
						{/each}
					</div>
				{/if}
				<!-- {JSON.stringify(meaning)} -->
				{#each meaning.meanings as singleMeaning, _}
					{#each singleMeaning.definitions as definition, _}
						<div class="p-2 bg-neutral-600 rounded-xl">
							<!-- {JSON.stringify(definition)} -->
							<p class="">{definition.definition}</p>
							{#if definition.synonyms.length > 0 || definition.antonyms.length > 0}
								<div class="border-t border-neutral-500 mt-1 pt-2 flex gap-2 flex-wrap">
									{#each definition.synonyms as synonym, _}
										<span class="bg-green-400 rounded-md p-1 text-white">
											{synonym}
										</span>
									{/each}
									{#each definition.antonyms as antonym, _}
										<span class="bg-red-400 rounded-md p-1 text-white">
											{antonym}
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
