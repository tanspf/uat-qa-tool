'use client';

import React, { useState } from 'react';
import { TestCase, EvidenceType, FILE_CONSTRAINTS } from '@/lib/types';
import { VerdictBadge } from './VerdictBadge';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Video, FileCode } from 'lucide-react';

interface TestExecutionModalProps {
  testCase: TestCase;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function TestExecutionModal({
  testCase,
  isOpen,
  onClose,
  onSubmitted,
}: TestExecutionModalProps) {
  const [actualResult, setActualResult] = useState('');
  const [testerName, setTesterName] = useState('Tester UAT');
  // FIX #4: Checkboxes default to empty array [] so evidence types are NOT pre-checked!
  const [selectedEvidenceTypes, setSelectedEvidenceTypes] = useState<EvidenceType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTypeToggle = (type: EvidenceType) => {
    if (selectedEvidenceTypes.includes(type)) {
      setSelectedEvidenceTypes(selectedEvidenceTypes.filter(t => t !== type));
    } else {
      setSelectedEvidenceTypes([...selectedEvidenceTypes, type]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    // Validate file count limit
    if (selectedFiles.length + newFiles.length > FILE_CONSTRAINTS.MAX_EVIDENCE_FILES_COUNT) {
      setErrorMsg(`Chỉ được tải lên tối đa ${FILE_CONSTRAINTS.MAX_EVIDENCE_FILES_COUNT} file bằng chứng.`);
      return;
    }

    // Validate file size limit (15MB) & format
    for (const f of newFiles) {
      const sizeMb = f.size / (1024 * 1024);
      if (sizeMb > FILE_CONSTRAINTS.MAX_EVIDENCE_SIZE_MB) {
        setErrorMsg(`File ${f.name} vượt quá dung lượng ${FILE_CONSTRAINTS.MAX_EVIDENCE_SIZE_MB}MB.`);
        return;
      }
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      if (!FILE_CONSTRAINTS.ALLOWED_EVIDENCE_EXTENSIONS.includes(ext)) {
        setErrorMsg(`Định dạng file ${ext} không được hỗ trợ cho bằng chứng test.`);
        return;
      }
    }

    setErrorMsg(null);
    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);

    // Auto-detect evidence types based on attached files if not explicitly selected
    const detectedTypes = new Set<EvidenceType>(selectedEvidenceTypes);
    updatedFiles.forEach(f => {
      if (f.type.startsWith('image/')) detectedTypes.add('screenshot');
      else if (f.type.startsWith('video/')) detectedTypes.add('video');
      else if (f.type.includes('json') || f.type.includes('xml')) detectedTypes.add('api_response');
      else if (f.type.includes('log') || f.name.endsWith('.log') || f.name.endsWith('.txt')) detectedTypes.add('log');
    });
    setSelectedEvidenceTypes(Array.from(detectedTypes));
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualResult.trim()) {
      setErrorMsg('Vui lòng nhập kết quả thực tế thu được khi test');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('test_case_id', testCase.id);
      formData.append('actual_result', actualResult);
      formData.append('tester_name', testerName);
      formData.append('evidence_type_submitted', JSON.stringify(selectedEvidenceTypes));

      selectedFiles.forEach(f => {
        formData.append('evidence_files', f);
      });

      const res = await fetch('/api/test-results', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      let errJson: any = {};
      try {
        errJson = JSON.parse(responseText);
      } catch {
        if (res.status === 413 || responseText.includes('Request Entity') || responseText.includes('Payload Too Large')) {
          throw new Error('Dung lượng tệp bằng chứng đính kèm quá lớn (Request Entity Too Large). Vui lòng chọn ảnh/video dung lượng nhỏ hơn.');
        }
        throw new Error(`Lỗi máy chủ (HTTP ${res.status}): ${responseText.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(errJson.error || `Lỗi khi gửi đánh giá (HTTP ${res.status})`);
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi chấm điểm AI');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
              {testCase.test_case_no}
            </span>
            <h3 className="text-lg font-bold text-slate-100">Thực Hiện Test & Nộp Bằng Chứng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Test Case Context Box */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mục & Precondition:</span>
              <p className="text-sm text-slate-200 mt-0.5 font-medium">{testCase.section} • {testCase.precondition || 'Không có'}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Các bước thực hiện:</span>
              <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-line">{testCase.steps}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kết quả kỳ vọng (Expected Result):</span>
              <p className="text-sm text-emerald-400 mt-0.5 font-medium">{testCase.expected_result}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Bằng chứng bắt buộc:</span>
              <div className="flex gap-1.5">
                {testCase.required_evidence_type.map(t => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Tester Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Người Thực Hiện (Tester Name):
              </label>
              <input
                type="text"
                value={testerName}
                onChange={e => setTesterName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Nhập tên của bạn..."
              />
            </div>

            {/* Actual Result */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Kết Quả Thực Tế Thu Được (Actual Result) *
              </label>
              <textarea
                rows={3}
                value={actualResult}
                onChange={e => setActualResult(e.target.value)}
                placeholder="Mô tả chi tiết những gì xảy ra thực tế khi bạn thực hiện test case này..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
              />
            </div>

            {/* FIX #4: Evidence Type Checkboxes (UNCHECKED BY DEFAULT) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Các Loại Bằng Chứng Đã Chọn / Đính Kèm:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'screenshot', label: 'Screenshot (Ảnh chụp)', icon: ImageIcon },
                  { id: 'video', label: 'Screen Recording (Video)', icon: Video },
                  { id: 'api_response', label: 'API Response (JSON/XML)', icon: FileCode },
                  { id: 'log', label: 'Log (Console / System Log)', icon: FileText },
                ].map(({ id, label, icon: Icon }) => {
                  const isChecked = selectedEvidenceTypes.includes(id as EvidenceType);
                  const isRequired = testCase.required_evidence_type.includes(id as EvidenceType);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTypeToggle(id as EvidenceType)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition ${
                        isChecked
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by button click
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="flex-1 font-medium">{label}</span>
                      {isRequired && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          Bắt buộc
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FIX #1: Evidence Upload Area with Clear Constraints & Size Limits Display */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Upload Tệp Bằng Chứng (Tối đa 5 file, 15MB/file)
              </label>
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 text-center transition">
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov,.txt,.log,.json,.xml"
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-file-input"
                />
                <label htmlFor="evidence-file-input" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 mx-auto text-indigo-400" />
                  <p className="text-xs text-slate-300 font-medium">
                    Nhấp vào đây hoặc kéo thả file để đính kèm bằng chứng
                  </p>
                  
                  {/* EXPLICIT CONSTRAINTS UI DISPLAY */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 mt-1">
                    <span>📷 Ảnh (.png, .jpg, .webp)</span>
                    <span>•</span>
                    <span>🎥 Video (.mp4, .webm)</span>
                    <span>•</span>
                    <span>📄 Log/JSON (.txt, .json)</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Giới hạn: Tối đa <strong>15MB/file</strong> • Tối đa <strong>5 file</strong>
                  </p>
                </label>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-xs font-medium text-slate-400">Tệp đã chọn ({selectedFiles.length}/5):</span>
                  <div className="space-y-1.5">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <span className="text-slate-200 truncate">{file.name}</span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-slate-500 hover:text-rose-400 transition p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Đang Chấm Điểm...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nộp & AI Chấm Điểm Verdict</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default TestExecutionModal;
