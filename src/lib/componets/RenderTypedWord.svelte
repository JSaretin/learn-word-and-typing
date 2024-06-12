<script lang="ts">
	import Liker from './Liker.svelte';
	import RenderCharacter from './RenderCharacter.svelte';
	import type { Writable } from 'svelte/store';
	import { createEventDispatcher, getContext } from 'svelte';

	const winSound: Writable<HTMLAudioElement> = getContext('winSound')
	const wrongSound: Writable<HTMLAudioElement> = getContext('wrongSound')
	
	export let word: string;
	export let typedWord: string;
	export let liked: boolean = false
	export let timeRemaining = 0;
	export let paused = false;

	let started: boolean = false;
	let interval: number;


	const emiter = createEventDispatcher()

	function emitEvent(event: string){
		started = false;
		typedWord = '';
		timeRemaining = 0;
		emiter(event)
	}


	function updateTimer() {
		if (started) return;
		started = true;

		interval = setInterval(async () => {
			if (typedWord.length == 0) return;
		
			const tempTime = (timeRemaining -= 0.1);
			if (tempTime > 0) {
				timeRemaining = tempTime;
				return
			}


			$wrongSound.pause();
			$wrongSound.currentTime = 0.2;
			$wrongSound.play();
			

			// pickWord();
			emitEvent('error')

		}, 100);
	}

	async function handleKeyPressed(
		event: KeyboardEvent & {
			currentTarget: EventTarget & Window;
		}
	) {
		if (paused) return;
		if (!Boolean(word)) return;

		const key = event.key;
		if (typedWord.length >= word.length) return;
		typedWord = `${typedWord}${key}`;

		updateTimer();

		if (typedWord === word) {
			clearInterval(interval);
			$winSound.pause();
			$winSound.currentTime = 0.2;
			$winSound.play();

			
			emitEvent('won')
			// pickWord();
		}
	}

	function deleteLetter(
		event: KeyboardEvent & {
			currentTarget: EventTarget & Window;
		}
	) {
		const key = event.key;
		const typedWordLength = typedWord.length;
		if (key.length > 1 && key === 'Backspace' && typedWordLength > 0) {
			event.preventDefault();
			typedWord = typedWord.slice(0, typedWordLength - 1);
			updateTimer()
		}
	}
</script>

<svelte:window on:keydown={deleteLetter} on:keypress={handleKeyPressed} />

<span class="">
	<button class="absolute top-0 right-0 w-10 h-10 translate-x-10 outline-none" on:click>
		<Liker liked={liked} />
	</button>
	{#each word as w, _}
	<RenderCharacter character={w}
	typedCharacter={typedWord[_]}/>
	{/each}
</span>

