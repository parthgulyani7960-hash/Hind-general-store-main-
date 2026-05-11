import React, { useState, useRef } from 'react';
import { Upload, X, Star } from 'lucide-react';
import { uploadFile } from '../services/storageService';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[], primaryIndex: number) => void;
  primaryIndex: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange, primaryIndex }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress(0);

    const newImages = [...images];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile({
          path: `products/${Date.now()}_${files[i].name}`,
          file: files[i],
          onProgress: (p) => setProgress(p)
        });
        newImages.push(url);
      } catch (e: any) {
        toast.error(e.message);
      }
    }
    setUploading(false);
    onChange(newImages, primaryIndex);
  };

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "hover:border-primary"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto text-stone-400 mb-2" />
        <p className="text-sm font-bold text-stone-600">Drag & drop images here</p>
        <p className="text-xs text-stone-400">or click to browse</p>
        <input type="file" multiple accept="image/*" hidden ref={fileInputRef} onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {uploading && (
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div key={img} className="relative group rounded-xl overflow-hidden border border-stone-200">
            <img src={img} alt="Product" className="w-full h-24 object-cover" />
            <button 
                onClick={(e) => { e.stopPropagation(); onChange(images.filter((_, i) => i !== idx), primaryIndex === idx ? 0 : primaryIndex > idx ? primaryIndex - 1 : primaryIndex); }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
            >
                <X size={12} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onChange(images, idx); }}
                className={cn("absolute top-1 left-1 p-1 rounded-full", primaryIndex === idx ? "bg-amber-400 text-white" : "bg-black/50 text-white opacity-0 group-hover:opacity-100")}
            >
                <Star size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
