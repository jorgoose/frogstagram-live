<!-- src/routes/auth/sign-up/+page.svelte -->
<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	// Import goto
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	let error = $page.url.searchParams.get('error');

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		const data = new FormData(event.target as HTMLFormElement);
		const username = data.get('username') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		try {
			const res = await fetch('/auth/sign-up', {
				method: 'POST',
				body: JSON.stringify({ username, email, password }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await res.json();

			if (!data.success) {
				error = data.message;
				return;
			}

			// Store credentials temporarily
			sessionStorage.setItem('tempAuthEmail', email);
			sessionStorage.setItem('tempAuthPassword', password);

			goto(`/auth/verify?username=${encodeURIComponent(username)}`);
		} catch (err: any) {
			error = err.message || 'An error occurred during sign up';
			console.error('Signup error:', err);
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
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">🐸 Join Frogstagram</h1>
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Create your account</p>
			</div>

			{#if error}
				<div
					class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			<form on:submit={handleSubmit} class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Username
					</label>
					<input
						type="text"
						name="username"
						id="username"
						required
						pattern="^[a-zA-Z0-9._\-]{'{'}3,20{'}'}$"
						title="Username must be 3-20 characters and meet requirements of Cognito User Pools"
						class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-500"
						placeholder="froggy123"
					/>
				</div>

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

				<div class="space-y-4">
					<div>
						<label
							for="password"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Password
						</label>
						<input
							type="password"
							name="password"
							id="password"
							required
							pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{'{'}8,{'}'}$"
							title="Password must be at least 8 characters long, contain at least one number, one special character, one uppercase letter, and one lowercase letter"
							class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-500"
							placeholder="••••••••"
						/>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
							Must be at least 8 characters long, contain at least one number, one special
							character, one uppercase letter, and one lowercase letter
						</p>
					</div>

					<div>
						<label
							for="confirmPassword"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Confirm Password
						</label>
						<input
							type="password"
							name="confirmPassword"
							id="confirmPassword"
							required
							pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{'{'}8,{'}'}$"
							title="Passwords must match"
							class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-500"
							placeholder="••••••••"
						/>
					</div>
				</div>

				<button
					type="submit"
					class="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-offset-gray-800"
				>
					Create Account
				</button>
			</form>

			<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
				Already have an account?
				<a
					href="/auth/login"
					class="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
				>
					Sign in
				</a>
			</p>
		</div>
	</div>
</div>
