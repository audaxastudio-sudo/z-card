import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, X, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

export default function AvatarUpload({ onUpload, initialUrl, folder = 'avatars' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(initialUrl);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialUrl) setPreview(initialUrl);
  }, [initialUrl]);

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      // Preview local imediato
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload para o Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      
      // Pegamos o ID do usuário para organizar as pastas (opcional, mas recomendado pelas políticas que criamos)
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = user ? `${user.id}/${fileName}` : fileName;

      const { error: uploadError, data } = await supabase.storage
        .from(folder)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(folder)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error) {
      alert('Erro ao fazer upload da imagem: ' + error.message);
      setPreview(initialUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative group">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-24 h-24 md:w-32 md:h-32 bg-brand-bg border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center overflow-hidden relative group"
        >
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-slate-700" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
            </div>
          )}

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
          >
            <Camera className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {preview && (
          <button
            onClick={() => {
              setPreview(null);
              onUpload(null);
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {uploading ? 'Enviando...' : 'Toque para mudar foto'}
      </p>
    </div>
  );
}
