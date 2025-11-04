import * as React from 'react';
import { cn } from '../lib/utils';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

export interface ImageUploadProps {
  // Core
  value?: string;
  onChange?: (value: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;

  // Validation
  maxSize?: number; // in MB
  accept?: string;
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
  enforceSquare?: boolean;

  // UI
  size?: 'sm' | 'md' | 'lg';
  showMetadata?: boolean;
  showProgress?: boolean;

  // Text overrides (optional, with i18n fallback)
  label?: string;
  helpText?: string;
}

interface ImageMetadata {
  name: string;
  size: number;
  width: number;
  height: number;
  format: string;
}

type UploadState = 'empty' | 'dragging' | 'converting' | 'loaded' | 'error';

const sizeClasses = {
  sm: 'h-40',
  md: 'h-64',
  lg: 'h-80',
};

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  (
    {
      value,
      onChange,
      onRemove,
      disabled = false,
      className,
      maxSize = 5,
      accept = 'image/png,image/jpeg,image/jpg',
      minDimensions,
      maxDimensions,
      enforceSquare = false,
      size = 'md',
      showMetadata = true,
      showProgress = true,
      label,
      helpText,
    },
    ref
  ) => {
    const [state, setState] = React.useState<UploadState>('empty');
    const [progress, setProgress] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);
    const [metadata, setMetadata] = React.useState<ImageMetadata | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Update state when value changes externally
    React.useEffect(() => {
      if (value && state !== 'loaded') {
        setState('loaded');
      } else if (!value && state === 'loaded') {
        setState('empty');
        setMetadata(null);
      }
    }, [value, state]);

    // Simulate progress for UX (since base64 conversion is instant)
    const simulateProgress = React.useCallback(() => {
      setProgress(0);
      const intervals = [20, 40, 60, 80, 100];
      const delay = 300; // 300ms between steps = 1.5s total

      intervals.forEach((target, index) => {
        setTimeout(() => {
          setProgress(target);
          if (target === 100) {
            setTimeout(() => setState('loaded'), 200);
          }
        }, delay * (index + 1));
      });
    }, []);

    const validateImage = async (file: File): Promise<ImageMetadata> => {
      return new Promise((resolve, reject) => {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          reject(`Файл слишком большой. Максимум ${maxSize} МБ`);
          return;
        }

        // Validate file type
        const allowedTypes = accept.split(',').map(t => t.trim());
        const fileType = file.type;
        if (!allowedTypes.some(type => {
          if (type === 'image/*') return fileType.startsWith('image/');
          return fileType === type;
        })) {
          reject(`Неверный формат. Разрешены: ${accept}`);
          return;
        }

        // Get image dimensions
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);

          const { width, height } = img;

          // Validate dimensions
          if (minDimensions && (width < minDimensions.width || height < minDimensions.height)) {
            reject(`Изображение слишком маленькое. Минимум ${minDimensions.width}×${minDimensions.height}px`);
            return;
          }

          if (maxDimensions && (width > maxDimensions.width || height > maxDimensions.height)) {
            reject(`Изображение слишком большое. Максимум ${maxDimensions.width}×${maxDimensions.height}px`);
            return;
          }

          if (enforceSquare && width !== height) {
            reject('Изображение должно быть квадратным');
            return;
          }

          const format = file.type.split('/')[1].toUpperCase();
          const metadata: ImageMetadata = {
            name: file.name,
            size: file.size,
            width,
            height,
            format,
          };

          resolve(metadata);
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject('Не удалось прочитать файл');
        };

        img.src = objectUrl;
      });
    };

    const handleFileChange = async (file: File) => {
      setError(null);
      setState('converting');

      try {
        // Validate image
        const meta = await validateImage(file);
        setMetadata(meta);

        // Convert to base64
        const reader = new FileReader();

        reader.onloadend = () => {
          const result = reader.result as string;

          if (showProgress) {
            simulateProgress();
          } else {
            setState('loaded');
          }

          onChange?.(result);
        };

        reader.onerror = () => {
          setState('error');
          setError('Не удалось прочитать файл');
        };

        reader.readAsDataURL(file);
      } catch (err) {
        setState('error');
        setError(typeof err === 'string' ? err : 'Ошибка при загрузке файла');
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
      // Reset input to allow re-selecting the same file
      event.target.value = '';
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled && state === 'empty') {
        setState('dragging');
      }
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (state === 'dragging') {
        setState('empty');
      }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setState('empty');

      if (disabled) return;

      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };

    const handleClick = () => {
      if (!disabled && (state === 'empty' || state === 'error')) {
        inputRef.current?.click();
      }
    };

    const handleReplace = (event: React.MouseEvent) => {
      event.stopPropagation();
      inputRef.current?.click();
    };

    const handleRemove = (event: React.MouseEvent) => {
      event.stopPropagation();
      setError(null);
      setMetadata(null);
      setState('empty');
      onChange?.(undefined as any);
      onRemove?.();
    };

    // Keyboard shortcuts
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      if (event.key === 'Delete' && state === 'loaded') {
        handleRemove(event as any);
      } else if (event.key === 'Enter' && (state === 'empty' || state === 'error')) {
        handleClick();
      }
    };

    // Clipboard paste
    React.useEffect(() => {
      if (disabled || state === 'loaded') return;

      const handlePaste = (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
              handleFileChange(file);
              event.preventDefault();
            }
            break;
          }
        }
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('paste', handlePaste);
        return () => container.removeEventListener('paste', handlePaste);
      }
    }, [disabled, state]);

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' Б';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
      return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
    };

    const renderEmpty = () => (
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer',
          sizeClasses[size],
          state === 'dragging' && 'border-primary bg-primary/5 scale-[1.02]',
          state === 'empty' && 'border-muted hover:border-primary/50 hover:bg-muted/30',
          disabled && 'opacity-50 cursor-not-allowed hover:border-muted hover:bg-transparent',
          state === 'error' && 'border-destructive bg-destructive/5'
        )}
      >
        {state === 'dragging' ? (
          <>
            <Upload className="h-12 w-12 text-primary animate-bounce" />
            <p className="text-sm text-primary font-semibold">
              Отпустите для загрузки
            </p>
          </>
        ) : state === 'error' ? (
          <>
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center px-6">
              <p className="text-sm font-medium text-destructive">
                {error}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleClick}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Попробовать снова
              </Button>
            </div>
          </>
        ) : (
          <>
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <div className="text-center px-6">
              <p className="text-sm font-medium text-foreground">
                {label || 'Загрузите изображение'}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                Нажмите или перетащите
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                или нажмите Ctrl+V
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {helpText || `PNG, JPG до ${maxSize} МБ`}
              </p>
            </div>
          </>
        )}
      </div>
    );

    const renderConverting = () => (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-primary bg-primary/5',
          sizeClasses[size]
        )}
      >
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
          <div
            className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin"
          />
        </div>

        <div className="text-center px-6 w-full">
          <p className="text-sm font-medium text-foreground mb-3">
            {progress < 100 ? `Загрузка ${progress}%` : 'Завершение...'}
          </p>

          {showProgress && (
            <div className="w-full max-w-[200px] mx-auto h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );

    const renderLoaded = () => (
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl border-2 border-muted bg-card p-6',
          sizeClasses[size]
        )}
      >
        {/* Image Preview */}
        <div className="relative flex-1 rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center">
          <img
            src={value}
            alt={metadata?.name || 'Preview'}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute top-2 right-2">
            <div className="bg-green-500 text-white rounded-full p-1.5">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Metadata */}
        {showMetadata && metadata && (
          <div className="space-y-1.5 px-2">
            <p className="text-sm font-medium text-foreground truncate">
              {metadata.name}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatFileSize(metadata.size)}</span>
              <span>•</span>
              <span>{metadata.width}×{metadata.height}px</span>
              <span>•</span>
              <span>{metadata.format}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!disabled && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReplace}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Заменить
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          </div>
        )}
      </div>
    );

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={label || 'Image upload'}
      >
        <div ref={containerRef}>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
            aria-hidden="true"
          />

          {state === 'empty' || state === 'dragging' || state === 'error' ? renderEmpty() : null}
          {state === 'converting' ? renderConverting() : null}
          {state === 'loaded' ? renderLoaded() : null}
        </div>
      </div>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';

export { ImageUpload };
