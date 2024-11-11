<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	let error = $page.url.searchParams.get('error');

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		const data = new FormData(event.target as HTMLFormElement);
		try {
			const res = await signIn('credentials', {
				redirect: false,
				email: data.get('email') as string,
				password: data.get('password') as string
			});

			if (res?.ok) {
				await invalidateAll();
				location.href = '/';
			} else {
				error = 'Invalid email or password';
			}
		} catch (err) {
			error = 'An error occurred during sign-in';
		}
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
	<div class="w-full max-w-md">
		<div
			class="rounded-lg border border-gray-200 bg-white px-8 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
		>
			<!-- Header -->
			<div class="mb-6 text-center">
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">🐸 Welcome to Frogstagram</h1>
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to continue</p>
				<div class="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
					<p class="text-sm text-green-800 dark:text-green-300">
						Hop in! Frogstagram is like Instagram, but exclusively for photos of frogs 🐸
					</p>
				</div>
			</div>

			<!-- Error Message -->
			{#if error}
				<div
					class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			<!-- Login Form -->
			<form on:submit={handleSubmit} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Email
					</label>
					<input
						type="email"
						name="email"
						id="email"
						required
						class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-500"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Password
					</label>
					<input
						type="password"
						name="password"
						id="password"
						required
						class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-500"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					class="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-offset-gray-800"
				>
					Sign in
				</button>
			</form>

			<!-- Sign Up Link -->
			<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
				Don't have an account?
				<a
					href="/auth/sign-up"
					class="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
				>
					Sign up
				</a>
			</p>
		</div>
	</div>
</div>
