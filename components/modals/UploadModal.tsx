'use client';

import React, { useState, useRef } from 'react';
import { DocumentItem } from '@/lib/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (newDoc: DocumentItem) => void;
  onOpenWorkspace?: (newDoc: DocumentItem) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

const UploadModalDialog: React.FC<{
  onClose: () => void;
  onUploadComplete: (newDoc: DocumentItem) => void;
  onOpenWorkspace?: (newDoc: DocumentItem) => void;
}> = ({ onClose, onUploadComplete, onOpenWorkspace }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<'uploading' | 'extracting' | 'embeddings' | 'ready' | 'error'>(
    'uploading'
  );
  const [statusMessage, setStatusMessage] = useState<string>('Ready to ingest');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedDoc, setCompletedDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);

    const isPdfMime = file.type === 'application/pdf';
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfMime && !isPdfExt) {
      setErrorMessage('Invalid file type. Only PDF documents (.pdf) are supported.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File exceeds 10MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`
      );
      return false;
    }

    if (file.size === 0) {
      setErrorMessage('The selected PDF file is completely empty (0 bytes).');
      return false;
    }

    setSelectedFile(file);
    setStatusMessage('PDF verified and ready for ingestion');
    return true;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateAndSelectFile(file)) {
        void startIngestion(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateAndSelectFile(file)) {
        void startIngestion(file);
      }
    }
  };

  const startIngestion = async (fileToUpload?: File) => {
    const targetFile = fileToUpload || selectedFile;
    if (!targetFile) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStep('uploading');
    setProgress(15);
    setStatusMessage('Uploading PDF binary to server...');

    // Timers to reflect honest pipeline stages while awaiting synchronous backend processing
    const t1 = setTimeout(() => {
      setStep('extracting');
      setProgress(45);
      setStatusMessage('Extracting text and preserving page boundaries...');
    }, 1200);

    const t2 = setTimeout(() => {
      setStep('embeddings');
      setProgress(75);
      setStatusMessage('Creating chunks and generating Gemini embeddings...');
    }, 3200);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      const cleanTitle = targetFile.name.replace(/\.pdf$/i, '');
      formData.append('title', cleanTitle);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || `Upload failed with status code ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const newDoc: DocumentItem = data.document;

      setStep('ready');
      setProgress(100);
      setStatusMessage('Document successfully ingested and indexed!');
      setCompletedDoc(newDoc);
      onUploadComplete(newDoc);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setStep('error');
      setErrorMessage(err?.message || 'Failed to process and vectorize PDF.');
      setIsProcessing(false);
    }
  };

  const handleDoneOrOpen = (openInWorkspace = false) => {
    if (completedDoc && openInWorkspace && onOpenWorkspace) {
      onOpenWorkspace(completedDoc);
    }
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200">
      <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100/80 w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
            </div>
            <div>
              <h3 className="text-base text-slate-800 font-bold">Upload a document</h3>
              <p className="text-[11px] text-slate-400 font-normal">
                Real PDF parsing & Gemini vector embedding pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing && step !== 'ready'}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
                error
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-bold block">Ingestion Failed</span>
                <span className="text-rose-600 leading-relaxed block mt-0.5">
                  {errorMessage}
                </span>
              </div>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => {
              if (!isProcessing || step === 'ready') {
                fileInputRef.current?.click();
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center group ${
              isProcessing
                ? 'border-slate-200 bg-slate-50/50 cursor-not-allowed'
                : 'border-teal-200/80 hover:border-teal-500 bg-teal-50/20 hover:bg-teal-50/40 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              id="pdf-file-input"
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileInput}
              disabled={isProcessing && step !== 'ready'}
            />
            <div className="w-14 h-14 rounded-2xl bg-white border border-teal-100 shadow-sm flex items-center justify-center text-teal-600 group-hover:scale-105 group-hover:shadow-md transition-all mb-2.5">
              <span className="material-symbols-outlined text-[32px]">
                {step === 'ready' ? 'task_alt' : 'upload_file'}
              </span>
            </div>
            <p className="text-[13.5px] font-bold text-slate-800 mb-0.5">
              {selectedFile ? (
                <span>
                  Selected: <span className="text-teal-700">{selectedFile.name}</span>
                </span>
              ) : (
                <span>
                  Drop your PDF here, or{' '}
                  <span className="text-teal-600 underline underline-offset-2">click to browse</span>
                </span>
              )}
            </p>
            <span className="text-[12px] text-slate-400">
              {selectedFile
                ? `${formatSize(selectedFile.size)} • Click to choose another file`
                : 'PDF files up to 10 MB'}
            </span>
          </div>

          {/* Ingestion Status Card */}
          {(isProcessing || selectedFile || completedDoc) && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/70 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {step === 'ready' ? 'check_circle' : 'description'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 font-bold truncate">
                      {selectedFile ? selectedFile.name : 'Ingestion Pipeline'}
                    </p>
                    <span className="font-mono text-[11px] text-slate-500">
                      {statusMessage}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-teal-700 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 shrink-0">
                  {step === 'ready' ? '100%' : `${progress}%`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === 'error'
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-teal-600 to-teal-400'
                  }`}
                  style={{ width: `${step === 'error' ? 100 : progress}%` }}
                ></div>
              </div>

              {/* Pipeline Step Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-0.5">
                <div
                  className={`flex items-center gap-1 font-mono text-[11px] font-semibold ${
                    step === 'uploading' ||
                    step === 'extracting' ||
                    step === 'embeddings' ||
                    step === 'ready'
                      ? 'text-teal-700'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {step === 'uploading' && isProcessing ? 'sync' : 'check'}
                  </span>
                  <span>Uploading</span>
                </div>
                <div
                  className={`flex items-center gap-1 font-mono text-[11px] font-semibold ${
                    step === 'extracting' || step === 'embeddings' || step === 'ready'
                      ? 'text-teal-700'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {step === 'extracting' && isProcessing ? 'sync' : 'check'}
                  </span>
                  <span>Extracting</span>
                </div>
                <div
                  className={`flex items-center gap-1 font-mono text-[11px] ${
                    step === 'embeddings' || step === 'ready'
                      ? 'text-teal-700 font-bold'
                      : 'text-slate-400 opacity-70'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      step === 'embeddings' && isProcessing
                        ? 'bg-teal-600 animate-pulse'
                        : 'bg-teal-500'
                    }`}
                  ></span>
                  <span>Embedding</span>
                </div>
                <div
                  className={`flex items-center gap-1 font-mono text-[11px] ${
                    step === 'ready' ? 'text-teal-700 font-bold' : 'text-slate-400 opacity-70'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>{step === 'ready' ? 'Indexed!' : 'Persisting'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isProcessing && step !== 'ready'}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-semibold transition-colors disabled:opacity-40"
          >
            {step === 'ready' ? 'Close' : 'Cancel'}
          </button>

          {step === 'ready' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDoneOrOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Done
              </button>
              {onOpenWorkspace && completedDoc && (
                <button
                  onClick={() => handleDoneOrOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
                >
                  <span>Open in Workspace</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              )}
            </div>
          ) : !isProcessing ? (
            <button
              onClick={() => void startIngestion()}
              disabled={!selectedFile}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-40"
            >
              Start Vector Ingestion
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold opacity-75 cursor-not-allowed flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
              <span>Processing PDF...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  onOpenWorkspace,
}) => {
  if (!isOpen) return null;

  return (
    <UploadModalDialog
      onClose={onClose}
      onUploadComplete={onUploadComplete}
      onOpenWorkspace={onOpenWorkspace}
    />
  );
};
