<script lang="ts">
	import { onMount } from 'svelte';
	import { uploadedImage } from '../../../stores/uploadedImage';
	import { croppedImage } from '../../../stores/croppedImage';
	import { goto } from '$app/navigation';

	let imageFile: File | null = null;
	let imageUrl: string | null = null;
	let caption: string = '';

	onMount(() => {
		const unsubscribe = croppedImage.subscribe((file) => {
			imageFile = file;
			if (imageFile) {
				imageUrl = URL.createObjectURL(imageFile);
			} else {
				goto('/create/edit');
			}
		});

		return () => {
			unsubscribe();
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}
		};
	});

	function handleShare() {
		if (!imageFile) return;
		uploadedImage.set(null);
		croppedImage.set(null);
		goto('/');
	}

	function handleBack() {
		croppedImage.set(null);
		goto('/create/edit');
	}
</script>

<div class="flex h-screen flex-col bg-white dark:bg-gray-800">
	<!-- Top Bar -->
	<div
		class="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900"
	>
		<button
			on:click={handleBack}
			class="rounded-md p-2 text-xl text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
		>
			←
		</button>
		<h2 class="text-lg font-semibold text-gray-900 dark:text-white">New Post</h2>
		<button
			on:click={handleShare}
			class="rounded-md p-2 text-lg font-medium text-green-600 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
		>
			Share
		</button>
	</div>

	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		{#if imageUrl}
			<div class="bg-gray-900 p-4">
				<div class="flex items-start gap-3">
					<!-- Profile Picture -->
					<img
						src="https://picsum.photos/seed/user1/40/40"
						alt="Profile"
						class="h-8 w-8 flex-shrink-0 rounded-full"
					/>

					<!-- Caption Textarea -->
					<textarea
						bind:value={caption}
						placeholder="Write a caption..."
						class="h-20 flex-1 resize-none border-none bg-transparent p-0 text-base text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-0 dark:placeholder:text-gray-400"
					></textarea>

					<!-- Cropped Preview -->
					<img
						src={imageUrl}
						alt="Cropped preview"
						class="h-14 w-14 flex-shrink-0 rounded-sm object-cover"
					/>
				</div>
			</div>
		{:else}
			<p class="mt-4 text-center text-gray-500 dark:text-gray-400">No image selected.</p>
		{/if}
	</div>
</div>
