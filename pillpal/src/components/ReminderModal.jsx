import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';

export default function ReminderModal({ open, onOpenChange, reminder, onSave, saving }) {
  const [time, setTime] = useState('08:00');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (reminder) {
      setTime((reminder.remind_time || '08:00:00').slice(0, 5));
      setMemo(reminder.memo || '');
    } else {
      setTime('08:00');
      setMemo('');
    }
  }, [reminder, open]);

  const handleSave = () => {
    const remindTime = time.length === 5 ? time + ':00' : time;
    onSave({ remind_time: remindTime, memo });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {reminder ? t('edit_reminder') : t('add_reminder')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-lg">{t('time')}</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-14 text-xl text-center font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg">{t('memo')}</Label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t('memo')}
              className="h-14 text-lg"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-lg"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12 text-lg bg-teal-600 hover:bg-teal-700"
          >
            {saving ? t('loading') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}