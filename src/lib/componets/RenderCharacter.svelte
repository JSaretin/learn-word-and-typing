<script lang="ts">
	export let character: string;
	export let typedCharacter: string;
</script>

<span
	class={' ' +
		(typedCharacter === undefined
			? 'text-neutral-400'
			: typedCharacter === character
				? 'text-green-400'
				: character === ' '
					? 'bg-red-400'
					: 'text-red-400')}>{character}</span
>
