'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, RefreshCw, CheckCircle2, XCircle, AlertOctagon, HelpCircle, User, Calendar, FileText } from 'lucide-react';
import { VerdictBadge } from './VerdictBadge';

interface AuditLogItem {
  id: string;
  test_case_id: string;
  test_case_no?: string;
  section?: string;
  prd_file_name?: string;
  tester_name?: string;
  tester_id?: string;
  submitted_by?: string;
  submitted_at?: string;
  actual_result: string;
  verdict: string;
  verdict_reason: string;
  created_at: string;
}

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        setError('Không thể tải nhật ký audit log');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Nhật Ký Nộp Bằng Chứng & AI Judge (Backend Audit Records)
              </h2>
              <p className="text-xs text-slate-400">
                Ghi nhận chi tiết danh tính người nộp (submitted_by) và thời gian thực hiện (submitted_at)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-12 bg-slate-950/40 rounded-xl border border-slate-800">
              <Database className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Chưa Có Bản Ghi Nộp Bằng Chứng Nào</p>
              <p className="text-xs text-slate-500 mt-1">Khi Tester thực hiện nộp kết quả test, bản ghi truy vết sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Tổng số bản ghi: <strong>{logs.length}</strong></span>
                <span>Traceability: submitted_by & submitted_at</span>
              </div>

              <div className="space-y-2.5">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                          {log.test_case_no || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          📄 {log.prd_file_name} • {log.section}
                        </span>
                      </div>
                      <VerdictBadge verdict={log.verdict as any} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">Người nộp (submitted_by):</span>
                          <strong className="text-slate-100">{log.submitted_by || log.tester_name || 'Anonymous'}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">Thời gian (submitted_at):</span>
                          <span className="text-slate-200 font-mono text-xs">
                            {new Date(log.submitted_at || log.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                      <p><strong className="text-slate-400">Kết quả thực tế:</strong> {log.actual_result}</p>
                      {log.verdict_reason && (
                        <p className="mt-1 text-slate-400"><strong className="text-indigo-300">Lý do AI Judge:</strong> {log.verdict_reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuditLogsModal;
