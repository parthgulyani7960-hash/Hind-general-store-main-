import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadOptions {
  path: string;
  file: File;
  maxSizeInBytes?: number;
  allowedTypes?: string[];
}

export const uploadFile = async (options: UploadOptions): Promise<string> => {
  const { path, file, maxSizeInBytes = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  // 1. Validation
  if (file.size > maxSizeInBytes) {
    throw new Error(`File size too large. Max size is ${maxSizeInBytes / 1024 / 1024}MB.`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // 2. Upload
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Upload failed', error);
        reject(new Error('Failed to upload file.'));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch(reject);
      }
    );
  });
};
