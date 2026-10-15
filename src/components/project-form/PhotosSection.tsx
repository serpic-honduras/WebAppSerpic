
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Camera } from "lucide-react";
import { Photo } from "@/types/project";

interface PhotosSectionProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  readOnly?: boolean;
}

const PhotosSection = ({ photos, onPhotosChange, readOnly = false }: PhotosSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readAsDataUrl = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const fileArr = Array.from(files);
    const newPhotos = await Promise.all(
      fileArr.map(async (file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: await readAsDataUrl(file),
        caption: file.name,
        uploadDate: new Date().toISOString(),
      })),
    );

    onPhotosChange([...photos, ...newPhotos]);
    // reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(photo => photo.id !== photoId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!readOnly && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir Fotos
            </Button>
          </div>
          )}
          
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...photos]
                .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())
                .map((photo) => (
                <div key={photo.id} className="relative group border rounded-lg overflow-hidden bg-card">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-32 object-cover"
                  />
                  {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label="Eliminar foto"
                    className="absolute top-1 right-1 bg-card/90 hover:bg-destructive hover:text-white text-destructive rounded-full p-1 shadow-sm transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  )}
                  <p className="text-xs text-muted-foreground px-2 py-1 truncate text-left">
                    {photo.caption}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotosSection;
