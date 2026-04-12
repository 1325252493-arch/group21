import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';
import moment from 'moment';

const typeColors = {
  confirmed_by_device: 'bg-blue-100 text-blue-700',
  confirmed_by_app: 'bg-teal-100 text-teal-700',
  pill_taken: 'bg-green-100 text-green-700',
  heartbeat: 'bg-gray-100 text-gray-600',
};

export default function EventCard({ event }) {
  const color = typeColors[event.event_type] || 'bg-gray-100 text-gray-600';
  const typeLabel = t(event.event_type) || event.event_type;
  const formattedTime = event.event_time
    ? moment(event.event_time).format('YYYY-MM-DD HH:mm:ss')
    : '—';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color}`}>
              {typeLabel}
            </span>
          </div>
          <p className="text-base text-muted-foreground">{formattedTime}</p>
          {event.memo && (
            <p className="text-lg text-foreground mt-1 break-words">{event.memo}</p>
          )}
        </div>
        {event.voltage != null && (
          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground">{t('voltage')}</p>
            <p className="text-lg font-semibold text-foreground">{event.voltage}V</p>
          </div>
        )}
      </div>
    </div>
  );
}