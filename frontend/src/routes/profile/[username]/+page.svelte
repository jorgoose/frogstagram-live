```svelte
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
        faGear,
    } from '@fortawesome/free-solid-svg-icons';

    import Fa from 'svelte-fa';
    import { writable } from 'svelte/store';

    const isMoreMenuOpen = writable(false);

    function toggleMoreMenu() {
        isMoreMenuOpen.update((value) => !value);
    }

    // Mock user data
    const user = {
        username: 'froglover123',
        displayName: 'Lily Padsworth 🐸',
        bio: 'Just a frog enthusiast hopping through life | Nature photographer 📸',
        profileImage: 'https://picsum.photos/seed/user1/150/150',
        stats: {
            posts: 42,
            followers: 1234,
            following: 567
        }
    };

    // Mock posts data
    const posts = [
        { id: 1, image: 'https://picsum.photos/seed/frog1/300/300', likes: 123 },
        { id: 2, image: 'https://picsum.photos/seed/frog2/300/300', likes: 456 },
        { id: 3, image: 'https://picsum.photos/seed/frog3/300/300', likes: 789 },
        { id: 4, image: 'https://picsum.photos/seed/frog4/300/300', likes: 234 },
        { id: 5, image: 'https://picsum.photos/seed/frog5/300/300', likes: 567 },
        { id: 6, image: 'https://picsum.photos/seed/frog6/300/300', likes: 890 },
    ];
</script>

<div class="flex h-screen bg-white dark:bg-gray-900">
    <!-- Desktop Sidebar - Same as homepage -->
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

        <!-- Bottom Section with Profile and More - Same as homepage -->
        <div class="mt-auto border-t border-gray-200 dark:border-gray-800">
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
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
        <div class="flex items-center space-x-4">
            <button class="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                <Fa icon={faBookmark} class="h-6 w-6" />
            </button>
            <button class="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                <Fa icon={faGear} class="h-6 w-6" />
            </button>
        </div>
    </div>

    <!-- Mobile Bottom Navigation - Same as homepage -->
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
                <!-- Profile Info -->
                <div class="mb-8">
                    <!-- Profile Header -->
                    <div class="flex items-start mb-4">
                        <img 
                            src={user.profileImage} 
                            alt={user.username}
                            class="w-20 h-20 rounded-full object-cover"
                        />
                        <div class="flex-1 ml-4">
                            <!-- Stats -->
                            <div class="flex justify-around text-center">
                                <div>
                                    <div class="font-semibold text-gray-900 dark:text-white">{user.stats.posts}</div>
                                    <div class="text-sm text-gray-500">posts</div>
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-900 dark:text-white">{user.stats.followers}</div>
                                    <div class="text-sm text-gray-500">followers</div>
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-900 dark:text-white">{user.stats.following}</div>
                                    <div class="text-sm text-gray-500">following</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bio -->
                    <div class="mb-4">
                        <div class="font-semibold text-gray-900 dark:text-white">{user.displayName}</div>
                        <div class="text-gray-900 dark:text-gray-200 whitespace-pre-line">{user.bio}</div>
                    </div>

                    <!-- Edit Profile Button -->
                    <button class="w-full py-1.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md font-semibold text-sm text-gray-900 dark:text-white transition-colors">
                        Edit profile
                    </button>
                </div>

                <!-- Post Grid -->
                <div class="grid grid-cols-3 gap-[2px] bg-gray-200 dark:bg-gray-800">
                    {#each posts as post}
                        <div class="aspect-square bg-gray-100 dark:bg-gray-700">
                            <img 
                                src={post.image} 
                                alt="Post" 
                                class="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
```