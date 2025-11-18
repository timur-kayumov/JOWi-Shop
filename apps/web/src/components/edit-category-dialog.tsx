'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Input,
} from '@jowi/ui';
import { IconPickerPopover } from './icon-picker-popover';
import { ColorPickerPopover } from './color-picker-popover';

type Category = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
};

type EditCategoryDialogProps = {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; icon?: string; color?: string }) => void;
};

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
}: EditCategoryDialogProps) {
  const { t } = useTranslation('common');

  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon || 'Folder');
  const [color, setColor] = useState(category.color || '#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when category changes
  useEffect(() => {
    setName(category.name);
    setIcon(category.icon || 'Folder');
    setColor(category.color || '#3B82F6');
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ name, icon, color });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setName(category.name);
    setIcon(category.icon || 'Folder');
    setColor(category.color || '#3B82F6');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pages.categories.editCategory')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('fields.name')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('fields.name')}
                required
                autoFocus
              />
            </div>

            {/* Icon Field */}
            <div className="space-y-2">
              <Label>{t('fields.icon')}</Label>
              <IconPickerPopover
                value={icon}
                onChange={setIcon}
                label={t('fields.icon')}
              />
            </div>

            {/* Color Field */}
            <div className="space-y-2">
              <Label>{t('fields.color')}</Label>
              <ColorPickerPopover
                value={color}
                onChange={setColor}
                label={t('fields.color')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? t('actions.saving') : t('actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
