<script lang="ts">
	import { goto } from '$app/navigation';
	import { uploadedImage } from '../../stores/uploadedImage';

	// Import icons
	import { faComment, faSquarePlus, faCompass, faMoon } from '@fortawesome/free-regular-svg-icons';

	import {
		faHome,
		faMagnifyingGlass,
		faBars,
		faRightFromBracket,
		faFrog
	} from '@fortawesome/free-solid-svg-icons';

	import Fa from 'svelte-fa';
	import { writable } from 'svelte/store';

	const isMoreMenuOpen = writable(false);

	function toggleMoreMenu() {
		isMoreMenuOpen.update((value) => !value);
	}

	let selectedFile: File | null = null;

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			selectedFile = input.files[0];
			uploadedImage.set(selectedFile);
			// Navigate to the create page after selecting the file
			goto('/create/edit', { replaceState: false });
		}
	}
</script>

<div class="flex h-screen bg-white dark:bg-gray-900">
	<!-- Desktop Sidebar -->
	<nav
		class="hidden w-64 flex-shrink-0 flex-col border-r border-gray-200 md:flex dark:border-gray-800"
	>
		<div class="p-4">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">🐸 Frogstagram</h1>
		</div>
		<div class="flex-1">
			<div class="px-3 py-2">
				<div class="relative">
					<span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<Fa icon={faMagnifyingGlass} class="h-4 w-4 text-gray-400" />
					</span>
					<input
						type="text"
						placeholder="Search"
						class="w-full rounded-md border-none bg-gray-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 dark:bg-gray-800 dark:focus:ring-green-500"
					/>
				</div>
			</div>

			<div class="mt-2 space-y-1">
				<h2
					class="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-500"
				>
					Main Menu
				</h2>

				<!-- Main Navigation -->
				<a
					href="/"
					class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
				>
					<Fa icon={faHome} class="mr-4 h-6 w-6" />
					<span class="text-sm font-medium">Home</span>
				</a>

				<a
					href="/explore"
					class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
				>
					<Fa icon={faCompass} class="mr-4 h-6 w-6" />
					<span class="text-sm font-medium">Explore</span>
				</a>

				<a
					href="/notifications"
					class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
				>
					<Fa icon={faFrog} class="mr-4 h-6 w-6" />
					<span class="text-sm font-medium">Notifications</span>
				</a>

				<a
					href="/upload"
					class="flex w-full items-center px-6 py-3 text-2xl text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
				>
					<Fa icon={faSquarePlus} class="mr-4 h-7 w-7" />
					<span class="text-sm font-medium">Create</span>
				</a>
			</div>
		</div>

		<!-- Bottom Section with Profile and More -->
		<div class="mt-auto border-t border-gray-200 dark:border-gray-800">
			<!-- More Menu Dropdown -->
			{#if $isMoreMenuOpen}
				<div class="border-b border-gray-200 px-2 py-2 dark:border-gray-800">
					<button
						class="flex w-full items-center rounded-md px-2 py-2 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
					>
						<Fa icon={faMoon} class="mr-3 h-5 w-5" />
						<span class="text-sm">Switch Appearance</span>
					</button>
					<button
						class="flex w-full items-center rounded-md px-2 py-2 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
					>
						<Fa icon={faRightFromBracket} class="mr-3 h-5 w-5" />
						<span class="text-sm">Log Out</span>
					</button>
				</div>
			{/if}

			<!-- Profile Button -->
			<button
				class="flex w-full items-center px-4 py-3 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
			>
				<img
					src="https://picsum.photos/seed/user1/40/40"
					alt="Your profile"
					class="mr-3 h-8 w-8 rounded-full"
				/>
				<div class="flex-1 text-left">
					<div class="text-sm font-medium">YourUsername</div>
					<div class="text-xs text-green-700 dark:text-green-400">View Profile</div>
				</div>
			</button>

			<!-- More Button -->
			<button
				class="flex w-full items-center px-4 py-3 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
				on:click={toggleMoreMenu}
			>
				<Fa icon={faBars} class="mr-3 h-8 w-8" />
				<span class="text-sm font-medium">More</span>
			</button>
		</div>
	</nav>

	<!-- Mobile Top Bar -->
	<div
		class="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-900"
	>
		<h1 class="text-xl font-bold text-gray-900 dark:text-white">🐸 Frogstagram</h1>
		<div class="flex items-center space-x-4">
			<!-- Removed the faSquarePlus icon on the upload page -->
			<button
				class="rounded-md p-2 text-2xl text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
			>
				<Fa icon={faFrog} class="h-6 w-6" />
			</button>
		</div>
	</div>

	<!-- Mobile Bottom Navigation -->
	<div
		class="fixed bottom-0 left-0 right-0 z-10 flex h-16 items-center justify-around border-t border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-900"
	>
		<a href="/" class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<Fa icon={faHome} class="h-6 w-6" />
			<span class="mt-1 text-xs">Home</span>
		</a>
		<a href="/search" class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<Fa icon={faMagnifyingGlass} class="h-6 w-6" />
			<span class="mt-1 text-xs">Search</span>
		</a>
		<a href="/profile" class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<img
				src="https://picsum.photos/seed/user1/40/40"
				alt="Your profile"
				class="h-6 w-6 rounded-full"
			/>
			<span class="mt-1 text-xs">Profile</span>
		</a>
	</div>

	<!-- Main Content Area -->
	<div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
		<div class="flex h-full w-full items-center justify-center px-4 pb-24 pt-20 md:pb-8 md:pt-8">
			<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
				<h2 class="mb-4 text-center text-2xl font-semibold text-green-700 dark:text-green-400">
					Share a Frog-tastic Photo!
				</h2>
				<p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
					Only frog-centric images are allowed on Frogstagram. Make sure your photo is froggy enough
					to hop onto the platform!
				</p>
				<label
					class="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-green-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
				>
					<div class="flex flex-col items-center justify-center pb-6 pt-5">
						<Fa
							icon={faSquarePlus}
							class="mb-4 h-12 w-12 text-4xl text-green-400 dark:text-green-500"
						/>
						<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
							<span class="font-semibold text-green-600 dark:text-green-400"
								>Tap or select an image</span
							>
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">Only PNG and JPG are supported</p>
					</div>
					<input
						type="file"
						accept="image/png, image/jpeg"
						class="hidden"
						on:change={handleFileChange}
					/>
				</label>
			</div>
		</div>
	</div>
</div>
