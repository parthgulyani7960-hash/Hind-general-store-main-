import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Trash2, Star, Camera, Upload, Loader } from 'lucide-react';
import { uploadFile } from '../../services/storageService';
import toast from 'react-hot-toast';
import { handleAppError } from '../../lib/errorUtils';

interface Props {
  allImages: string[];
  primaryImage: string;
  onUpdate: (allImages: string[], primaryImage: string) => void;
}

export default function ProductImageManager({ allImages, primaryImage, onUpdate }: Props) {
  const [images, setImages] = useState<string[]>(allImages);
  const [primary, setPrimary] = useState<string>(primaryImage);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      toast.error(`${fileRejections[0].file.name}: Unsupported file type.`);
      return;
    }

    // Size validation - 5MB limit
    const MAX_SIZE = 5 * 1024 * 1024;
    const oversized = acceptedFiles.find(f => f.size > MAX_SIZE);
    if (oversized) {
      toast.error(`File ${oversized.name} exceeds 5MB limit.`);
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = acceptedFiles.map(file => 
        uploadFile({ path: `products/${Date.now()}_${file.name}`, file })
      );
      const newUrls = await Promise.all(uploadPromises);
      const updatedImages = [...images, ...newUrls];
      
      let newPrimary = primary;
      if (!newPrimary && updatedImages.length > 0) newPrimary = updatedImages[0];
      
      setImages(updatedImages);
      setPrimary(newPrimary);
      onUpdate(updatedImages, newPrimary);
      toast.success('Images uploaded successfully');
    } catch (err: any) {
      handleAppError(err, 'Upload failed', 'uploadProductImage', true);
    } finally {
      setUploading(false);
    }
  }, [images, primary, onUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    disabled: uploading 
  } as any);

  const handleDelete = (urlToDelete: string) => {
    const updated = images.filter(url => url !== urlToDelete);
    let newPrimary = primary;
    if (primary === urlToDelete) {
      newPrimary = updated.length > 0 ? updated[0] : '';
    }
    setImages(updated);
    setPrimary(newPrimary);
    onUpdate(updated, newPrimary);
  };

  const setAsPrimary = (url: string) => {
    setPrimary(url);
    onUpdate(images, url);
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-stone-200 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader className="mx-auto animate-spin text-primary" size={32} />
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto text-stone-400" size={32} />
            <p className="text-sm text-stone-600">Drag & drop images, or click to select</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200">
            <img src={url} alt={`Product ${index}`} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setAsPrimary(url)}
                className={`p-1 rounded ${primary === url ? 'text-yellow-400' : 'text-white'}`}
                title="Set as primary"
              >
                <Star size={16} fill={primary === url ? 'currentColor' : 'none'} />
              </button>
              <button 
                onClick={() => handleDelete(url)}
                className="p-1 rounded text-white hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {primary === url && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">Primary</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
