<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let error = $page.url.searchParams.get('error');
	let username = $page.url.searchParams.get('username') || '';
	let tempPassword: string;

	onMount(() => {
		tempPassword = sessionStorage.getItem('tempAuthPassword') || '';
		if (!tempPassword) {
			error = 'Session expired. Please sign up again.';
		}
	});

	// Add interface for API responses
	interface VerificationResponse {
		success: boolean;
		message: string;
	}

	interface SignInResult {
		error?: string;
		url?: string;
	}

	// Update the handleSubmit function with proper typing
	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		const data = new FormData(event.target as HTMLFormElement);
		const code = data.get('code') as string;

		try {
			const res = await fetch('/auth/verify', {
				method: 'POST',
				body: JSON.stringify({ username, code }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const result = await res.json() as VerificationResponse;

			if (!result.success) {
				error = result.message;
				return;
			}

			// Auto sign in after verification
			const signInResult = await signIn('credentials', {
				redirect: false,
				email: sessionStorage.getItem('tempAuthEmail'),
				password: sessionStorage.getItem('tempAuthPassword')
			}) as SignInResult;

			if (signInResult?.error) {
				error = signInResult.error;
				return;
			}

			// Clear temporary credentials
			sessionStorage.removeItem('tempAuthEmail');
			sessionStorage.removeItem('tempAuthPassword');

			// Redirect to home page
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Verification failed';
		}
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
	<div class="w-full max-w-md">
		<div
			class="rounded-lg border border-gray-200 bg-white px-8 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
		>
			<div class="mb-6 text-center">
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Account</h1>
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
					Enter the verification code sent to your email
				</p>
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
					<label for="code" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Verification Code
					</label>
					<input
						type="text"
						name="code"
						id="code"
						required
						pattern="[0-9]{'{'}6{'}'}"
						title="Please enter the 6-digit code"
						class="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-500"
						placeholder="123456"
					/>
				</div>

				<button
					type="submit"
					class="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-offset-gray-800"
				>
					Verify Account
				</button>
			</form>
		</div>
	</div>
</div>
