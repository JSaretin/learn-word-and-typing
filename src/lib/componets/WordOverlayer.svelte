<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let show = false;
	export let isReverse = false;
	const emiter = createEventDispatcher();
</script>

<div
	class={'fixed top-0  h-screen max-w-[300px] w-full z-[500] border border-neutral-800 bg-neutral-900 transition-transform ease-linear duration-200 ' +
		(isReverse
			? 'right-0 ' + (!show ? 'translate-x-full' : '')
			: 'left-0 ' + (!show ? '-translate-x-full' : ''))}
>
	<div class="h-full relative flex">
		<button
			on:click={() => {
				show = !show;
				if (show) emiter('show');
			}}
			class={' p-2 absolute z-[900] top-1/2 -translate-y-1/2 transition-transform ease-linear duration-200 w-14 aspect-square ' +
				(isReverse
					? 'left-0 rotate-180 ' + (show ? '' : '-translate-x-full')
					: 'right-0 ' + (!show ? 'translate-x-full' : ''))}
		>
			{#if show}
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
						d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					/>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					class="w-full h-full stroke-yellow-500"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					/>
				</svg>
			{/if}
		</button>
		<slot />
	</div>
</div>
