<script lang="ts">

	export let character: string;
	export let typedCharacter: string;
</script>

<span
			class={' ' +
				(typedCharacter === undefined
					? 'text-neutral-300'
					: typedCharacter === character
						? 'text-green-300'
						: character === ' '
							? 'bg-red-300'
							: 'text-red-300')}>{character}</span
		>