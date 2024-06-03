<script lang="ts">
	import { browser } from '$app/environment';
	import RenderSite from './RenderSite.svelte';
</script>

{#if browser}
	<RenderSite />
{:else}
	loading
{/if}
