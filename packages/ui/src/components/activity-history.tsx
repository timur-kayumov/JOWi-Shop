'use client';

import * as React from 'react';
import { Clock, Edit, FileText, CheckCircle, XCircle, User } from 'lucide-react';
import { formatDate } from '../lib/format-date';
import { Avatar } from './avatar';
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
      return <User className="h-4 w-4" />;
    case 'updated':
      return <Edit className="h-4 w-4" />;
    case 'status_changed':
      return <FileText className="h-4 w-4" />;
    case 'comment_added':
      return <FileText className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case 'created':
      return 'bg-green-500';
    case 'updated':
      return 'bg-blue-500';
    case 'status_changed':
      return 'bg-purple-500';
    case 'comment_added':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
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

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-sm text-muted-foreground">{labels.noActivities}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'rounded-full p-2 text-white',
                getActivityColor(activity.type)
              )}
            >
              {getActivityIcon(activity.type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 flex-1 bg-border mt-2" />
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 pb-6">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{activity.userName}</span>
                <span className="text-sm text-muted-foreground">
                  {getActivityLabel(activity)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(activity.timestamp, locale)}
              </span>
            </div>

            {/* Activity details */}
            <div className="mt-2 space-y-2">
              {activity.description && (
                <p className="text-sm text-foreground">{activity.description}</p>
              )}

              {/* Status change */}
              {activity.type === 'status_changed' && activity.oldStatus && activity.newStatus && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{activity.oldStatus}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline">{activity.newStatus}</Badge>
                </div>
              )}

              {/* Field changes */}
              {activity.type === 'updated' && activity.changes && activity.changes.length > 0 && (
                <div className="space-y-1">
                  {activity.changes.map((change, idx) => (
                    <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                      <span className="font-medium">{change.fieldLabel}:</span>{' '}
                      <span className="text-muted-foreground line-through">
                        {change.oldValue}
                      </span>{' '}
                      <span className="text-muted-foreground">→</span>{' '}
                      <span className="text-foreground font-medium">
                        {change.newValue}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
