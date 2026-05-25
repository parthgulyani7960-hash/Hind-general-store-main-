import React, { useState, useRef } from 'react';
import { Upload, X, Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile } from '../services/storageService';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[], primaryIndex: number) => void;
  primaryIndex: number;
}

interface UploadStatus {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange, primaryIndex }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploads, setActiveUploads] = useState<UploadStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newUploads = Array.from(files).map(file => ({
      id: `${Date.now()}_${file.name}`,
      name: file.name,
      progress: 0,
      status: 'uploading' as const
    }));

    setActiveUploads(prev => [...prev, ...newUploads]);

    const newImages = [...images];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = newUploads[i].id;

        try {
            const url = await uploadFile({
              path: `products/${uploadId}`,
              file: file,
              onProgress: (p) => {
                  setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress: p } : u));
              }
            });
            newImages.push(url);
            setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'success' } : u));
        } catch (e: any) {
            setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: e.message } : u));
            toast.error(`Failed to upload ${file.name}`);
        }
    }
    
    // Cleanup successful uploads from list after a delay
    setTimeout(() => {
        setActiveUploads(prev => prev.filter(u => u.status !== 'success'));
    }, 5000);

    onChange(newImages, primaryIndex);
  };

  return (
    <div className="space-y-6">
      <div 
        className={cn(
          "border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center cursor-pointer transition-all active:scale-[0.99] hover:border-primary/50",
          isDragging ? "border-primary bg-primary/5" : ""
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto text-stone-400 mb-2" size={24} />
        <p className="text-sm font-bold text-stone-600">Drag & drop images</p>
        <p className="text-xs text-stone-400 mt-1">or click to browse</p>
        <input type="file" multiple accept="image/*" hidden ref={fileInputRef} onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {activeUploads.length > 0 && (
        <div className="space-y-2">
            {activeUploads.map(upload => (
                <div key={upload.id} className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm flex items-center gap-3">
                    {upload.status === 'uploading' && <Loader2 size={16} className="animate-spin text-primary" />}
                    {upload.status === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                    {upload.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-bold text-stone-700 truncate max-w-[150px]">{upload.name}</span>
                            <span className="text-stone-400">{upload.progress}%</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-300", upload.status === 'error' ? "bg-red-500" : "bg-primary")} style={{ width: `${upload.progress}%` }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div key={img} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square">
            <img src={img} alt="Product" className="w-full h-full object-cover" />
            
            {/* Overlay for actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onChange(images.filter((_, i) => i !== idx), primaryIndex === idx ? 0 : primaryIndex > idx ? primaryIndex - 1 : primaryIndex); }}
                  className="bg-white/20 hover:bg-red-500 text-white p-2 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onChange(images, idx); }}
                    className={cn("p-2 rounded-full transition-colors", primaryIndex === idx ? "bg-amber-400 text-white" : "bg-white/20 hover:bg-amber-400 text-white")}
                >
                    <Star size={16} />
                </button>
            </div>
            
            {/* Primary badge */}
            {primaryIndex === idx && (
              <div className="absolute top-1 left-1 bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow">
                MAIN
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
