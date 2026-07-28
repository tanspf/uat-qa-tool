'use client';

import React, { useState } from 'react';
import { X, Upload, Sparkles, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface UploadPrdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (prdId: string) => void;
}

export const UploadPrdModal: React.FC<UploadPrdModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [prdText, setPrdText] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'file' && !file) {
      setError('Vui lòng chọn file PDF PRD');
      return;
    }
    if (inputMode === 'file' && file) {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > 4.5) {
        setError(`Dung lượng file PDF (${sizeMb.toFixed(1)}MB) vượt quá giới hạn 4.5MB của server Vercel. Vui lòng nén file hoặc chuyển sang chế độ "Nhập PRD Text".`);
        return;
      }
    }
    if (inputMode === 'text' && !prdText.trim()) {
      setError('Vui lòng nhập nội dung PRD');
      return;
    }

    setIsUploading(true);
    setError('');
    setStatusMessage('1/3. Đang tải lên tài liệu PRD...');

    try {
      const formData = new FormData();
      if (inputMode === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('prd_text', prdText);
      }

      // Progress animation update
      setTimeout(() => {
        setStatusMessage('2/3. Gemini LLM đang phân tích và sinh Test Cases (VN scope)...');
      }, 1000);

      const res = await fetch('/api/prds', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      let data: any = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        if (res.status === 413 || responseText.includes('Request Entity') || responseText.includes('Payload Too Large')) {
          throw new Error('Dung lượng file/dữ liệu PRD quá lớn (Request Entity Too Large). Vui lòng dán văn bản PRD hoặc dùng file PDF dưới 4.5MB.');
        }
        if (res.status === 504 || responseText.includes('Timeout')) {
          throw new Error('Thời gian phản hồi vượt quá giới hạn (Gateway Timeout). Vui lòng thử lại với tài liệu ngắn hơn.');
        }
        throw new Error(`Lỗi phản hồi máy chủ (HTTP ${res.status}): ${responseText.slice(0, 120)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Upload PRD thất bại (HTTP ${res.status})`);
      }

      setStatusMessage(`3/3. Hoàn tất! Đã sinh ${data.test_cases_count || 0} test case.`);
      setTimeout(() => {
        setIsUploading(false);
        onSuccess(data.prd.id);
        onClose();
      }, 600);
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || 'Có lỗi xảy ra khi xử lý PRD');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Upload PRD & Sinh Test Cases Tự Động</h2>
            <p className="text-xs text-slate-400">Hệ thống dùng AI Gemini trích xuất yêu cầu và tạo danh sách QA Test Cases</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-4 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              inputMode === 'file' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload File PDF
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              inputMode === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Nhập PRD Text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {inputMode === 'file' ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 text-center transition-colors bg-slate-900/50">
              <input
                type="file"
                accept=".pdf"
                id="prd-file-input"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <label htmlFor="prd-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-indigo-400 animate-bounce" />
                <span className="text-sm font-medium text-slate-200">
                  {file ? file.name : 'Kéo thả file PDF hoặc click để chọn'}
                </span>
                <span className="text-xs text-slate-500">Chấp nhận file .pdf (Tối đa 25MB)</span>
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nội dung PRD (Paste text):</label>
              <textarea
                rows={7}
                value={prdText}
                onChange={(e) => setPrdText(e.target.value)}
                placeholder="Dán toàn bộ tài liệu PRD hoặc User Stories tại đây..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                disabled={isUploading}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isUploading && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
              <span className="text-xs text-indigo-300 font-medium">{statusMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isUploading ? 'Đang xử lý...' : 'Bắt Đầu Sinh Test Cases'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
