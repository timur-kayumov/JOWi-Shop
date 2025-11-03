'use client';

import * as React from 'react';
import { X, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface PosDownloadBannerProps {
  className?: string;
  onDownloadClick?: () => void;
}

export function PosDownloadBanner({
  className,
  onDownloadClick
}: PosDownloadBannerProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (isCollapsed) {
    return (
      <button
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-3",
          "text-sm font-medium text-white transition-colors hover:bg-primary/90",
          className
        )}
        onClick={onDownloadClick}
      >
        <Download className="h-4 w-4" />
        <span>POS-приложение</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-primary p-4",
        className
      )}
    >
      {/* Close button */}
      <button
        className="absolute right-2 top-2 rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        onClick={(e) => {
          e.stopPropagation();
          setIsCollapsed(true);
        }}
      >
        <X className="h-4 w-4" />
      </button>

      {/* Icons */}
      <div className="mb-3">
        <img
          src="/banner-icons.svg"
          alt="POS Icons"
          className="h-10"
        />
      </div>

      {/* Title */}
      <h3 className="mb-1 text-lg font-semibold leading-tight text-white">
        POS-терминал
        <br />
        для планшетов
      </h3>

      {/* Subtitle */}
      <p className="mb-4 text-sm text-white/80">
        Продающий подзаголовок
      </p>

      {/* Download Button */}
      <button
        className="w-full rounded-lg bg-white px-4 py-3 text-center text-base font-medium text-black transition-colors hover:bg-white/90"
        onClick={(e) => {
          e.stopPropagation();
          onDownloadClick?.();
        }}
      >
        Скачать
      </button>
    </div>
  );
}
