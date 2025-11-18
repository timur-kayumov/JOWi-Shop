'use client';

import * as React from 'react';
import { Plus, Edit, XCircle, FileText } from 'lucide-react';
import { formatActivityDate } from '../lib/format-date';
import { Badge } from './badge';
import { cn } from '../lib/utils';

export type ActivityType = 'created' | 'updated' | 'status_changed' | 'comment_added';

export interface FieldChange {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  description?: string;
  // For field updates
  changes?: FieldChange[];
  // For status changes
  oldStatus?: string;
  newStatus?: string;
}

export interface ActivityHistoryProps {
  activities: Activity[];
  locale?: 'ru' | 'uz';
  className?: string;
  // Labels for i18n
  labels?: {
    created?: string;
    updated?: string;
    statusChanged?: string;
    commentAdded?: string;
    noActivities?: string;
    from?: string;
    to?: string;
  };
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'created':
      return <Plus className="h-4 w-4" />;
    case 'updated':
      return <Edit className="h-4 w-4" />;
    case 'status_changed':
      return <FileText className="h-4 w-4" />;
    case 'comment_added':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getActivityIconColor(type: ActivityType) {
  switch (type) {
    case 'created':
      return 'bg-gray-400';
    case 'updated':
      return 'bg-yellow-500';
    case 'status_changed':
      return 'bg-green-500';
    case 'comment_added':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

function getActivityBorderColor(activity: Activity): string {
  // Определяем цвет бордера на основе типа действия и контекста
  if (activity.type === 'created') {
    return 'border-gray-400';
  }

  if (activity.type === 'status_changed') {
    // Публикация - зелёный
    if (activity.newStatus === 'Опубликовано' || activity.newStatus === 'Опубликована') {
      return 'border-green-500';
    }
    // Отмена - красный
    if (activity.newStatus === 'Отменено' || activity.newStatus === 'Отменена') {
      return 'border-red-500';
    }
    // Остальные смены статуса - жёлтый
    return 'border-yellow-500';
  }

  if (activity.type === 'updated') {
    // Изменения после публикации - жёлтый
    return 'border-yellow-500';
  }

  // По умолчанию - без бордера
  return '';
}

export function ActivityHistory({
  activities,
  locale = 'ru',
  className,
  labels = {
    created: 'Создана',
    updated: 'Изменена',
    statusChanged: 'Статус изменён',
    commentAdded: 'Комментарий добавлен',
    noActivities: 'История изменений пуста',
    from: 'с',
    to: 'на',
  },
}: ActivityHistoryProps) {
  const getActivityLabel = (activity: Activity): string => {
    switch (activity.type) {
      case 'created':
        return labels.created || 'Создана';
      case 'updated':
        return labels.updated || 'Изменена';
      case 'status_changed':
        return labels.statusChanged || 'Статус изменён';
      case 'comment_added':
        return labels.commentAdded || 'Комментарий добавлен';
      default:
        return '';
    }
  };

  // Sort activities by timestamp descending (newest first)
  const sortedActivities = React.useMemo(() => {
    return [...activities].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [activities]);

  if (sortedActivities.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-sm text-muted-foreground">{labels.noActivities}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {sortedActivities.map((activity, index) => {
        const borderColor = getActivityBorderColor(activity);
        const hasContentBlock =
          activity.description ||
          (activity.type === 'status_changed' && activity.newStatus) ||
          (activity.type === 'updated' && activity.changes && activity.changes.length > 0);

        return (
          <div key={activity.id} className="flex gap-3">
            {/* Left side: Icon + Timeline line */}
            <div className="flex flex-col items-center">
              {/* Activity icon */}
              <div
                className={cn(
                  'rounded-full p-2 text-white flex-shrink-0',
                  getActivityIconColor(activity.type)
                )}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Timeline line */}
              {index < sortedActivities.length - 1 && (
                <div className="w-0.5 flex-1 bg-border mt-2" />
              )}
            </div>

            {/* Right side: Content */}
            <div className="flex-1 pb-6">
              {/* Header: Username · Date · Time */}
              <div className="text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">{activity.userName}</span>
                {' · '}
                <span>{formatActivityDate(activity.timestamp, locale)}</span>
              </div>

              {/* Content block with border */}
              {hasContentBlock && (
                <div
                  className={cn(
                    'bg-muted/50 p-3 rounded-lg space-y-2',
                    borderColor && `border-l-4 ${borderColor}`
                  )}
                >
                  {/* Description or action label */}
                  {activity.description && (
                    <p className="text-sm text-foreground">{activity.description}</p>
                  )}

                  {/* Status change with badge */}
                  {activity.type === 'status_changed' && activity.newStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-foreground">Статус изменён на:</span>
                      <Badge variant="outline">{activity.newStatus}</Badge>
                    </div>
                  )}

                  {/* Field changes */}
                  {activity.type === 'updated' && activity.changes && activity.changes.length > 0 && (
                    <div className="space-y-1">
                      {activity.changes.map((change, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-foreground">{change.fieldLabel}:</span>{' '}
                          <span className="text-muted-foreground line-through">
                            {change.oldValue}
                          </span>{' '}
                          <span className="text-muted-foreground">→</span>{' '}
                          <span className="text-amber-700 font-medium">{change.newValue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
