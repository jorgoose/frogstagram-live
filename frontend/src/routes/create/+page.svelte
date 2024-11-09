<script lang="ts">
    import { onMount } from 'svelte';
    import { uploadedImage } from '../../stores/uploadedImage';

    let imageFile: File | null = null;
    let imageUrl: string | null = null;

    onMount(() => {
        uploadedImage.subscribe((file) => {
            imageFile = file;
            if (imageFile) {
                imageUrl = URL.createObjectURL(imageFile);
            } else {
                // If no image is available, redirect back to upload page
                window.location.href = '/upload';
            }
        });
    });

    function handleSubmit() {
        // Here you can handle the form submission, e.g., upload the image to the server
    }
</script>

<div class="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">Create Post</h2>
        {#if imageUrl}
            <img src={imageUrl} alt="Selected" class="mb-4 w-full rounded-lg" />
            <!-- Additional form fields can go here -->
            <textarea class="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Write a caption..."></textarea>
            <button on:click={handleSubmit} class="mt-4 w-full bg-green-600 text-white py-2 rounded-md">
                Post
            </button>
        {:else}
            <p class="text-gray-500 dark:text-gray-400">No image selected.</p>
        {/if}
    </div>
</div>
