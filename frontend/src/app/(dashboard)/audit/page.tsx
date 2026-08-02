'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  History, Search, Filter, Download, FileCheck, AlertTriangle, X,
  ChevronDown, ChevronRight, ArrowUpDown, FileText, RefreshCw
} from 'lucide-react';
import {
  fetchAuditTrailEvents,
  type AuditTrailEvent,
} from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import Loader from '@/components/common/Loader';

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'error', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  const bg = type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-white text-slate-800';
  const iconBg = type === 'success' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-100';
  const title = type === 'success' ? 'Action Completed' : 'Operation Failed';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl max-w-sm ${bg}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${iconBg}`}>
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold">{title}</span>
        <span className="text-[11px] leading-relaxed opacity-90">{message}</span>
      </div>
      <button onClick={onClose} className="ml-auto shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function DetailDialog({ event, onClose }: { event: AuditTrailEvent | null; onClose: () => void }) {
  if (!event) return null;
  const sevColor = event.severity === 'CRITICAL' ? 'text-rose-600 bg-rose-50 border-rose-100'
    : event.severity === 'HIGH' ? 'text-orange-600 bg-orange-50 border-orange-100'
    : event.severity === 'WARNING' ? 'text-amber-600 bg-amber-50 border-amber-100'
    : 'text-blue-600 bg-blue-50 border-blue-100';
  const statusColor = event.status === 'SUCCESS' ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
    : event.status === 'FAILED' ? 'text-rose-600 bg-rose-50 border-rose-100'
    : 'text-amber-600 bg-amber-50 border-amber-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Event Details</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Invoice Number</span>
              <p className="font-bold text-slate-800 mt-0.5">{event.invoice_number || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Event Type</span>
              <p className="font-bold text-slate-800 mt-0.5">{event.event_type}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Module</span>
              <p className="font-bold text-slate-800 mt-0.5">{event.module}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Performed By</span>
              <p className="font-bold text-slate-800 mt-0.5">{event.performed_by}</p>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Title</span>
            <p className="font-bold text-slate-800 mt-0.5">{event.title}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{event.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
              <p className="font-bold text-slate-800 mt-0.5">{event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN') : '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Severity</span>
              <p className={`inline-flex mt-0.5 rounded-lg border px-2 py-0.5 font-bold ${sevColor}`}>{event.severity}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
              <p className={`inline-flex mt-0.5 rounded-lg border px-2 py-0.5 font-bold ${statusColor}`}>{event.status}</p>
            </div>
          </div>
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Metadata</span>
              <pre className="mt-1 rounded-xl bg-slate-50 border border-slate-100 p-3 text-[10px] text-slate-600 overflow-x-auto max-h-48">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [events, setEvents] = useState<AuditTrailEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AuditTrailEvent | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadEvents = useCallback(() => {
    fetchAuditTrailEvents({
      search: searchTerm || undefined,
      severity: severityFilter !== 'ALL' ? severityFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
      limit: 200,
    })
      .then((res) => {
        setEvents(res.events || []);
        setTotal(res.total || 0);
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to load audit trail', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [searchTerm, severityFilter, statusFilter, moduleFilter]);

  useEffect(() => {
    setLoading(true);
    const delay = setTimeout(loadEvents, 300);
    return () => clearTimeout(delay);
  }, [loadEvents]);

  // Live polling every 10 seconds
  useEffect(() => {
    pollingRef.current = setInterval(loadEvents, 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadEvents]);

  const handleExportCsv = () => {
    try {
      const headers = ['Timestamp', 'Invoice Number', 'Event', 'Module', 'Severity', 'Status', 'Description', 'Performed By'];
      const rows = events.map(ev => [
        ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN') : '',
        ev.invoice_number,
        ev.event_type,
        ev.module,
        ev.severity,
        ev.status,
        ev.description,
        ev.performed_by,
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'CSV exported successfully.', type: 'success' });
    } catch (e: any) {
      setToast({ message: 'Failed to export: ' + e.message, type: 'error' });
    }
  };

  const handleExportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFontSize(14);
      doc.text('TETRA - Audit Trail Report', 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 22);
      doc.text(`Total Events: ${total}`, 14, 28);

      const headers = [['Timestamp', 'Invoice', 'Event', 'Module', 'Severity', 'Status', 'Description']];
      const rows = events.slice(0, 100).map(ev => [
        ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN') : '',
        ev.invoice_number || '—',
        ev.event_type,
        ev.module,
        ev.severity,
        ev.status,
        (ev.description || '').substring(0, 60),
      ]);

      autoTable(doc, { startY: 34, head: headers, body: rows, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [62, 8, 86] } });
      doc.save(`audit_trail_${new Date().toISOString().slice(0, 10)}.pdf`);
      setToast({ message: 'PDF exported successfully.', type: 'success' });
    } catch (e: any) {
      setToast({ message: 'PDF export requires jspdf. Use CSV instead.', type: 'error' });
    }
  };

  // Group events by time for timeline (last 10)
  const timelineEvents = events.slice(0, 10);

  const getSevStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'WARNING': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'FAILED': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader size="lg" label="Loading audit trail..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <DetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="h-5.5 w-5.5 text-[#3E0856]" />
            Audit Trail
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Real-time chronological trace of all system events and compliance actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadEvents} className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm">
            <RefreshCw className="h-4 w-4 text-[#3E0856]" />
            <span>Refresh</span>
          </button>
          <button onClick={handleExportCsv} className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm">
            <Download className="h-4 w-4 text-[#3E0856]" />
            <span>Export CSV</span>
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      {timelineEvents.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Recent Activity Timeline</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Latest {timelineEvents.length} events, newest first</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-slate-100" />
            <div className="space-y-4">
              {timelineEvents.map((ev, idx) => (
                <div key={ev._id || idx} className="relative pl-10">
                  <div className={`absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 ${ev.severity === 'CRITICAL' ? 'bg-rose-500 border-rose-200' : ev.severity === 'HIGH' ? 'bg-orange-500 border-orange-200' : ev.severity === 'WARNING' ? 'bg-amber-500 border-amber-200' : 'bg-blue-500 border-blue-200'}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">{ev.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{ev.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${getSevStyle(ev.severity)}`}>{ev.severity}</span>
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${getStatusStyle(ev.status)}`}>{ev.status}</span>
                        {ev.invoice_number && <span className="text-[9px] font-bold text-slate-400">{ev.invoice_number}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice number, event, module..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
            />
          </div>
          <div className="relative lg:col-span-2">
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer">
              <option value="ALL">All Severity</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative lg:col-span-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer">
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="WARNING">Warning</option>
            </select>
            <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative lg:col-span-2">
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer">
              <option value="ALL">All Modules</option>
              <option value="Upload">Upload</option>
              <option value="OCR">OCR</option>
              <option value="Extraction">Extraction</option>
              <option value="Validation">Validation</option>
              <option value="Risk Engine">Risk Engine</option>
              <option value="AI Analysis">AI Analysis</option>
              <option value="Storage">Storage</option>
              <option value="Pipeline">Pipeline</option>
              <option value="Email">Email</option>
              <option value="Vendor Import">Vendor Import</option>
              <option value="Ledger Import">Ledger Import</option>
            </select>
            <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={() => { setSearchTerm(''); setSeverityFilter('ALL'); setStatusFilter('ALL'); setModuleFilter('ALL'); }}
            className="lg:col-span-1 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer">
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm min-h-[200px] flex flex-col justify-center">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-600">{total} events recorded</span>
          </div>
        </div>
        {events.length === 0 ? (
          <EmptyState title="No audit events available" description="Upload an invoice or perform an action to generate audit trail events." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                  <th className="pb-3 pl-2">Timestamp</th>
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Module</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">By</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {events.map((ev, idx) => (
                  <tr key={ev._id || idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-2 text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 text-xs font-bold text-[#3E0856]">{ev.invoice_number || '—'}</td>
                    <td className="py-3 text-xs font-semibold text-slate-700 max-w-xs truncate">{ev.title}</td>
                    <td className="py-3 text-[11px] font-semibold text-slate-500">{ev.module}</td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold ${getSevStyle(ev.severity)}`}>{ev.severity}</span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold ${getStatusStyle(ev.status)}`}>{ev.status}</span>
                    </td>
                    <td className="py-3 text-[11px] font-semibold text-slate-500">{ev.performed_by}</td>
                    <td className="py-3 pr-2 text-right">
                      <button onClick={() => setSelectedEvent(ev)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-[#3E0856] hover:text-[#FAAE62] transition-all cursor-pointer">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
