import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const MAX_SIZE_MB = 5;
const BUCKET     = 'report-images';

const ImageUpload = ({ onUpload, onClear }) => {
  const [preview,    setPreview]    = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }
    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      const ext      = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path     = `public/${filename}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      onUpload(publicUrl);
      toast.success('Image uploaded!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed. Please try again.');
      setPreview(null);
      onClear?.();
    } finally {
      setUploading(false);
    }
  }, [onUpload, onClear]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClear = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          className={`drop-zone rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${isDragging ? 'border-city-orange bg-city-orange/10' : 'border-city-border'}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={isDragging ? 'text-city-orange' : 'text-city-muted'}>
                <path d="M10 3v10M5 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="font-body text-sm text-city-subtext">
                <span className="text-city-orange font-medium">Click to upload</span> or drag & drop
              </p>
              <p className="font-mono text-xs text-city-muted mt-1">PNG, JPG, WEBP — max {MAX_SIZE_MB}MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-city-border group">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-48 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-city-bg/70 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-city-orange border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-xs text-city-orange">Uploading…</p>
            </div>
          )}
          {!uploading && (
            <button
              onClick={handleClear}
              type="button"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-city-bg/80 text-city-text hover:bg-city-red/20 hover:text-city-red flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 4.586L1.707.293.293 1.707 4.586 6 .293 10.293l1.414 1.414L6 7.414l4.293 4.293 1.414-1.414L7.414 6l4.293-4.293L10.293.293 6 4.586z"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
