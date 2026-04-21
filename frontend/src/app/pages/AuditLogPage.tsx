/**
 * Audit Log Page 
 * View activity tracking for college admin actions
 */

import { useState, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { P } from '../../constants/theme';
import { auditLogAPI, collegeAPI } from '../../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const retryCountRef = useRef(0);
  
  // Filters
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  
  // Pagination
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchColleges();
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only fetch if initialized (prevents initial double-fetch before ready)
    if (isInitialized) {
      fetchAuditLogs();
    }
  }, [selectedCollege, startDate, endDate, actionTypeFilter, entityTypeFilter, skip, take, isInitialized]);

  const fetchColleges = async () => {
    try {
      const res = await collegeAPI.getAll(true);
      setColleges(res.data?.data || res.data || []);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Error fetching colleges:', error);
      // Retry once if it's a network error on first load
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(() => fetchColleges(), 2000); // Retry after 2 seconds
      } else {
        toast.error('Failed to load colleges');
      }
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams: Record<string, string | number> = {
        skip: skip.toString(),
        take: take.toString()
      };
      
      if (selectedCollege && selectedCollege !== 'all') queryParams.collegeId = selectedCollege;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;
      if (actionTypeFilter && actionTypeFilter !== 'all') queryParams.actionType = actionTypeFilter;
      if (entityTypeFilter && entityTypeFilter !== 'all') queryParams.entityType = entityTypeFilter;

      const params = new URLSearchParams(queryParams as Record<string, string>);
      const res = await auditLogAPI.get(`?${params.toString()}`);
      setLogs(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      // Only show error if it's not the very first load
      if (skip > 0 || selectedCollege !== 'all' || startDate || endDate || actionTypeFilter !== 'all' || entityTypeFilter !== 'all') {
        toast.error('Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const queryParams: Record<string, string | number> = {
        skip: '0',
        take: '10000'
      };
      
      if (selectedCollege && selectedCollege !== 'all') queryParams.collegeId = selectedCollege;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;
      if (actionTypeFilter && actionTypeFilter !== 'all') queryParams.actionType = actionTypeFilter;
      if (entityTypeFilter && entityTypeFilter !== 'all') queryParams.entityType = entityTypeFilter;

      const params = new URLSearchParams(queryParams as Record<string, string>);
      const res = await auditLogAPI.get(`?${params.toString()}`);
      const data = res.data?.data || [];

      // Convert to CSV
      const csv = [
        ['Timestamp', 'User', 'College', 'Action', 'Entity Type', 'Entity Name', 'IP Address'].join(','),
        ...data.map(log => [
          new Date(log.createdAt).toLocaleString(),
          `${log.user?.username || 'Unknown'} (${log.user?.first_name} ${log.user?.last_name})`,
          log.college?.name || 'Unknown',
          log.action || '',
          log.entityType || '',
          log.entityName || '',
          log.ipAddress || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };

  const getActionColor = (action: string | undefined): string => {
    if (action?.includes('CREATE')) return P.moss;
    if (action?.includes('UPDATE')) return P.purple;
    if (action?.includes('DELETE')) return P.vermillion;
    if (action?.includes('ACTIVATE')) return P.moss;
    if (action?.includes('DEACTIVATE')) return P.vermillion;
    return P.ink;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchment, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, outline: 'none', boxSizing: 'border-box' };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 };
  const softPanel = `inset 0 0 0 1px ${P.sandLight}, 0 12px 28px rgba(28,18,8,0.05)`;

  const pages = total > 0 ? Math.ceil(total / take) : 1;
  const currentPage = skip > 0 ? Math.floor(skip / take) + 1 : 1;

  return (
    <div style={{ padding: '16px 48px 32px 48px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Filters */}
      <div style={{ background: P.parchmentLight, boxShadow: softPanel, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'nowrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 auto', minWidth: 180 }}>
            <label style={iL}>College</label>
            <Select value={selectedCollege} onValueChange={(value) => { setSelectedCollege(value); setSkip(0); }}>
              <SelectTrigger style={iS}>
                <SelectValue placeholder="All Colleges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {colleges && colleges.length > 0 ? colleges.map((c: any) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>

          <div style={{ flex: '0.8 1 auto', minWidth: 150 }}>
            <label style={iL}>Start Date</label>
            <input type="date" style={iS} value={startDate} onChange={e => { setStartDate(e.target.value); setSkip(0); }} />
          </div>

          <div style={{ flex: '0.8 1 auto', minWidth: 150 }}>
            <label style={iL}>End Date</label>
            <input type="date" style={iS} value={endDate} onChange={e => { setEndDate(e.target.value); setSkip(0); }} />
          </div>

          <div style={{ flex: '0.9 1 auto', minWidth: 150 }}>
            <label style={iL}>Action Type</label>
            <Select value={actionTypeFilter} onValueChange={(value) => { setActionTypeFilter(value); setSkip(0); }}>
              <SelectTrigger style={iS}>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="ACTIVATE">Activate</SelectItem>
                <SelectItem value="DEACTIVATE">Deactivate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ flex: '0.9 1 auto', minWidth: 150 }}>
            <label style={iL}>Entity Type</label>
            <Select value={entityTypeFilter} onValueChange={(value) => { setEntityTypeFilter(value); setSkip(0); }}>
              <SelectTrigger style={iS}>
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="RESOURCE">Resource</SelectItem>
                <SelectItem value="MODULE">Module</SelectItem>
                <SelectItem value="MCQ">MCQ</SelectItem>
                <SelectItem value="MCQ_SET">MCQ Set</SelectItem>
                <SelectItem value="LEARNING_SITE">Learning Site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button onClick={exportLogs} style={{ padding: '9px 12px', background: P.vermillion, color: '#fff', border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>No audit logs found</div>
      ) : (
        <>
          <div style={{ background: P.parchmentLight, boxShadow: softPanel, overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${P.sand}` }}>
                  <th style={{ padding: 12, textAlign: 'left', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: P.inkSecondary, letterSpacing: '0.06em' }}>Timestamp</th>
                  <th style={{ padding: 12, textAlign: 'left', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: P.inkSecondary, letterSpacing: '0.06em' }}>Admin</th>
                  <th style={{ padding: 12, textAlign: 'left', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: P.inkSecondary, letterSpacing: '0.06em' }}>College</th>
                  <th style={{ padding: 12, textAlign: 'left', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: P.inkSecondary, letterSpacing: '0.06em' }}>Action</th>
                  <th style={{ padding: 12, textAlign: 'left', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: P.inkSecondary, letterSpacing: '0.06em' }}>Entity</th>
                  <th style={{ padding: 12, textAlign: 'left', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: P.inkSecondary, letterSpacing: '0.06em' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 && logs.map((log: any, idx: number) => (
                  <tr key={`${log.id}-${idx}`} style={{ borderBottom: `1px solid ${P.sandLight}`, background: idx % 2 === 0 ? 'transparent' : P.parchmentDark }}>
                    <td style={{ padding: 12, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink }}>{formatDate(log.createdAt)}</td>
                    <td style={{ padding: 12, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink }}>
                      <div>{log.user?.username || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: P.inkMuted }}>{log.user?.first_name || ''} {log.user?.last_name || ''}</div>
                    </td>
                    <td style={{ padding: 12, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink }}>{log.college?.name || 'Unknown'}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'inline-block', padding: '4px 8px', background: getActionColor(log.actionType), color: '#fff', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderRadius: 2, letterSpacing: '0.04em' }}>
                        {log.actionType || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: P.ink, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{log.entityType || '—'}</div>
                      <div style={{ fontSize: 12, color: P.inkMuted, marginTop: 4 }}>{log.entityName ? (log.entityName.substring(0, 50) + (log.entityName.length > 50 ? '...' : '')) : '—'}</div>
                    </td>
                    <td style={{ padding: 12, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: `1px solid ${P.sand}` }}>
            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted }}>
              Showing {skip + 1} to {Math.min(skip + take, total)} of {total} logs
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setSkip(Math.max(0, skip - take))} disabled={skip === 0} style={{ padding: '8px 12px', background: skip === 0 ? P.sandLight : P.parchmentDark, border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, cursor: skip === 0 ? 'default' : 'pointer', opacity: skip === 0 ? 0.5 : 1 }}>←</button>
              <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink, minWidth: 40, textAlign: 'center' }}>{currentPage} / {pages || 1}</span>
              <button onClick={() => setSkip(skip + take)} disabled={currentPage >= pages} style={{ padding: '8px 12px', background: currentPage >= pages ? P.sandLight : P.parchmentDark, border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, cursor: currentPage >= pages ? 'default' : 'pointer', opacity: currentPage >= pages ? 0.5 : 1 }}>→</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
