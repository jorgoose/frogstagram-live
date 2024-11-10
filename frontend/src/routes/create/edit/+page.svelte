<script lang="ts">
	import { onMount } from 'svelte';
	import { uploadedImage } from '../../../stores/uploadedImage';
	import { croppedImage } from '../../../stores/croppedImage';
	import { goto } from '$app/navigation';
	import Cropper from 'svelte-easy-crop';
	import Fa from 'svelte-fa';
	import { faExpand } from '@fortawesome/free-solid-svg-icons';

	let imageFile: File | null = null;
	let imageUrl: string | null = null;

	// Cropper state variables
	let crop = { x: 0, y: 0 };
	let zoom = 1;
	let aspect: number = 1; // Start with square aspect ratio
	let croppedAreaPixels: { x: number; y: number; width: number; height: number } | null = null;
	let showGrid = true;

	let isOriginal = false; // Toggle between square and original aspect ratio
	let imageAspectRatio: number | null = null;

	let objectFit = 'vertical-cover'; // Initial object fit mode

	onMount(() => {
		const unsubscribe = uploadedImage.subscribe((file) => {
			imageFile = file;
			if (imageFile) {
				imageUrl = URL.createObjectURL(imageFile);
				// Get the natural aspect ratio of the image
				const img = new Image();
				img.src = imageUrl;
				img.onload = () => {
					imageAspectRatio = img.width / img.height;
					// Adjust the initial zoom and crop
					if (!isOriginal) {
						zoom = 1;
						crop = { x: 0, y: 0 };
					}
				};
			} else {
				// If no image is available, redirect back to upload page
				goto('/upload');
			}
		});

		// Cleanup subscription on component unmount
		return () => {
			unsubscribe();
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}
		};
	});

	function onCropComplete(
		croppedArea: { x: number; y: number; width: number; height: number },
		croppedAreaPixelsParam: { x: number; y: number; width: number; height: number }
	) {
		croppedAreaPixels = croppedAreaPixelsParam;
	}

	function handleClear() {
		// Clear the store and redirect to the home page
		if (imageUrl) {
			URL.revokeObjectURL(imageUrl);
		}
		uploadedImage.set(null);
		goto('/');
	}

	async function handleDetails() {
		try {
			if (!croppedAreaPixels || !imageUrl) {
				console.error('No cropping data or image available');
				return;
			}

			// Generate the cropped image
			const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);

			if (!imageFile) {
				console.error('No image file available');
				return;
			}

			const croppedFile = new File([croppedBlob], imageFile.name, { type: imageFile.type });

			// Store the cropped version in the croppedImage store instead of uploadedImage
			croppedImage.set(croppedFile);
			// Don't modify uploadedImage - keep the original

			// Navigate to the details page
			await goto('/create/details');
		} catch (error) {
			console.error('Error processing image:', error);
		}
	}

	// Function to generate the cropped image Blob
	function getCroppedImg(
		imageSrc: string | null,
		pixelCrop: { x: number; y: number; width: number; height: number }
	) {
		return new Promise<Blob>((resolve, reject) => {
			if (!imageSrc) {
				reject(new Error('Image source is null'));
				return;
			}
			const image = new Image();
			image.crossOrigin = 'anonymous';
			image.src = imageSrc;
			image.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = pixelCrop.width;
				canvas.height = pixelCrop.height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				ctx.drawImage(
					image,
					pixelCrop.x,
					pixelCrop.y,
					pixelCrop.width,
					pixelCrop.height,
					0,
					0,
					pixelCrop.width,
					pixelCrop.height
				);

				canvas.toBlob((blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Canvas is empty'));
					}
				}, imageFile?.type || 'image/jpeg');
			};
			image.onerror = (error) => {
				reject(error);
			};
		});
	}

	function toggleAspectRatio() {
		isOriginal = !isOriginal;
		if (isOriginal && imageAspectRatio) {
			aspect = imageAspectRatio; // Original aspect ratio
			showGrid = false;
			objectFit = 'contain';
			// Reset crop and zoom
			crop = { x: 0, y: 0 };
			zoom = 1;
		} else {
			aspect = 1; // Square aspect ratio
			showGrid = true;
			objectFit = 'vertical-cover';
			// Set zoom to 1 to ensure image height fills crop area
			zoom = 1;
			// Reset crop
			crop = { x: 0, y: 0 };
		}
	}
</script>

<div class="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
	<!-- Top Bar -->
	<div
		class="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900"
	>
		<button
			on:click={handleClear}
			class="rounded-md p-2 text-xl text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
		>
			✕
		</button>
		<h2 class="text-lg font-semibold text-gray-900 dark:text-white">New Post</h2>
		<button
			on:click={handleDetails}
			class="rounded-md p-2 text-lg font-medium text-green-600 transition-all hover:bg-green-50 active:scale-95 dark:text-green-400 dark:hover:bg-green-900/20"
		>
			Next
		</button>
	</div>

	<!-- Image Cropping Area -->
	<div class="relative flex-1 bg-gray-900">
		{#if imageUrl}
			<div class="crop-container">
				<!-- Cropper Component -->
				<Cropper
					image={imageUrl}
					{crop}
					{zoom}
					{aspect}
					{showGrid}
					cropShape="rect"
					on:cropChange={(e) => (crop = e.detail)}
					on:zoomChange={(e) => (zoom = e.detail)}
					on:cropcomplete={(e) => onCropComplete(e.detail.percent, e.detail.pixels)}
				/>
				<!-- Aspect Ratio Toggle Button -->
				<button
					on:click={toggleAspectRatio}
					class="absolute bottom-4 left-4 z-10 rounded-full bg-black bg-opacity-50 p-2 transition-opacity hover:bg-opacity-70"
				>
					<Fa icon={faExpand} class="h-6 w-6 text-white" />
				</button>
			</div>
		{:else}
			<p class="mt-4 text-center text-gray-500 dark:text-gray-400">No image selected.</p>
		{/if}
	</div>
</div>

<style>
	/* Ensure the cropping area touches the bottom of the top navigation bar */
	.crop-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}

	/* Style for the cursor when buttons are interactive */
	button:not(:disabled) {
		cursor: pointer;
	}
</style>
