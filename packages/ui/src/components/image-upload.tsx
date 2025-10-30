import * as React from 'react';
import { cn } from '../lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';

export interface ImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  maxSize?: number; // in MB
  accept?: string;
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  (
    {
      value,
      onChange,
      onRemove,
      disabled = false,
      className,
      maxSize = 5,
      accept = 'image/*',
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File) => {
      setError(null);

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`Файл слишком большой. Максимальный размер: ${maxSize}MB`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onChange?.(result);
      };
      reader.onerror = () => {
        setError('Ошибка при чтении файла');
      };
      reader.readAsDataURL(file);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const handleRemove = (event: React.MouseEvent) => {
      event.stopPropagation();
      setError(null);
      onRemove?.();
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {value ? (
          // Image preview
          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-muted group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleRemove}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Upload area
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-full aspect-square rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer',
              isDragging && 'border-primary bg-primary/5',
              !isDragging && 'border-muted hover:border-primary/50 hover:bg-muted/50',
              disabled && 'opacity-50 cursor-not-allowed hover:border-muted hover:bg-transparent',
              error && 'border-destructive'
            )}
          >
            {isDragging ? (
              <>
                <Upload className="h-10 w-10 text-primary" />
                <p className="text-sm text-primary font-medium">
                  Отпустите для загрузки
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <div className="text-center px-4">
                  <p className="text-sm text-muted-foreground">
                    Нажмите или перетащите изображение
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG до {maxSize}MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </div>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';

export { ImageUpload };
