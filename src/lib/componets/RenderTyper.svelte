<script lang="ts">
	import { words as defaultWords } from '$lib/dictionary';
	import { page } from '$app/stores';
	import { onMount, setContext } from 'svelte';
	import WordMeaning from './WordMeaning.svelte';
	import { writable, type Writable } from 'svelte/store';
	import RenderTypedWord from '$lib/componets/RenderTypedWord.svelte';
	import RenderWords from '$lib/componets/RenderWords.svelte';
	import WordOverlayer from '$lib/componets/WordOverlayer.svelte';
	import type { RawWordData, WordData } from '$lib/structure';

	const words: Writable<RawWordData[]> = writable();
	const seenWords: Writable<WordData[]> = writable([]);

	const db: Writable<IDBDatabase> = writable();

	let targetCharacters: string = '';
	let practiceSeenWords: boolean;

	let searchIsActive: boolean;

	let titleText = 'Boost your typing skill | Typin';

	let ongoingTypedWord = '';
	let timeRemaining = 0;

	let word: WordData;
	let index = 0;

	let targetWordPerMinute = Number($page.url.searchParams.get('target-wpm') || 170) / 60;

	let beforeNextStage = 0;

	let showTypedWords = false;

	let showSettings: boolean;
	let settingCharacters: boolean;

	async function selectWord(pickedWord: RawWordData) {
		word = await getOrSaveWord(pickedWord);
		$seenWords = [word, ...$seenWords.filter((w) => w.word !== pickedWord.word)];
		$words = [pickedWord, ...$words.filter((w) => w.word !== pickedWord.word)];
		timeRemaining = pickedWord.word.length / targetWordPerMinute;
	}

	function pickWord() {
		if (index >= $words.length - 1) index = 0;
		let pickedWord = $words[index];
		index++;
		selectWord(pickedWord);
	}

	function handleError() {
		if (beforeNextStage > 0) beforeNextStage -= 2;
		pickWord();
	}

	function handleWin() {
		beforeNextStage += 2;
		if (beforeNextStage >= 100) {
			targetWordPerMinute += (10 * ((20 * targetWordPerMinute) / 100)) / 100;
			beforeNextStage = 0;
		}
		pickWord();
	}

	function filterWords() {
		$words = (practiceSeenWords ? $seenWords.map((w) => ({ ...w, ...w.meaning })) : defaultWords)
			.filter((w) => {
				if (!Boolean(targetCharacters)) return true;
				for (const cw of targetCharacters) {
					if (!w.word.includes(cw)) return false;
				}
				return true;
			})
			.map((value) => ({ value, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ value }) => value);
	}

	function saveTargetCharacters() {
		localStorage.setItem('targetCharacters', targetCharacters);
		filterWords();
		pickWord();
	}

	function savePracticeSeenWords() {
		localStorage.setItem('practiceSeenWords', practiceSeenWords ? '1' : '');
		filterWords();
		pickWord();
	}

	async function getOrSaveWord(pickedWord: RawWordData) {
		let savedWord = await getData(pickedWord.word);
		if (savedWord !== undefined) return savedWord;

		let tempWord = {
			checked_meaning: true,
			disliked: false,
			liked: false,
			meaning: pickedWord,
			word: pickedWord.word
		};
		addData(tempWord);
		return tempWord;
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
		await updateData(toggleFor);
		$seenWords = $seenWords.reduce((prevValue: WordData[], currentValue: WordData) => {
			if (currentValue.word === toggleFor.word) {
				currentValue = toggleFor;
			}
			return [...prevValue, currentValue];
		}, []);
	}

	setContext('toggleLikeWord', toggleLikeWord);

	onMount(async () => {
		targetCharacters = localStorage.getItem('targetCharacters') || '';
		practiceSeenWords = Boolean(localStorage.getItem('practiceSeenWords') || '');

		await openDatabase();
		$seenWords = await fetchAllData();

		filterWords();
		pickWord();
	});
</script>

<svelte:head>
	<title>{titleText}</title>
</svelte:head>

{#if showSettings}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		on:click|self={() => {
			settingCharacters = false;
			showSettings = false;
		}}
		class="fixed inset-0 z-[105] bg-neutral-800 bg-opacity-80 backdrop-blur-sm flex justify-center align-middle place-items-center p-4"
	>
		<div class="max-w-lg w-full rounded-md p-4">
			<div class="flex flex-col gap-2">
				<div class="flex justify-between">
					Target characters
					<span class="p-1 text-white bg-neutral-600 rounded-md font-mono">{$words.length}</span>
				</div>
				<input
					type="text"
					on:focus={() => (settingCharacters = true)}
					on:blur={() => (settingCharacters = false)}
					class="p-2 rounded-md bg-neutral-600 text-white font-mono"
					bind:value={targetCharacters}
					on:input={saveTargetCharacters}
				/>
				<label class="flex justify-between">
					typed words
					<input
						type="checkbox"
						bind:checked={practiceSeenWords}
						on:change={savePracticeSeenWords}
					/>
				</label>
			</div>
		</div>
	</div>
{/if}

{#if word === undefined}
	loading
{:else}
	<div class="absolute top-4 left-4">
		<button
			on:click={() => {
				showSettings = true;
			}}>Setting</button
		>
	</div>

	<WordOverlayer bind:show={showTypedWords} isReverse={true}>
		<RenderWords title="Seen Words" words={$seenWords} bind:searchIsActive />
	</WordOverlayer>

	<div class="relative">
		<div class="absolute top-0 left-0 -translate-y-full w-full flex justify-center align-middle">
			<span class="text-2xl bg-neutral-600 text-neutral-800 px-6 py-2 rounded-md"
				>{timeRemaining.toFixed(1)}s</span
			>
		</div>

		<h1 class="font-bold text-4xl lg:text-8xl relative">
			<RenderTypedWord
				word={word.word}
				liked={word.liked}
				bind:timeRemaining
				bind:typedWord={ongoingTypedWord}
				paused={searchIsActive || settingCharacters}
				on:click={() => {
					toggleLikeWord(word);
				}}
				on:error={handleError}
				on:won={handleWin}
			/>
		</h1>

		<div class="absolute bottom-0 left-0 w-full translate-y-full pt-6">
			<WordMeaning bind:word />
		</div>
	</div>

	<div class="bg-neutral-900 fixed bottom-0 left-0 w-full overflow-hidden">
		<div class="p-2 bg-green-500 rounded-r-full" style:width={`${beforeNextStage}%`} />
	</div>
{/if}
