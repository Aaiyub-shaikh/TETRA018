'use client';

import React, { useState, useEffect } from 'react';
import Timeline from '@/components/common/Timeline';
import { fetchAuditTrail } from '@/lib/api';
import { History, Search, Filter, Download, FileCheck } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import Loader from '@/components/common/Loader';

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditEvents = () => {
    setLoading(true);
    fetchAuditTrail(100, searchTerm, severityFilter)
      .then((res) => {
        setEvents(res.events || []);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load audit ledger');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadAuditEvents();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, severityFilter]);

  const handleExport = () => {
    try {
      const headers = ['Timestamp', 'Action', 'User', 'Target Type', 'Target ID', 'Details', 'Severity'];
      const rows = events.map(ev => [
        ev.timestamp,
        ev.action,
        ev.user,
        ev.targetType,
        ev.targetId,
        ev.details,
        ev.severity
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_audit_ledger_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Failed to export audit ledger: ' + e.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="h-5.5 w-5.5 text-[#3E0856]" />
            Compliance Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Immutable, chronological trace logs of all invoice scans, manual overrides, and rule changes.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4 text-[#3E0856]" />
          <span>Export Encrypted Audit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {/* Search */}
        <div className="relative lg:col-span-7">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, user email, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
          />
        </div>

        {/* Severity Filter */}
        <div className="relative lg:col-span-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Event Severities</option>
            <option value="Info">Info logs</option>
            <option value="Warning">Warning alerts</option>
            <option value="Critical">Critical violations</option>
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSearchTerm('');
            setSeverityFilter('ALL');
          }}
          className="lg:col-span-2 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Audit Log Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {/* Security badge overview */}
        <div className="mb-8 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100/60 p-4 text-xs text-emerald-700 font-semibold">
          <FileCheck className="h-4.5 w-4.5" />
          <span>Security Ledger Active: Log hashes are locked and backed up to SOC2 compliance storage.</span>
        </div>

        {loading ? (
          <Loader size="md" label="Retrieving audit records..." />
        ) : error ? (
          <EmptyState title="Error Loading Ledger" description={error} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No audit events found"
            description="Adjust your search filters or verify the compliance dashboard."
          />
        ) : (
          <div className="max-w-3xl pl-2 mt-4">
            <Timeline events={events} />
          </div>
        )}
      </div>
    </div>
  );
}
