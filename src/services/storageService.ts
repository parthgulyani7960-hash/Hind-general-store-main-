import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadOptions {
  path: string;
  file: File;
  maxSizeInBytes?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export const uploadFile = async (options: UploadOptions): Promise<string> => {
  const { path, file, maxSizeInBytes = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], onProgress } = options;

  // 1. Validation
  if (file.size > maxSizeInBytes) {
    throw new Error(`File is too large. Limit is ${maxSizeInBytes / 1024 / 1024}MB.`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed.`);
  }

  // 2. Upload
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
            onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload failed', error);
        // Better error message based on common Firebase storage errors
        if (error.code === 'storage/unauthorized') {
            reject(new Error('Permission denied. You cannot upload this file.'));
        } else {
            reject(new Error('Failed to upload file. Please try again.'));
        }
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch((err) => {
            console.error('Failed to get download URL', err);
            reject(new Error('Failed to retrieve file URL.'));
        });
      }
    );
  });
};
