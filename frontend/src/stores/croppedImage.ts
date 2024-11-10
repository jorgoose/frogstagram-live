import { writable } from 'svelte/store';

export const croppedImage = writable<File | null>(null);