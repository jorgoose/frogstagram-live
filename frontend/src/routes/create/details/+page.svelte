<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { v4 as uuidv4 } from 'uuid';
	import { croppedImage } from '../../../stores/croppedImage';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let imageFile: File | null = null;
	let imageUrl: string | null = null;
	let caption: string = '';
	let loading = writable(false);
	let analysisResult = writable<string | FrogAnalysis | null>(null);
	let uploadProgress = writable(0);
	let progressInterval: NodeJS.Timeout;
	let redirectCountdown = writable<number | null>(null);
	let redirectInterval: NodeJS.Timeout;

	const BUCKET = 'frogstagram-posts';

	// / Get user from page session
	type User = { username: string };
	$: username = ($page.data.session?.user as User)?.username;

	// Add interface at top of script
	interface FrogAnalysis {
		is_frog: boolean;
		confidence: number;
		details: {
			tree_frog: number;
			bullfrog: number;
			tailed_frog: number;
		};
	}

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
				clearInterval(redirectInterval);
			}
		};
	});

	function rapidlyCompleteProgress() {
		// Clear existing interval
		clearInterval(progressInterval);

		// Create new interval that moves much faster
		progressInterval = setInterval(() => {
			uploadProgress.update((p) => {
				if (p >= 100) {
					clearInterval(progressInterval);
					return 100;
				}
				return p + 4; // Move 4% each tick for quick completion
			});
		}, 10); // Run every 10ms
	}

	// Update getFrogConfidence function
	function getFrogConfidence(result: FrogAnalysis | string | null): number {
		if (!result) return 0.01;

		if (typeof result === 'string') {
			const confidence = parseFloat(result.split(': ')[1]);
			return isNaN(confidence) ? 0.01 : confidence;
		}

		return result.confidence;
	}

	async function handleShare() {
		if (!imageFile || $loading) return;

		loading.set(true);
		analysisResult.set(null);
		uploadProgress.set(0);

		const postId = uuidv4();
		const imageKey = `posts/${username}/${postId}/post_image.jpg`;
		const metadataKey = `metadata/${postId}/post.json`;

		try {
			// Upload image first
			const imageUrlResponse = await fetch('/api/s3-presigned-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					key: imageKey,
					contentType: imageFile.type
				})
			});
			const { url: imagePresignedUrl } = await imageUrlResponse.json();

			await fetch(imagePresignedUrl, {
				method: 'PUT',
				body: imageFile,
				headers: {
					'Content-Type': imageFile.type
				}
			});

			// Analyze image
			const response = await fetch('/create/details', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bucket: BUCKET,
					key: imageKey
				})
			});

			const analysisData: FrogAnalysis = await response.json();
			console.log('Analysis result:', analysisData);

			rapidlyCompleteProgress();

			// Set analysis result directly
			analysisResult.set(analysisData);

			if (analysisData.confidence >= 0.8) {
				// Create post metadata only if it's a frog
				const metadata = {
					post_id: postId,
					owner: username,
					image_path: imageKey,
					caption: caption,
					timestamp: new Date().toISOString(),
					likes: { count: 0, users: [] },
					comments: []
				};

				const metadataUrlResponse = await fetch('/api/s3-presigned-url', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						key: metadataKey,
						contentType: 'application/json'
					})
				});
				const { url: metadataPresignedUrl } = await metadataUrlResponse.json();

				await fetch(metadataPresignedUrl, {
					method: 'PUT',
					body: JSON.stringify(metadata),
					headers: {
						'Content-Type': 'application/json'
					}
				});
			} else {
				// Delete uploaded image if not a frog
				await fetch('/api/s3-delete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ key: imageKey })
				});
			}

			// Start redirect countdown
			redirectCountdown.set(5);
			redirectInterval = setInterval(() => {
				redirectCountdown.update((count) => {
					if (count === 1) {
						clearInterval(redirectInterval);
						goto('/');
						return 0;
					}
					return count !== null ? count - 1 : null;
				});
			}, 1000);
		} catch (error) {
			console.error(error);
			analysisResult.set('Error processing image');

			// Cleanup on error
			try {
				await fetch('/api/s3-delete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ key: imageKey })
				});
			} catch (cleanupError) {
				console.error('Failed to cleanup:', cleanupError);
			}
		} finally {
			clearInterval(progressInterval);
			loading.set(false);
		}
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
			>←</button
		>
		<h2 class="text-lg font-semibold text-gray-900 dark:text-white">New Post</h2>
		<button
			on:click={handleShare}
			class="rounded-md p-2 text-lg font-medium text-green-600 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
			disabled={$loading || $analysisResult !== null}
		>
			{#if $loading}
				Analyzing...
			{:else}
				Share
			{/if}
		</button>
	</div>

	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		{#if imageUrl}
			<div class="flex h-full flex-col bg-gray-900">
				<!-- Caption Entry Section -->
				<div class="border-b border-gray-800 p-4">
					<div class="flex items-start gap-3">
						<img
							src="https://picsum.photos/seed/{username}/64"
							alt="Profile"
							class="h-8 w-8 flex-shrink-0 rounded-full"
						/>
						<textarea
							bind:value={caption}
							placeholder="Write a caption..."
							class="h-20 flex-1 resize-none border-none bg-transparent p-0 text-base text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-0 dark:placeholder:text-gray-400"
						></textarea>
						<img
							src={imageUrl}
							alt="Cropped preview"
							class="h-14 w-14 flex-shrink-0 rounded-sm object-cover"
						/>
					</div>
				</div>

				<!-- Analysis Status Section -->
				<div class="flex flex-1 flex-col items-center justify-center p-4">
					{#if $loading}
						<div class="flex flex-col items-center space-y-6">
							<div class="relative h-20 w-20">
								<!-- Progress circle -->
								<svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full rotate-[-90deg]">
									<!-- Background circle -->
									<circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" stroke-width="8" />
									<!-- Progress circle -->
									<circle
										cx="50"
										cy="50"
										r="45"
										fill="none"
										stroke="#22c55e"
										stroke-width="8"
										stroke-dasharray="282.7"
										stroke-dashoffset={282.7 - (282.7 * $uploadProgress) / 100}
										class="transition-all duration-100 ease-linear"
									/>
								</svg>
								<!-- Bouncing frog -->
								<div class="absolute inset-0 flex items-center justify-center">
									<div class="animate-bounce text-3xl">🐸</div>
								</div>
							</div>
							<div class="space-y-2 text-center">
								{#if $uploadProgress < 80}
									<p class="text-lg font-medium text-green-400">Uploading your frog picture...</p>
								{:else if $uploadProgress < 100}
									<p class="text-lg font-medium text-green-400">Analyzing frog content...</p>
								{:else}
									<p class="text-lg font-medium text-green-400">Almost done!</p>
								{/if}
								<p class="text-sm text-gray-500">Only frog pictures are allowed on Frogstagram!</p>
							</div>
						</div>
					{:else if $analysisResult}
						<div class="flex flex-col items-center space-y-6">
							{#if ($analysisResult as FrogAnalysis).confidence >= 0.8}
								<div class="flex flex-col items-center space-y-4">
									<span class="text-6xl">🐸</span>
									<div class="flex flex-col items-center space-y-2">
										<p class="text-2xl font-medium text-green-400">Frog Detected!</p>
										<p class="text-lg text-gray-400">
											{Math.round(($analysisResult as FrogAnalysis).confidence * 100)}% Confidence
										</p>
										{#if $redirectCountdown}
											<p class="text-sm text-gray-400">Redirecting in {$redirectCountdown}...</p>
										{/if}
									</div>
								</div>
							{:else}
								<div class="flex flex-col items-center space-y-4">
									<span class="text-6xl">🚫</span>
									<div class="flex flex-col items-center space-y-2">
										<p class="text-2xl font-medium text-red-500">Not a Frog!</p>
										<p class="text-lg text-gray-400">
											{100 - Math.round(($analysisResult as FrogAnalysis).confidence * 100)}% Sure
											It's Something Else
										</p>
									</div>
									<div class="space-y-2 text-center">
										<p class="text-sm font-medium text-red-400">
											Our frog detector has rejected your image!
										</p>
										<p class="text-sm text-gray-500">
											⚠️ Frogstagram is strictly for frogs - no exceptions! 🐸
										</p>
									</div>
									{#if $redirectCountdown}
										<p class="text-sm text-gray-400">Redirecting in {$redirectCountdown}...</p>
									{/if}
								</div>
							{/if}
						</div>
					{:else}
						<div class="flex flex-col items-center space-y-4">
							<div class="flex items-center space-x-3">
								<span class="text-4xl">🐸</span>
								<p class="text-xl font-medium text-gray-400">
									Click "Share" to check if your image contains a frog
								</p>
							</div>
							<p class="text-sm text-gray-500">Only frog pictures are allowed on Frogstagram!</p>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<p class="mt-4 text-center text-gray-500 dark:text-gray-400">No image selected.</p>
		{/if}
	</div>
</div>

<style>
	button[disabled] {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Make the emoji rendering crisp */
	.text-2xl {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
</style>
