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

    import Fa from 'svelte-fa';
    import { writable } from 'svelte/store';

    interface Post {
        id: number;
        user: {
            name: string;
            avatar: string;
        };
        image: string;
        ribbits: number;
        ribbited: boolean;
        caption: string;
        comments: number;
    }

    function toggleRibbited(post: Post) {
        post.ribbited = !post.ribbited;
        post.ribbits += post.ribbited ? 1 : -1;
        mockPosts = [...mockPosts]; // Reassign to trigger reactivity
    }


    const isMoreMenuOpen = writable(false);

    function toggleMoreMenu() {
        isMoreMenuOpen.update((value) => !value);
    }

    let mockPosts = [
        {
            id: 1,
            user: {
                name: 'froglover123',
                avatar: 'https://picsum.photos/seed/user1/40/40'
            },
            image: 'https://picsum.photos/seed/frog1/600/600',
            ribbits: 256,
            ribbited: true,
            caption: "Just chillin' on a lily pad 🐸",
            comments: 42
        },
        {
            id: 2,
            user: {
                name: 'toadtalker',
                avatar: 'https://picsum.photos/seed/user2/40/40'
            },
            image: 'https://picsum.photos/seed/frog2/600/600',
            ribbits: 189,
            ribbited: false,
            caption: 'Hopped into a new adventure today! 🌿',
            comments: 23
        },
        {
            id: 3,
            user: {
                name: 'ribbitranger',
                avatar: 'https://picsum.photos/seed/user3/40/40'
            },
            image: 'https://picsum.photos/seed/frog3/600/600',
            ribbits: 312,
            ribbited: false,
            caption: 'Caught a fly mid-air! #NinjaFrog',
            comments: 56
        }
    ];
</script>

<div class="flex h-screen bg-white dark:bg-gray-900">
    <!-- Desktop Sidebar -->
    <nav class="hidden w-64 flex-shrink-0 flex-col border-r border-gray-200 md:flex dark:border-gray-800">
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
                <h2 class="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-500">
                    Main Menu
                </h2>

                <!-- Main Navigation -->
                <button class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
                    <Fa icon={faHome} class="mr-4 h-6 w-6" />
                    <span class="text-sm font-medium">Home</span>
                </button>

                <button class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
                    <Fa icon={faCompass} class="mr-4 h-6 w-6" />
                    <span class="text-sm font-medium">Explore</span>
                </button>

                <button class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
                    <Fa icon={faFrog} class="mr-4 h-6 w-6 text-green-600 dark:text-green-400" />
                    <span class="text-sm font-medium">Notifications</span>
                </button>

                <button class="flex w-full items-center px-6 py-3 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
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
                    <button class="flex w-full items-center rounded-md px-2 py-2 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
                        <Fa icon={faMoon} class="mr-3 h-5 w-5" />
                        <span class="text-sm">Switch Appearance</span>
                    </button>
                    <button class="flex w-full items-center rounded-md px-2 py-2 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
                        <Fa icon={faRightFromBracket} class="mr-3 h-5 w-5" />
                        <span class="text-sm">Log Out</span>
                    </button>
                </div>
            {/if}

            <!-- Profile Button -->
            <button class="flex w-full items-center px-4 py-3 text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
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
    <div class="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-900">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">🐸 Frogstagram</h1>
        <div class="flex items-center space-x-4">
            <a href="/upload" class="rounded-md p-2 text-2xl text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
                <Fa icon={faSquarePlus} class="h-7 w-7" />
            </a>
            <button class="rounded-md p-2 text-2xl text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20">
                <Fa icon={faFrog} class="h-6 w-6" />
            </button>
        </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 z-10 flex h-16 items-center justify-around border-t border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-900">
        <button class="flex flex-col items-center p-2 text-gray-700 dark:text-gray-200">
            <Fa icon={faHome} class="h-6 w-6" />
            <span class="mt-1 text-xs">Home</span>
        </button>
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
    <div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div class="flex h-full w-full justify-center">
            <div class="w-full max-w-lg px-4 pb-24 pt-20 md:pb-20 md:pt-8">
                {#each mockPosts as post (post.id)}
                    <div class="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
                        <!-- Post Header -->
                        <div class="flex flex-row items-center space-x-4 p-4">
                            <div class="relative h-10 w-10">
                                <img
                                    src={post.user.avatar}
                                    alt={post.user.name}
                                    class="h-10 w-10 rounded-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <span class="font-semibold text-gray-900 dark:text-white">{post.user.name}</span>
                        </div>

                        <!-- Post Image -->
                        <div class="aspect-square w-full bg-gray-100 dark:bg-gray-700">
                            <img
                                src={post.image}
                                alt="Post content"
                                class="h-full w-full object-cover"
                                loading="lazy"
                            />
                        </div>

                        <!-- Post Footer -->
                        <div class="p-4">
                            <div class="mb-1 flex w-full items-center space-x-2">
                                <button
                                    class="rounded-md p-2 text-gray-700 text-2xl hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20"
                                    on:click={() => toggleRibbited(post)}
                                >
                                    <Fa
                                        icon={faFrog}
                                        class={`h-6 w-6 ${post.ribbited ? 'text-green-500' : 'text-white'}`}
                                    />
                                </button>
                                <button class="rounded-md p-2 text-gray-700 text-2xl hover:bg-green-50 dark:text-gray-200 dark:hover:bg-green-900/20">
                                    <Fa icon={faComment} class="h-6 w-6 transform scale-x-[-1]" />
                                </button>
                            </div>
                            <div class="mb-2">
                                <span class="text-sm text-green-700 font-semibold dark:text-green-400">
                                    {post.ribbits} ribbits
                                </span>
                            </div>
                            <p class="text-sm text-gray-900 dark:text-white">
                                <span class="mr-2 font-semibold">{post.user.name}</span>
                                {post.caption}
                            </p>
                            <button class="mt-1 text-sm text-green-700 hover:underline dark:text-green-400">
                                View all {post.comments} comments
                            </button>
                            <div class="mt-2 w-full">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
