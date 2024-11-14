<script lang="ts">
	// Import regular icons
	import {
		faUser,
		faComment,
		faSquarePlus,
		faCompass,
		faMoon,
		faBookmark
	} from '@fortawesome/free-regular-svg-icons';

	// Import solid icons
	import {
		faHome,
		faMagnifyingGlass,
		faBars,
		faRightFromBracket,
		faFrog,
		faGear
	} from '@fortawesome/free-solid-svg-icons';

	import Fa from 'svelte-fa';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { signOut } from '@auth/sveltekit/client';

	const isMoreMenuOpen = writable(false);
	const isMobileMenuOpen = writable(false);

	function toggleMoreMenu() {
		isMoreMenuOpen.update((value) => !value);
	}

	function toggleMobileMenu() {
		isMobileMenuOpen.update((value) => !value);
	}

	// Define User type
	type User = {
		profileImage: string;
		displayName: string;
		bio: string;
	};

	// Get user from session
	import { page } from '$app/stores';
	$: sessionUsername = ($page.data.session?.user as User)?.username;
	$: routeUsername = $page.params.username;
	$: isOwnProfile = sessionUsername === routeUsername;

	interface Post {
		post_id: string;
		owner: string;
		image_path: string;
		caption: string;
		timestamp: string;
		likes: {
			count: number;
			users: string[];
		};
		comments: Array<{
			id: string;
			owner: string;
			text: string;
			timestamp: string;
			likes: {
				count: number;
				users: string[];
			};
		}>;
	}

	let user: User = {
		// Lorem picsum image
		profileImage: 'https://picsum.photos/seed/user1/200/200',
		displayName: '',
		bio: ''
	};
	let posts: Post[] = [];
	let isLoading = true;
	let hasMore = true;
	let loadingMore = false;

	async function fetchUserPosts(cursor?: string) {
		try {
			const params = new URLSearchParams();
			if (cursor) params.append('cursor', cursor);
			params.append('owner', routeUsername);

			const response = await fetch(`/api/posts?${params}`);
			if (!response.ok) throw new Error('Failed to fetch posts');

			const data = await response.json();
			posts = cursor ? [...posts, ...data.posts] : data.posts;
			hasMore = data.hasMore;
		} catch (error) {
			console.error('Error:', error);
		} finally {
			isLoading = false;
			loadingMore = false;
		}
	}

	// User stats derived from posts
	$: userStats = {
		posts: posts.length
	};

	onMount(() => {
		fetchUserPosts();
		checkFollowStatus();
	});

	// Logout handler
	const handleLogout = async () => {
		await signOut({ callbackUrl: '/auth/login' });
	};

	function handleScroll(e: Event) {
		const target = e.target as HTMLElement;
		const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;

		if (bottom && hasMore && !loadingMore && !isLoading) {
			loadingMore = true;
			const lastPost = posts[posts.length - 1];
			fetchUserPosts(lastPost.timestamp);
		}
	}

	// Mock stats (to be replaced with real data later)
	let followStats = {
		followers: 0,
		following: 0
	};

	// Follow state (to be replaced with real data later)
	let isFollowing = false;

	// Update handleFollowToggle
	const handleFollowToggle = async () => {
		if (!sessionUsername || !routeUsername || isToggling) return;

		isToggling = true;
		try {
			const response = await fetch('/api/follow', {
				method: isFollowing ? 'DELETE' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					follower: sessionUsername,
					following: routeUsername
				})
			});

			if (response.ok) {
				isFollowing = !isFollowing;
				// Update follow stats
				followStats.followers += isFollowing ? 1 : -1;
			}
		} catch (error) {
			console.error('Error toggling follow:', error);
		} finally {
			isToggling = false;
		}
	};

	// Add new state variables
	let isCheckingFollow = true;
	let isToggling = false;

	// Add function to check follow status
	async function checkFollowStatus() {
		if (!sessionUsername || !routeUsername) return;

		try {
			const response = await fetch(`/api/follow?username=${sessionUsername}&profile=${routeUsername}`);
			const data = await response.json();
			isFollowing = data.following.includes(routeUsername);
			
			// Update follow stats with real data
			followStats = {
				followers: data.stats.followers,
				following: data.stats.following
			};
		} catch (error) {
			console.error('Error checking follow status:', error);
		} finally {
			isCheckingFollow = false;
		}
	}

	// Update onMount
	onMount(async () => {
		await Promise.all([fetchUserPosts(), checkFollowStatus()]);
	});
</script>

<div class="flex h-screen bg-white dark:bg-gray-900">
	<!-- Desktop Sidebar - Same as homepage -->
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

				<button
					class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
				>
					<Fa icon={faCompass} class="mr-4 h-6 w-6" />
					<span class="text-sm font-medium">Explore</span>
				</button>

				<button
					class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
				>
					<Fa icon={faFrog} class="mr-4 h-6 w-6" />
					<span class="text-sm font-medium">Notifications</span>
				</button>

				<button
					class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
				>
					<a href="/upload" class="flex items-center">
						<Fa icon={faSquarePlus} class="mr-4 h-7 w-7" />
						<span class="text-sm font-medium">Create</span>
					</a>
				</button>
			</div>
		</div>

		<!-- Bottom Section with Profile and More - Same as homepage -->
		<div class="mt-auto border-t border-gray-200 dark:border-gray-800">
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

			<button
				class="flex w-full items-center px-4 py-3 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
			>
				<img
					src="https://picsum.photos/seed/user1/40/40"
					alt="Your profile"
					class="mr-3 h-8 w-8 rounded-full"
				/>
				<div class="flex-1 text-left">
					<div class="text-sm font-medium">{sessionUsername || 'Loading...'}</div>
					<div class="text-xs text-green-700 dark:text-green-400">View Profile</div>
				</div>
			</button>

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
		<h1 class="text-xl font-bold text-gray-900 dark:text-white">{routeUsername}</h1>
		<div class="flex items-center space-x-4">
			<button
				class="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
			>
				<Fa icon={faBookmark} class="h-6 w-6" />
			</button>
			<div class="relative">
				<button
					class="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
					on:click={toggleMobileMenu}
				>
					<Fa icon={faGear} class="h-6 w-6" />
				</button>

				{#if $isMobileMenuOpen}
					<div
						class="absolute right-0 top-12 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="py-1">
							<button
								class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
								on:click={handleLogout}
							>
								<Fa icon={faRightFromBracket} class="mr-3 h-4 w-4" />
								<span>Log Out</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Mobile Bottom Navigation - Same as homepage -->
	<div
		class="fixed bottom-0 left-0 right-0 z-10 flex h-16 items-center justify-around border-t border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-900"
	>
		<a href="/" class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<Fa icon={faHome} class="h-6 w-6" />
			<span class="mt-1 text-xs">Home</span>
		</a>
		<button class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<Fa icon={faMagnifyingGlass} class="h-6 w-6" />
			<span class="mt-1 text-xs">Search</span>
		</button>
		<button class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<img
				src="https://picsum.photos/seed/user1/40/40"
				alt="Your profile"
				class="h-6 w-6 rounded-full"
			/>
			<span class="mt-1 text-xs">Profile</span>
		</button>
	</div>

	<!-- Main Content Area -->
	<div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900" on:scroll={handleScroll}>
		<div class="flex h-full w-full justify-center">
			<div class="w-full max-w-lg px-4 pb-24 pt-20 md:pb-20 md:pt-8">
				<!-- Profile Info -->
				<div class="mb-8">
					<!-- Profile Header -->
					<div class="mb-4 flex items-start">
						<img
							src={user.profileImage}
							alt={routeUsername}
							class="h-20 w-20 rounded-full object-cover"
						/>
						<div class="ml-4 flex-1">
							<!-- Stats - Posts, Followers, Following -->
							<div class="flex justify-around text-center">
								<div>
									<div class="font-semibold text-gray-900 dark:text-white">{userStats.posts}</div>
									<div class="text-sm text-gray-500">posts</div>
								</div>
								<div>
									<div class="font-semibold text-gray-900 dark:text-white">
										{followStats.followers}
									</div>
									<div class="text-sm text-gray-500">followers</div>
								</div>
								<div>
									<div class="font-semibold text-gray-900 dark:text-white">
										{followStats.following}
									</div>
									<div class="text-sm text-gray-500">following</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Bio -->
					<div class="mb-4">
						<div class="font-semibold text-gray-900 dark:text-white">{routeUsername}</div>
						<div class="whitespace-pre-line text-gray-900 dark:text-gray-200">{user.bio}</div>
					</div>

					<!-- Edit Profile or Follow Button -->
					{#if isOwnProfile}
						<button
							class="w-full rounded-md bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
						>
							Edit profile
						</button>
					{:else}
						<button
							class="w-full rounded-md {isFollowing
								? 'bg-gray-100 dark:bg-gray-800'
								: 'bg-green-600 dark:bg-green-500'} px-4 py-1.5 text-sm font-semibold {isFollowing
								? 'text-gray-900 dark:text-white'
								: 'text-white'} transition-colors {isFollowing
								? 'hover:bg-gray-200 dark:hover:bg-gray-700'
								: 'hover:bg-green-700 dark:hover:bg-green-600'}"
							on:click={handleFollowToggle}
							disabled={isToggling || isCheckingFollow}
						>
							{#if isCheckingFollow}
								<span class="animate-pulse">Loading...</span>
							{:else if isToggling}
								<span class="animate-pulse">{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
							{:else}
								{isFollowing ? 'Following' : 'Follow'}
							{/if}
						</button>
					{/if}
				</div>

				<!-- Post Grid -->
				<div class="grid grid-cols-3 gap-[2px] bg-gray-200 dark:bg-gray-800">
					{#if isLoading}
						<div class="col-span-3 flex justify-center py-8">
							<div class="animate-bounce text-4xl">🐸</div>
						</div>
					{:else if posts.length === 0}
						<div class="col-span-3 py-8 text-center text-gray-500">No posts yet</div>
					{:else}
						{#each posts as post}
							<div class="aspect-square bg-gray-100 dark:bg-gray-700">
								<img
									src={`/api/images/${post.image_path}`}
									alt="Post"
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
