<script lang="ts">
	import { words as defaultWords } from './words';
	import { page } from '$app/stores';
	import { onMount, setContext } from 'svelte';
	import WordMeaning from './WordMeaning.svelte';
	import { writable, type Writable } from 'svelte/store';
	import RenderTypedWord from '$lib/componets/RenderTypedWord.svelte';
	import RenderWords from '$lib/componets/RenderWords.svelte';
	import WordOverlayer from '$lib/componets/WordOverlayer.svelte';
	import type { WordData } from '$lib/structure';

	const allWords: Writable<WordData[]> = writable([]);
	const db: Writable<IDBDatabase> = writable();

	const words = defaultWords
		.map((value) => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

	let titleText = 'Boost your typing skill | Typin';

	let ongoingTypedWord = '';
	let timeRemaining = 0;
	let showMeaning = false;

	let word: WordData;
	let index = 0;
	let feedBackWord: (string | boolean)[] = [];

	const wLength = Number($page.url.searchParams.get('words') || 1);
	let targetWordPerMinute = Number($page.url.searchParams.get('target-wpm') || 170) / 60;
	const wordLength = wLength > 10 ? 10 : wLength;

	let interval: number;
	let started = false;
	let blockKey = true;

	let beforeNextStage = 0;

	let winSound: HTMLAudioElement;
	let wrongSound: HTMLAudioElement;

	let ctrlKeyDown = false;
	let showTypedWords = false;

	const findMeaning = async (pickedWord: WordData) => {
		if (!navigator.onLine) return;
		if (pickedWord.checked_meaning) return;
		const req = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${pickedWord.word}`);
		if (!req.ok) {
			pickedWord.meaning = { notFound: true };
			$allWords = [pickedWord, ...$allWords.filter((w) => w.word !== pickedWord.word)];
			return;
		}
		const res = await req.json();
		$allWords = $allWords.reduce((previousValues: WordData[], currentvalue: WordData) => {
			if (currentvalue.word === pickedWord.word) {
				currentvalue.meaning = res;
				currentvalue.checked_meaning = true;
				if (word.word === pickedWord.word) {
					word = { ...word, ...currentvalue };
				}
				updateData(currentvalue);
			}
			return [...previousValues, currentvalue];
		}, []);
	};

	setContext('findMeaning', findMeaning);

	function pickWord() {
		showMeaning = false;
		let pickedWord: string = '';
		if (index === words.length - 1) index = 0;
		pickedWord = words.slice(index, index + wordLength).join(' ');

		index += wordLength;
		selectWord(pickedWord);
	}

	async function selectWord(pickedWord: string) {
		let savedWord = await getData(pickedWord);
		if (savedWord === undefined) {
			savedWord = {
				checked_meaning: false,
				disliked: false,
				liked: false,
				meaning: {},
				word: pickedWord
			};
			word = savedWord;
			$allWords = [word, ...$allWords];
			findMeaning(word);

			feedBackWord = Array(pickedWord.length);
			timeRemaining = pickedWord.length / targetWordPerMinute;
			addData(word);
		}

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
				wrongSound.pause();
				wrongSound.currentTime = 0.2;
				wrongSound.play();
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
		for (const w of word.word) {
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
		if (ongoingTypedWord.length >= word.word.length) return;

		ongoingTypedWord = `${ongoingTypedWord}${key}`;

		countDownTimer();
		updateScore();

		if (ongoingTypedWord === word.word) {
			clearInterval(interval);
			winSound.pause();
			winSound.currentTime = 0.2;
			winSound.play();

			beforeNextStage += 2;
			if (beforeNextStage >= 100) {
				targetWordPerMinute += (10 * ((20 * targetWordPerMinute) / 100)) / 100;
				beforeNextStage = 0;
			}
			ongoingTypedWord = '';

			pickWord();
		}
	}

	async function getData(key: string): Promise<WordData | undefined> {
		let objectStore: IDBObjectStore = $db.transaction(['saveWords']).objectStore('saveWords');
		let request: IDBRequest<WordData> = objectStore.get(key);

		return new Promise((resolve, reject) => {
			request.onerror = function (event: Event): void {
				reject((event.target as IDBRequest).error);
			};

			request.onsuccess = function (event: Event): void {
				if (request.result) {
					resolve(request.result);
				} else {
					resolve(undefined);
				}
			};
		});
	}

	async function addData(data: WordData) {
		let transaction: IDBTransaction = $db.transaction(['saveWords'], 'readwrite');
		return new Promise((resolve, reject) => {
			transaction.oncomplete = function (event: Event): void {};
			transaction.onerror = function (event: Event): void {
				reject();
			};
			let objectStore: IDBObjectStore = transaction.objectStore('saveWords');
			let request: IDBRequest<IDBValidKey> = objectStore.put({ ...data, liked: false });

			request.onsuccess = function (event: Event): void {
				resolve(true);
			};
		});
	}

	async function fetchAllData(): Promise<WordData[]> {
		return new Promise((resolve, reject) => {
			const transaction = $db.transaction(['saveWords'], 'readonly');
			const objectStore = transaction.objectStore('saveWords');

			const allData: WordData[] = [];

			const request = objectStore.openCursor();

			request.onsuccess = (event: Event) => {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					allData.push(cursor.value);
					cursor.continue();
				} else {
					resolve(allData);
				}
			};

			request.onerror = (event: Event) => {
				console.error('Error opening cursor:', (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			};

			transaction.onerror = (event: Event) => {
				console.error('Error fetching all data:', (event.target as IDBTransaction).error);
				reject((event.target as IDBTransaction).error);
			};
		});
	}

	async function openDatabase() {
		let request: IDBOpenDBRequest = indexedDB.open('typinDatabase', 1);
		return new Promise((resolve, reject) => {
			request.onupgradeneeded = function (event: IDBVersionChangeEvent): void {
				$db = (event.target as IDBOpenDBRequest).result;
				if (!$db.objectStoreNames.contains('saveWords')) {
					let objectStore = $db.createObjectStore('saveWords', { keyPath: 'word' });
					objectStore.createIndex('checked_meaning', 'checked_meaning', { unique: false });
					objectStore.createIndex('liked', 'liked', { unique: false });
					objectStore.createIndex('disliked', 'disliked', { unique: false });
					objectStore.createIndex('meaning', 'meaning', { unique: false });
				}
			};

			request.onsuccess = function (event: Event): void {
				$db = (event.target as IDBOpenDBRequest).result;
				resolve($db);
			};

			request.onerror = function (event: Event): void {
				reject();
			};
		});
	}

	onMount(async () => {
		await openDatabase();
		pickWord();
		winSound = new Audio('/win.wav');
		wrongSound = new Audio('/wrong.wav');
		blockKey = false;
		$allWords = await fetchAllData();

		if (navigator.onLine) {
			setTimeout(async () => {
				await Promise.all(
					$allWords.filter((w) => !w.checked_meaning).map(async (w) => await findMeaning(w))
				);
			});
		}
	});

	async function updateData(data: WordData) {
		let objectStore: IDBObjectStore = $db
			.transaction(['saveWords'], 'readwrite')
			.objectStore('saveWords');
		let updateRequest: IDBRequest<IDBValidKey> = objectStore.put(data);
		updateRequest.onsuccess = function (event: Event): void {
			console.log('Data updated successfully!');
		};
		updateRequest.onerror = function (event: Event): void {
			console.log('Error updating data:', (event.target as IDBRequest).error);
		};
	}

	async function toggleLikeWord(toggleFor: WordData) {
		toggleFor.liked = !toggleFor.liked;
		if (toggleFor.word === word.word) {
			word = { ...word, ...toggleFor };
		}
		updateData(toggleFor);
		$allWords = $allWords.reduce((prevValue: WordData[], currentValue: WordData) => {
			if (currentValue.word === toggleFor.word) {
				currentValue = toggleFor;
			}
			return [...prevValue, currentValue];
		}, []);
	}

	setContext('toggleLikeWord', toggleLikeWord);
</script>

<svelte:head>
	<title>{titleText}</title>
</svelte:head>
<svelte:window on:keydown={handleKeyPressed} on:keyup={handleKeyReleased} />
<div
	class="p-4 w-full h-screen flex justify-center align-middle place-items-center bg-neutral-800 text-neutral-500 overflow-y-scroll"
>
	{#if word === undefined}
		loading
	{:else}
		<WordOverlayer bind:show={showTypedWords} isReverse={true}>
			<RenderWords title="Seen Words" words={$allWords} />
		</WordOverlayer>

		<div class="relative">
			<div class="absolute top-0 left-0 -translate-y-full w-full flex justify-center align-middle">
				<span class="text-2xl bg-neutral-600 text-neutral-800 px-6 py-2 rounded-md"
					>{timeRemaining.toFixed(1)}s</span
				>
			</div>

			<RenderTypedWord
				{word}
				bind:feedBackWord
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

		<div class="bg-neutral-900 fixed bottom-0 left-0 w-full overflow-hidden">
			<div class="p-2 bg-green-500 rounded-r-full" style:width={`${beforeNextStage}%`} />
		</div>
	{/if}
</div>
