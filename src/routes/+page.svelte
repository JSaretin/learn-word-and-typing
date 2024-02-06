<script lang="ts">
	import { words as defaultWords } from './words';
	import { page } from '$app/stores';
	import { onMount, setContext } from 'svelte';
	import WordMeaning from './WordMeaning.svelte';
	import { writable, type Writable } from 'svelte/store';

	const wordsMeaning: Writable<{
		[key: string]: any;
	}> = writable({});
	setContext('wordsMeaning', wordsMeaning);

	const words = defaultWords
		.map((value) => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

	let typedWord = '';
	let timeRemaining = 0;
	let showMeaning = false;

	let word = '';
	let index = 0;
	let feedBackWord: (string | boolean)[] = [];

	const wLength = Number($page.url.searchParams.get('words') || 1);
	const isUpper = $page.url.searchParams.get('is-upper') === 'true';
	let targetWordPerMinute = Number($page.url.searchParams.get('target-wpm') || 170) / 60;
	let isNonsence = $page.url.searchParams.get('is-nonsense') === 'true';
	const wordLength = wLength > 10 ? 10 : wLength;

	let interval: number;
	let started = false;
	let blockKey = true;

	let beforeNextStage = 0;

	let winSound: HTMLAudioElement;
	let wrongSound: HTMLAudioElement;
	let displayWord: HTMLDivElement;

	const chars = 'abcdefghijklmnopqrstuvwxyz';

	const findMeaning = async (pickedWord: string) => {
		const savedMeaning = $wordsMeaning[word];
		if (savedMeaning !== undefined) return;
		const req = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${pickedWord}`);
		if (!req.ok) {
			$wordsMeaning[word] = { notFound: true };
			return;
		}
		const res = await req.json();
		$wordsMeaning[word] = res;
	};

	function pickWord() {
		showMeaning = false;
		let pickedWord: string = '';
		if (isNonsence) {
			const wordLength = Number((Math.random() * 10 + 3).toFixed());

			pickedWord = Array(wordLength)
				.fill(null)
				.map(() => {
					return chars[Number((Math.random() * chars.length + 1).toFixed())];
				})
				.join('');
		} else {
			if (index === words.length - 1) {
				index = 0;
			}
			pickedWord = words.slice(index, index + wordLength).join(' ');

			setTimeout(async () => await findMeaning(pickedWord));

			index += wordLength;
		}

		feedBackWord = Array(pickedWord.length);
		timeRemaining = pickedWord.length / targetWordPerMinute;
		word = isUpper ? pickedWord.toUpperCase() : pickedWord;
		started = false;
		// if (displayWord !== undefined) {
		// 	displayWord.click();
		// }
		showMeaning = true;
	}

	function countDownTimer() {
		if (!started) {
			started = true;
			interval = setInterval(async () => {
				const tempTime = (timeRemaining -= 0.1);
				if (tempTime <= 0) {
					if (beforeNextStage > 0) {
						beforeNextStage -= 2;
					}
					blockKey = true;
					setTimeout(() => {
						wrongSound.pause();
						wrongSound.currentTime = 0;
						wrongSound.play();
					});
					typedWord = '';
					timeRemaining = 0;

					clearInterval(interval);
					pickWord();
					return;
				}
				timeRemaining = tempTime;

				setTimeout(() => {
					blockKey = false;
				}, 1000);
			}, 100);
		}
	}

	function updateScore() {
		let i = 0;
		for (const w of word) {
			const currentIndex = i;

			const tWord = typedWord[currentIndex];
			i++;

			if (tWord === w) {
				feedBackWord[currentIndex] = true;
				continue;
			}

			if (tWord !== w && tWord !== undefined) {
				feedBackWord[currentIndex] = false;
				continue;
			}

			feedBackWord[currentIndex] = '';
		}
	}

	async function handleKeyPressed(
		event: KeyboardEvent & {
			currentTarget: EventTarget & Window;
		}
	) {
		if (!Boolean(word)) return;
		const key = event.key;
		if (key.length > 1) {
			if (key === 'Backspace') {
				typedWord = typedWord.slice(0, -1);
				if (typedWord === '') {
					started = false;
					clearInterval(interval);
				}
				updateScore();
			}
			return;
		}

		if (blockKey) return;
		if (typedWord.length >= word.length) return;

		typedWord = `${typedWord}${key}`;

		countDownTimer();
		updateScore();

		if (typedWord === word) {
			clearInterval(interval);

			setTimeout(() => {
				winSound.pause();
				winSound.currentTime = 0;
				winSound.play();
			});

			beforeNextStage += 2;
			if (beforeNextStage >= 100) {
				targetWordPerMinute += (10 * ((20 * targetWordPerMinute) / 100)) / 100;
				beforeNextStage = 0;
			}
			typedWord = '';
			pickWord();
		}
	}

	let likeWords: { [key: string]: boolean } = {};

	onMount(async () => {
		setTimeout(pickWord);
		winSound = new Audio('/win.wav');
		wrongSound = new Audio('/wrong.wav');
		blockKey = false;
	});
</script>

<svelte:window on:keydown|preventDefault={handleKeyPressed} />

<div
	class="p-4 w-full h-screen flex justify-center align-middle place-items-center bg-neutral-800 text-neutral-500 overflow-y-scroll"
>
	<div class="fixed top-0 left-0 bg-neutral-900 font-mono text-2xl p-6 rounded-md">
		{(targetWordPerMinute * 60).toFixed(0)}CPM
	</div>

	<button class={'fixed top-0 right-0 px-4 py-1 bg-neutral-700 rounded-md text-neutral-900 '}>
		like words
	</button>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-mouse-events-have-key-events -->
	<div bind:this={displayWord} class="relative">
		<div class="absolute top-0 left-0 -translate-y-full w-full flex justify-center align-middle">
			<span class="text-2xl bg-neutral-600 text-neutral-800 px-6 py-2 rounded-md"
				>{timeRemaining.toFixed(1)}s</span
			>
		</div>
		<h1 class="font-bold text-4xl lg:text-9xl relative">
			<button
				class={'absolute top-0 right-0 w-6 h-6 rounded-full border-2 border-orange-400 translate-x-10 outline-none ' +
					(likeWords[word] ? 'bg-orange-400' : '')}
				on:click={() => {
					likeWords[word] = !likeWords[word];
				}}
			/>
			{#each word as w, _}
				{#if w === ' '}
					<span
						class={feedBackWord[_] === true ? '' : feedBackWord[_] === false ? 'bg-red-900' : ''}
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

		{#if showMeaning}
			<div class="absolute bottom-0 left-0 w-full translate-y-full pt-6">
				<WordMeaning {word} />
			</div>
		{/if}
	</div>
</div>

<div
	class="bg-neutral-900 placeholder-green-700 fixed bottom-0 left-0 w-full rounded-full overflow-hidden"
>
	<div class="p-4 bg-neutral-700 rounded-r-full" style:width={`${beforeNextStage}%`} />
</div>
