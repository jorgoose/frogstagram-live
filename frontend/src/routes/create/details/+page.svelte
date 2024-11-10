<script lang="ts">
    import { onMount } from 'svelte';
    import { uploadedImage } from '../../../stores/uploadedImage';
    import { croppedImage } from '../../../stores/croppedImage';
    import { goto } from '$app/navigation';
  
    let imageFile: File | null = null;
    let imageUrl: string | null = null;
    let caption: string = '';
  
    onMount(() => {
      // Subscribe to croppedImage instead of uploadedImage
      const unsubscribe = croppedImage.subscribe((file) => {
        imageFile = file;
        if (imageFile) {
          imageUrl = URL.createObjectURL(imageFile);
        } else {
          // If no cropped image is available, redirect back to edit page
          goto('/create/edit');
        }
      });
  
      return () => {
        unsubscribe();
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
      };
    });
  
    function handleShare() {
      if (!imageFile) return;
  
      // Here you would handle the form submission
      // Clear both stores after successful upload
      uploadedImage.set(null);
      croppedImage.set(null);
      goto('/');
    }
  
    function handleBack() {
      // Clear only the cropped image when going back
      croppedImage.set(null);
      goto('/create/edit');
    }
</script>
  
  <div class="flex flex-col h-screen bg-white dark:bg-gray-900">
    <!-- Top Bar -->
    <div class="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <button on:click={handleBack} class="text-xl text-gray-700 dark:text-gray-200">
        ←
      </button>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">New Post</h2>
      <button on:click={handleShare} class="text-lg font-medium text-green-600 dark:text-green-400">
        Share
      </button>
    </div>
  
    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto">
      {#if imageUrl}
        <div class="flex items-start p-4">
          <img src={imageUrl} alt="Cropped preview" class="w-20 h-20 object-cover rounded mr-4" />
          <textarea
            bind:value={caption}
            placeholder="Write a caption..."
            class="flex-1 h-20 p-2 border border-gray-300 rounded dark:bg-gray-800 dark:text-white"
          ></textarea>
        </div>
      {:else}
        <p class="text-center text-gray-500 dark:text-gray-400 mt-4">No image selected.</p>
      {/if}
    </div>
  </div>
  