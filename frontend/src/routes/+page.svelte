<script lang="ts">
	// Import icons
	import {
		faUser,
		faComment,
		faSquarePlus,
		faCompass,
		faMoon
	} from '@fortawesome/free-regular-svg-icons';

	import {
		faHome,
		faMagnifyingGlass,
		faBars,
		faRightFromBracket,
		faFrog
	} from '@fortawesome/free-solid-svg-icons';

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Fa from 'svelte-fa';
	import { writable } from 'svelte/store';
	import { signOut } from '@auth/sveltekit/client';
	import { onMount } from 'svelte';

	// Add proper types at the top of script
	interface User {
		id: string;
		username: string;
		email: string;
		image?: string;
	}

	interface Comment {
		id: string;
		owner: string;
		text: string;
		timestamp: string;
		likes: {
			count: number;
			users: string[];
		};
	}

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
		comments: Comment[];
	}

	// Add type to posts array
	let posts: Post[] = [];
	let isLoading: boolean = true;
	let hasMore: boolean = true;
	let loadingMore: boolean = false;
	// Add type for comment state
	let commentText: string = '';
	let showComments: Record<string, boolean> = {};

	async function fetchPosts(cursor?: string) {
		try {
			const params = new URLSearchParams();
			if (cursor) params.append('cursor', cursor);

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

	function handleScroll(e: Event) {
		const target = e.target as HTMLElement;
		const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;

		if (bottom && hasMore && !loadingMore && !isLoading) {
			loadingMore = true;
			const lastPost = posts[posts.length - 1];
			fetchPosts(lastPost.timestamp);
		}
	}

	onMount(() => {
		fetchPosts();
	});

	// Update handlers with type safety
	async function toggleRibbited(post: Post): Promise<void> {
		if (!user?.username) return; // Early return if no user
		
		const hasLiked = post.likes.users.includes(user.username);

		// Optimistic update
		posts = posts.map((p) => {
			if (p.post_id === post.post_id) {
				return {
					...p,
					likes: {
						count: p.likes.count + (hasLiked ? -1 : 1),
						users: hasLiked
							? p.likes.users.filter((u) => u !== user.username)
							: [...p.likes.users, user.username]
					}
				};
			}
			return p;
		});

		try {
			const response = await fetch(`/api/posts/${post.post_id}/like`, {
				method: hasLiked ? 'DELETE' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: user.username })
			});

			if (!response.ok) {
				throw new Error('Failed to update like');
			}
		} catch (error) {
			console.error('Error:', error);
			// Revert optimistic update on failure
			posts = posts.map((p) => {
				if (p.post_id === post.post_id) {
					return {
						...p,
						likes: {
							count: p.likes.count + (hasLiked ? 1 : -1),
							users: hasLiked
								? [...p.likes.users, user?.username || '']
								: p.likes.users.filter((u) => u !== user?.username)
						}
					};
				}
				return p;
			});
		}
	}

	// Update handlers with type safety
	async function handleComment(post: Post): Promise<void> {
		if (!user?.username || !commentText.trim()) return;
		
		try {
			const response = await fetch(`/api/posts/${post.post_id}/comment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: user.username,
					text: commentText.trim()
				})
			});

			if (!response.ok) throw new Error('Failed to add comment');
			
			const { comment } = await response.json() as { comment: Comment };
			
			// Update local state
			posts = posts.map(p => {
				if (p.post_id === post.post_id) {
					return {
						...p,
						comments: [...p.comments, comment]
					};
				}
				return p;
			});
			
			commentText = '';
		} catch (error) {
			console.error('Error:', error);
		}
	}

	// Add return type to handlers
	function toggleComments(postId: string): void {
		showComments = {
			...showComments,
			[postId]: !showComments[postId]
		};
	}

	const isMoreMenuOpen = writable(false);

	// Add return type to handlers
	function toggleMoreMenu(): void {
		isMoreMenuOpen.update((value) => !value);
	}

	// Logout handler
	const handleLogout = async () => {
		await signOut({ callbackUrl: '/auth/login' });
	};

	// Get user from session
	$: user = ($page.data.session?.user as User | undefined);

	// Update profile navigation
	const goToProfile = (): void => {
		if (user?.username) {
			goto(`/profile/${user.username}`);
		}
	};
</script>

<div class="flex h-screen bg-white dark:bg-gray-900" on:scroll={handleScroll}>
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
				<button
					class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 text-green-400 hover:bg-green-50 dark:text-gray-200 dark:text-green-400 dark:hover:bg-green-900/20"
				>
					<Fa icon={faHome} class="mr-4 h-6 w-6 " />
					<span class="text-sm font-medium">Home</span>
				</button>

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
						on:click={handleLogout}
					>
						<Fa icon={faRightFromBracket} class="mr-3 h-5 w-5" />
						<span class="text-sm">Log Out</span>
					</button>
				</div>
			{/if}

			<!-- Profile Button -->
			<button
				on:click={goToProfile}
				class="flex w-full items-center px-4 py-3 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
			>
				<img
					src={user?.image || `https://picsum.photos/seed/${user?.username || 'user1'}/40/40`}
					alt="Your profile"
					class="mr-3 h-8 w-8 rounded-full"
				/>
				<div class="flex-1 text-left">
					<div class="text-sm font-medium">{user?.username || 'Loading...'}</div>
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
			<a
				href="/upload"
				class="rounded-md p-2 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
			>
				<Fa icon={faSquarePlus} class="h-7 w-7" />
			</a>
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
		<button class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<Fa icon={faHome} class="h-6 w-6" />
			<span class="mt-1 text-xs">Home</span>
		</button>
		<button class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
			<Fa icon={faMagnifyingGlass} class="h-6 w-6" />
			<span class="mt-1 text-xs">Search</span>
		</button>
		<button
			on:click={goToProfile}
			class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200"
		>
			<img
				src={user?.image || `https://picsum.photos/seed/${user?.username || 'user1'}/40/40`}
				alt="Your profile"
				class="h-6 w-6 rounded-full"
			/>
			<span class="mt-1 text-xs">Profile</span>
		</button>
	</div>

	<!-- Main Content Area -->
	<div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
		<div class="flex w-full justify-center">
			<div class="w-full max-w-lg px-4 pb-12 pt-20 md:pb-20 md:pt-8">
				{#each posts as post (post.post_id)}
					<div
						class="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800"
					>
						<!-- Post Header -->
						<div class="flex flex-row items-center space-x-4 p-4">
							<div class="relative h-10 w-10">
								<a href={`/profile/${post.owner}`}>
									<img
										src={`https://picsum.photos/seed/${post.owner}/40/40`}
										alt={post.owner}
										class="h-10 w-10 rounded-full object-cover cursor-pointer"
										loading="lazy"
									/>
								</a>
							</div>
							<a 
								href={`/profile/${post.owner}`}
								class="font-semibold text-gray-900 dark:text-white"
							>
								{post.owner}
							</a>
						</div>

						<!-- Post Image -->
						<div class="aspect-square w-full bg-gray-100 dark:bg-gray-700">
							<img
								src={`/api/images/${post.image_path}`}
								alt="Post content"
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						</div>

						<!-- Post Footer -->
						<div class="p-4">
							<div class="mb-1 flex w-full items-center space-x-2">
								<button
									class="rounded-md p-2 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
									on:click={() => toggleRibbited(post)}
								>
									<Fa
										icon={faFrog}
										class={`h-6 w-6 ${post.likes.users.includes(user?.username || '') ? 'text-green-500' : 'text-white'}`}
									/>
								</button>
								<button
									class="rounded-md p-2 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
								>
									<Fa icon={faComment} class="h-6 w-6 scale-x-[-1] transform" />
								</button>
							</div>
							<div class="mb-2">
								<span class="text-sm font-semibold text-green-700 dark:text-green-400">
									{post.likes.count} {post.likes.count === 1 ? 'ribbit' : 'ribbits'}
								</span>
							</div>
							<p class="text-sm text-gray-900 dark:text-white">
								<a 
									href={`/profile/${post.owner}`}
									class="mr-2 font-semibold"
								>
									{post.owner}
								</a>
								{post.caption}
							</p>
								<button 
									class="mt-1 text-sm text-green-700 hover:underline dark:text-green-400"
									on:click={() => toggleComments(post.post_id)}
								>
									View all {post.comments.length} comments
								</button>
								
								{#if showComments[post.post_id]}
									<div class="mt-2 space-y-2">
										{#each post.comments as comment}
											<div class="text-sm">
												<a 
													href={`/profile/${comment.owner}`}
													class="mr-2 font-semibold text-gray-900 dark:text-white"
												>
													{comment.owner}
												</a>
												<span class="text-gray-900 dark:text-white">{comment.text}</span>
											</div>
										{/each}
									</div>
								{/if}
								
								<!-- Update the comment form section -->
								<div class="mt-2 w-full">
									<form 
										class="flex items-center space-x-2"
										on:submit|preventDefault={() => handleComment(post)}
									>
										<input
											bind:value={commentText}
											placeholder="Add a comment..."
											class="flex-1 rounded-md border-none bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-gray-400"
										/>
										{#if commentText.trim()}
											<button
												type="submit"
												class="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
											>
												Post
											</button>
										{/if}
									</form>
								</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
