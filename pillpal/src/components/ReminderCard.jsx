import { useState } from 'react';
import { Check, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export default function ReminderCard({ reminder, isDue, onEdit, onConfirm, onDelete }) {
  const timeDisplay = (reminder.remind_time || '').slice(0, 5);

  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300",
      isDue
        ? "border-amber-400 bg-amber-50 shadow-amber-100 shadow-md animate-pulse"
        : "border-border"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "text-2xl font-bold tabular-nums min-w-[80px]",
            isDue ? "text-amber-700" : "text-foreground"
          )}>
            {timeDisplay}
          </div>
          <div className="flex-1">
            <p className="text-lg text-foreground leading-tight">{reminder.memo || '—'}</p>
            {isDue && (
              <p className="text-base font-medium text-amber-600 mt-1">
                ⏰ {t('reminder_due')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-12 w-12 text-teal-600 hover:bg-teal-50"
            onClick={() => onConfirm(reminder)}
            title={t('confirm')}
          >
            <Check className="w-6 h-6" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-12 w-12">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(reminder)} className="text-lg py-3">
                <Pencil className="w-5 h-5 mr-2" />
                {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(reminder)} className="text-lg py-3 text-destructive">
                <Trash2 className="w-5 h-5 mr-2" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}