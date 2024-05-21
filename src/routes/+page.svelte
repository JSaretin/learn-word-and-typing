<script lang="ts">
	import { words as defaultWords } from './words';
	import { page } from '$app/stores';
	import { onMount, setContext } from 'svelte';
	import WordMeaning from './WordMeaning.svelte';
	import { writable, type Writable } from 'svelte/store';
	import RenderTypedWord from '$lib/componets/RenderTypedWord.svelte';
	import RenderWords from '$lib/componets/RenderWords.svelte';
	import WordOverlayer from '$lib/componets/WordOverlayer.svelte';

	const wordsMeaning: Writable<{
		[key: string]: any;
	}> = writable({});
	setContext('wordsMeaning', wordsMeaning);

	const words = defaultWords
		.map((value) => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

	let titleText = 'Boost your typing skill | Typin';

	let ongoingTypedWord = '';
	let timeRemaining = 0;
	let showMeaning = false;
	let typedWords: string[] = [];

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

	let ctrlKeyDown = false;
	let likeWords: { [key: string]: boolean } = {};
	let showLikedWords = false;
	let showTypedWords = false;

	$: mainlikeWords = Object.keys(likeWords)
		.filter((w) => likeWords[w])
		.reverse();

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
		titleText = word = isUpper ? pickedWord.toUpperCase() : pickedWord;
		started = false;
		showMeaning = true;
	}

	function countDownTimer() {
		if (started) return;
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
				ongoingTypedWord = '';
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

	function updateScore() {
		let i = 0;
		for (const w of word) {
			const currentIndex = i;

			const tWord = ongoingTypedWord[currentIndex];
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
		}

		event.preventDefault();

		if (!Boolean(word)) return;

		const key = event.key;
		if (key.length > 1) {
			if (key === 'Backspace') {
				ongoingTypedWord = ongoingTypedWord.slice(0, -1);
				if (ongoingTypedWord === '') {
					started = false;
					clearInterval(interval);
				}
				updateScore();
			}
			return;
		}

		if (blockKey) return;
		if (ongoingTypedWord.length >= word.length) return;

		ongoingTypedWord = `${ongoingTypedWord}${key}`;

		countDownTimer();
		updateScore();

		if (ongoingTypedWord === word) {
			clearInterval(interval);
			winSound.pause();
			winSound.currentTime = 0.2;
			winSound.play();
			typedWords = [word, ...typedWords.filter((w) => w !== word)];

			beforeNextStage += 2;
			if (beforeNextStage >= 100) {
				targetWordPerMinute += (10 * ((20 * targetWordPerMinute) / 100)) / 100;
				beforeNextStage = 0;
			}
			ongoingTypedWord = '';

			pickWord();
		}
	}

	onMount(async () => {
		pickWord();
		likeWords = JSON.parse(localStorage.getItem('likedWords') || '{}');
		winSound = new Audio('/win.wav');
		wrongSound = new Audio('/wrong.wav');
		blockKey = false;
	});

	function toggleLikeWord(word: string) {
		const liked = !likeWords[word];
		if (liked) likeWords[word] = liked;
		else delete likeWords[word];
		likeWords = likeWords;

		localStorage.setItem('likedWords', JSON.stringify(likeWords));
	}

	let oldWord: string;
	function changeCurrentWord(newWord: string) {
		if (newWord === word) {
			return electAword(oldWord);
		}
		oldWord = word;
		return electAword(newWord);
	}
</script>

<svelte:head>
	<title>{titleText}</title>
</svelte:head>
<svelte:window on:keydown={handleKeyPressed} on:keyup={handleKeyReleased} />

<WordOverlayer
	bind:show={showTypedWords}
	on:show={() => {
		showLikedWords = false;
	}}
>
	<RenderWords
		title="Typed Words"
		bind:words={typedWords}
		bind:currentWord={word}
		on:selectword={(e) => changeCurrentWord(e.detail)}
	/>
</WordOverlayer>

<WordOverlayer
	isReverse={true}
	bind:show={showLikedWords}
	on:show={() => {
		showTypedWords = false;
	}}
>
	<RenderWords
		title="Liked Words"
		bind:words={mainlikeWords}
		bind:currentWord={word}
		on:selectword={(e) => changeCurrentWord(e.detail)}
	/>
</WordOverlayer>

<div
	class="p-4 w-full h-screen flex justify-center align-middle place-items-center bg-neutral-800 text-neutral-500 overflow-y-scroll"
>
	<!-- <div class="fixed top-0 left-0 bg-neutral-900 font-mono text-2xl p-6 rounded-md">
		{(targetWordPerMinute * 60).toFixed(0)}CPM
	</div> -->

	<div bind:this={displayWord} class="relative">
		<div class="absolute top-0 left-0 -translate-y-full w-full flex justify-center align-middle">
			<span class="text-2xl bg-neutral-600 text-neutral-800 px-6 py-2 rounded-md"
				>{timeRemaining.toFixed(1)}s</span
			>
		</div>

		<RenderTypedWord
			bind:word
			bind:feedBackWord
			bind:liked={likeWords[word]}
			on:click={() => {
				toggleLikeWord(word);
			}}
		/>

		{#if showMeaning}
			<div class="absolute bottom-0 left-0 w-full translate-y-full pt-6">
				<WordMeaning {word} />
			</div>
		{/if}
	</div>
</div>

<div class="bg-neutral-900 fixed bottom-0 left-0 w-full overflow-hidden">
	<div class="p-2 bg-green-500 rounded-r-full" style:width={`${beforeNextStage}%`} />
</div>
