'use client';

import * as React from 'react';
import { Pencil, Trash2, Send } from 'lucide-react';
import { formatRelativeDate } from '../lib/format-date';
import { Avatar } from './avatar';
import { Button } from './button';
import { Textarea } from './textarea';
import { cn } from '../lib/utils';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CommentsProps {
  comments: Comment[];
  currentUserId: string;
  onAdd?: (text: string) => void | Promise<void>;
  onEdit?: (commentId: string, text: string) => void | Promise<void>;
  onDelete?: (commentId: string) => void | Promise<void>;
  locale?: 'ru' | 'uz';
  className?: string;
  // Labels for i18n
  labels?: {
    placeholder?: string;
    send?: string;
    edit?: string;
    delete?: string;
    noComments?: string;
  };
}

export function Comments({
  comments,
  currentUserId,
  onAdd,
  onEdit,
  onDelete,
  locale = 'ru',
  className,
  labels = {
    placeholder: 'Напишите комментарий...',
    send: 'Отправить',
    edit: 'Редактировать',
    delete: 'Удалить',
    noComments: 'Комментариев пока нет',
  },
}: CommentsProps) {
  const [newCommentText, setNewCommentText] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');

  const handleAdd = async () => {
    if (!newCommentText.trim()) return;
    await onAdd?.(newCommentText);
    setNewCommentText('');
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    await onEdit?.(commentId, editText);
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      await onDelete?.(commentId);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add new comment */}
      <div className="space-y-2">
        <Textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={labels.placeholder}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleAdd}
            disabled={!newCommentText.trim()}
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {labels.send}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {labels.noComments}
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg border bg-card"
            >
              <Avatar
                src={comment.userAvatar}
                alt={comment.userName}
                fallback={comment.userName.charAt(0).toUpperCase()}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(comment.createdAt, locale)}
                    </span>
                    {comment.updatedAt && comment.updatedAt > comment.createdAt && (
                      <span className="text-xs text-muted-foreground italic">
                        (изменён)
                      </span>
                    )}
                  </div>
                  {comment.userId === currentUserId && (
                    <div className="flex gap-1">
                      {editingId !== comment.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(comment)}
                            title={labels.edit}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(comment.id)}
                            title={labels.delete}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2 mt-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                        disabled={!editText.trim()}
                      >
                        Сохранить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.text}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
