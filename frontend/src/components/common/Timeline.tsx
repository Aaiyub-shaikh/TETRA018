import React from 'react';
import { Info, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export type TimelineEvent = {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Critical';
  targetType?: string;
  targetId?: string;
};

interface TimelineProps {
  events: TimelineEvent[];
  limit?: number;
}

export const Timeline: React.FC<TimelineProps> = ({ events, limit }) => {
  const displayedEvents = limit ? events.slice(0, limit) : events;

  const getSeverityStyles = (severity: TimelineEvent['severity']) => {
    switch (severity) {
      case 'Critical':
        return {
          icon: AlertCircle,
          color: 'text-rose-600 bg-rose-50 border-rose-100',
          dot: 'bg-rose-500 ring-rose-100',
        };
      case 'Warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 bg-amber-50 border-amber-100',
          dot: 'bg-amber-500 ring-amber-100',
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-600 bg-blue-50 border-blue-100',
          dot: 'bg-blue-500 ring-blue-100',
        };
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {displayedEvents.map((event, idx) => {
          const styles = getSeverityStyles(event.severity);
          const EventIcon = styles.icon;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {/* Connector line */}
                {idx !== displayedEvents.length - 1 && (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-[1px] bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex space-x-3">
                  {/* Timeline Badge */}
                  <div>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${styles.color} shadow-sm`}>
                      <EventIcon className="h-4.5 w-4.5" />
                    </span>
                  </div>

                  {/* Timeline Details */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {event.action} —{' '}
                          <span className="text-slate-500 font-medium">by {event.user}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-1">
                          {event.details}
                        </p>
                        
                        {event.targetType === 'Invoice' && (
                          <div className="mt-2">
                            <Link 
                              href={`/invoices/${event.targetId}`}
                              className="inline-flex items-center text-[10px] font-bold text-[#3E0856] hover:text-[#FAAE62] hover:underline transition-colors"
                            >
                              View Associated Invoice &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <div className="text-right whitespace-nowrap text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.timestamp.split(' ')[1]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Timeline;
