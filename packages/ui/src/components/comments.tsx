'use client';

import * as React from 'react';
import { MoreVertical, ArrowUp } from 'lucide-react';
import { formatDate } from '../lib/format-date';
import { Avatar } from './avatar';
import { Button } from './button';
import { Textarea } from './textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
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
    edited?: string;
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
    edited: '(изменён)',
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
      <div className="relative">
        <Textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={labels.placeholder}
          rows={3}
          className="resize-none pr-14 pb-12"
        />
        <Button
          onClick={handleAdd}
          disabled={!newCommentText.trim()}
          size="icon"
          className="absolute bottom-2 right-2 h-9 w-9 rounded-full"
          title={labels.send}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-0">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {labels.noComments}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 py-3">
                <Avatar
                  src={comment.userAvatar}
                  alt={comment.userName}
                  fallback={comment.userName.charAt(0).toUpperCase()}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt, locale)}
                      </span>
                      {comment.updatedAt && comment.updatedAt > comment.createdAt && (
                        <span className="text-xs text-muted-foreground italic">
                          {labels.edited}
                        </span>
                      )}
                    </div>
                    {comment.userId === currentUserId && editingId !== comment.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(comment)}>
                            {labels.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(comment.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            {labels.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
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
