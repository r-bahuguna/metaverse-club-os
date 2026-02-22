/* ==========================================================================
   Firebase Storage Upload Helper
   Uploads images to Firebase Storage and returns the download URL.
   ========================================================================== */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload an image file to Firebase Storage under events/{eventId}/
 * Returns the public download URL.
 */
export async function uploadEventImage(file: File, eventId: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `events/${eventId}/image.${ext}`;
    const storageRef = ref(storage, path);

    const metadata = {
        contentType: file.type,
        customMetadata: { uploadedAt: new Date().toISOString() },
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    return getDownloadURL(snapshot.ref);
}

/**
 * Upload a generic image file to Firebase Storage
 * Returns the public download URL.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const metadata = { contentType: file.type };
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return getDownloadURL(snapshot.ref);
}
