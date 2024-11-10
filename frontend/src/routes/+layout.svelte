<!-- src/routes/+layout.svelte -->

<script lang="ts">
	import '../app.css';
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';

	function handleSignOut(event: Event) {
		event.preventDefault();
		signOut({ callbackUrl: '/auth/login' });
	}
</script>

<slot />
<footer>
	{#if $page.data.session?.user}
		<!-- Reroute to login -->
		<p></p>
	{:else}
		<!-- No Session Display info -->
	{/if}
</footer>
