import { writable } from 'svelte/store';

export const uploadedImage = writable<File | null>(null);
