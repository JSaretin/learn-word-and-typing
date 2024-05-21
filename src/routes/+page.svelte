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
		electAword(pickedWord);
	}

	function electAword(pickedWord: string) {
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
	let ctrlKeyDown = false;

	async function handleKeyReleased(
		event: KeyboardEvent & {
			currentTarget: EventTarget & Window;
		}
	) {
		if (event.ctrlKey) {
			ctrlKeyDown = false;
		}
	}

	async function handleKeyPressed(
		event: KeyboardEvent & {
			currentTarget: EventTarget & Window;
		}
	) {
		if (event.ctrlKey) {
			ctrlKeyDown = true;
		}
		if (ctrlKeyDown) {
			return true;
			event.preventDefault();
		}

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
		likeWords = JSON.parse(localStorage.getItem('likedWords') || '{}');

		setTimeout(pickWord);
		winSound = new Audio('/win.wav');
		wrongSound = new Audio('/wrong.wav');
		blockKey = false;
	});

	function toggleLikeWord(word: string) {
		likeWords[word] = !likeWords[word];
		localStorage.setItem('likedWords', JSON.stringify(likeWords));
	}

	let showLikedWords = false;
</script>

<svelte:window on:keydown={handleKeyPressed} on:keyup={handleKeyReleased} />

<div
	class={'fixed top-0 right-0 flex h-screen max-w-[300px] w-full z-[500] border border-neutral-800 bg-neutral-900 transition-transform ease-linear duration-200 ' +
		(showLikedWords ? '' : 'translate-x-full')}
>
	<div class="h-full flex-1 relative">
		<button
			on:click={() => {
				showLikedWords = !showLikedWords;
			}}
			class={'p-2 absolute left-0 top-1/2 -translate-y-1/2 transition-transform ease-linear duration-200 w-14 aspect-square ' +
				(showLikedWords ? '' : '-translate-x-full')}
		>
			{#if !showLikedWords}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke=""
					class="w-full h-full stroke-yellow-500"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					/>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-full h-full"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					/>
				</svg>
			{/if}
		</button>

		<h2
			class="text-2xl text-neutral-700 text-center font-bold bg-neutral-900 uppercase mb-6 p-2 border-b border-yellow-500"
		>
			Liked Words
		</h2>
		<div class="flex flex-col">
			{#each Object.keys(likeWords).reverse() as likeWord}
				{#if likeWords[likeWord]}
					<button
						on:click={() => {
							electAword(likeWord);
						}}
						class={' text-lg font-bold ' +
							(likeWord === word ? 'text-green-400' : 'text-neutral-400')}>{likeWord}</button
					>
				{/if}
			{/each}
		</div>
	</div>
</div>

<div
	class="p-4 w-full h-screen flex justify-center align-middle place-items-center bg-neutral-800 text-neutral-500 overflow-y-scroll"
>
	<div class="fixed top-0 left-0 bg-neutral-900 font-mono text-2xl p-6 rounded-md">
		{(targetWordPerMinute * 60).toFixed(0)}CPM
	</div>

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
				class="absolute top-0 right-0 w-10 h-10 translate-x-10 outline-none"
				on:click={() => {
					toggleLikeWord(word);
				}}
			>
				{#if !likeWords[word]}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="h-full w-full"
					>
						<path
							fill-rule="evenodd"
							d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						class="h-full w-full fill-yellow-400"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
						/>
					</svg>
				{/if}
			</button>
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
