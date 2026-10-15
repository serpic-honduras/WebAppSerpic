
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { Project } from "@/types/project";

interface PhotosCardProps {
  project: Project;
}

const PhotosCard = ({ project }: PhotosCardProps) => {
  // Only render if photos exist
  if (!project.photos?.length) {
    return null;
  }

  return (
    <Card className="lg:col-span-2 xl:col-span-1 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-foreground">
          <Camera className="h-5 w-5 text-primary" />
          <span>Fotos del Proyecto ({project.photos.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {project.photos
            .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
            .slice(0, 4)
            .map((photo, index) => (
              <div key={index} className="space-y-2">
                <img 
                  src={photo.url} 
                  alt={photo.caption || `Foto ${index + 1}`} 
                  className="w-full h-32 sm:h-40 object-cover rounded-lg border border-border"
                  loading="lazy"
                />
                {photo.caption && (
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium break-words">{photo.caption}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(photo.uploadDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            ))
          }
        </div>
        {project.photos.length > 4 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Y {project.photos.length - 4} fotos más...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotosCard;
