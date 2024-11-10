<script lang="ts">
    import { onMount } from 'svelte';
    import { uploadedImage } from '../../../stores/uploadedImage';
    import { croppedImage } from '../../../stores/croppedImage';
    import { goto } from '$app/navigation';
  
    let imageFile: File | null = null;
    let imageUrl: string | null = null;
    let caption: string = '';
  
    onMount(() => {
      const unsubscribe = croppedImage.subscribe((file) => {
        imageFile = file;
        if (imageFile) {
          imageUrl = URL.createObjectURL(imageFile);
        } else {
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
      uploadedImage.set(null);
      croppedImage.set(null);
      goto('/');
    }
  
    function handleBack() {
      croppedImage.set(null);
      goto('/create/edit');
    }
</script>
  
<div class="flex flex-col h-screen bg-white dark:bg-gray-800">
    <!-- Top Bar -->
    <div class="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <button 
            on:click={handleBack} 
            class="p-2 text-xl text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-gray-200 dark:hover:bg-gray-800"
        >
            ←
        </button>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">New Post</h2>
        <button 
            on:click={handleShare} 
            class="p-2 text-lg font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors dark:text-green-400 dark:hover:bg-green-900/20"
        >
            Share
        </button>
    </div>
  
    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto">
        {#if imageUrl}
            <div class="p-4 bg-gray-900">
                <div class="flex items-start gap-3">
                    <!-- Profile Picture -->
                    <img 
                        src="https://picsum.photos/seed/user1/40/40" 
                        alt="Profile" 
                        class="w-8 h-8 rounded-full flex-shrink-0" 
                    />
                    
                    <!-- Caption Textarea -->
                    <textarea
                        bind:value={caption}
                        placeholder="Write a caption..."
                        class="flex-1 h-20 p-0 text-base bg-transparent border-none resize-none placeholder:text-gray-500 text-gray-100 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                    ></textarea>
                    
                    <!-- Cropped Preview -->
                    <img 
                        src={imageUrl} 
                        alt="Cropped preview" 
                        class="w-14 h-14 object-cover rounded-sm flex-shrink-0" 
                    />
                </div>
            </div>
        {:else}
            <p class="text-center mt-4 text-gray-500 dark:text-gray-400">No image selected.</p>
        {/if}
    </div>
</div>