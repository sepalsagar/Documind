'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: any) => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stepper states
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setError(null);
    setCurrentStep(0);
    setUploadProgress(0);
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && !selectedFile.type.includes('pdf')) {
      setError('Please upload a valid PDF document (.pdf).');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB limit. Please select a smaller PDF file.');
      return;
    }
    setFile(selectedFile);
  };

  const startUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setCurrentStep(1); // Uploading
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    // Simulate animated step transitions for realistic UX
    const stepTimer1 = setTimeout(() => {
      setCurrentStep(2); // Extracting text
      setUploadProgress(50);
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setCurrentStep(3); // Creating embeddings
      setUploadProgress(80);
    }, 1400);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process and index PDF.');
      }

      setCurrentStep(4); // Document ready
      setUploadProgress(100);

      setTimeout(() => {
        onSuccess(data.document);
        handleClose();
      }, 1000);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setError(err.message || 'Error occurred while uploading document.');
      setCurrentStep(0);
      setUploading(false);
    }
  };

  return (
    <div
      id="upload_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        id="upload_modal_container"
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200/60">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Upload a document</h3>
              <p className="text-xs text-slate-500">Vectorize and index PDF for semantic Q&A</p>
            </div>
          </div>
          {!uploading && (
            <button
              id="close_upload_modal_btn"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div
              id="upload_error_banner"
              className="flex items-start space-x-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-sm"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Upload failed: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!uploading ? (
            <>
              {/* Dropzone */}
              <div
                id="pdf_dropzone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/40 scale-[1.01]'
                    : file
                    ? 'border-teal-400/80 bg-slate-50/60'
                    : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="pdf_file_input"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 shadow-xs">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-slate-900 max-w-xs truncate text-sm">
                      {file.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process
                    </span>
                    <span className="text-xs text-teal-600 font-medium pt-1 hover:underline">
                      Click to change file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        <span className="text-teal-600 font-semibold underline underline-offset-2">
                          Click to browse
                        </span>{' '}
                        or drag and drop your PDF here
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        PDF files up to 10 MB (searchable text recommended)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Security note */}
              <div className="flex items-center space-x-2 text-xs text-slate-400 px-1">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>Text is split into semantic chunks and embedded for grounded retrieval.</span>
              </div>
            </>
          ) : (
            /* Multi-step Processing Stepper */
            <div id="upload_processing_stepper" className="space-y-6 py-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                  <span>Processing pipeline</span>
                  <span className="font-mono text-teal-700">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {/* Step 1: Upload */}
                <div className="flex items-center space-x-3 text-sm">
                  {currentStep > 1 ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  ) : currentStep === 1 ? (
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200" />
                  )}
                  <span
                    className={
                      currentStep >= 1 ? 'font-medium text-slate-900' : 'text-slate-400'
                    }
                  >
                    Uploading document...
                  </span>
                </div>

                {/* Step 2: Extract text */}
                <div className="flex items-center space-x-3 text-sm">
                  {currentStep > 2 ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  ) : currentStep === 2 ? (
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200" />
                  )}
                  <span
                    className={
                      currentStep >= 2 ? 'font-medium text-slate-900' : 'text-slate-400'
                    }
                  >
                    Extracting text and structure...
                  </span>
                </div>

                {/* Step 3: Embeddings */}
                <div className="flex items-center space-x-3 text-sm">
                  {currentStep > 3 ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  ) : currentStep === 3 ? (
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200" />
                  )}
                  <span
                    className={
                      currentStep >= 3 ? 'font-medium text-slate-900' : 'text-slate-400'
                    }
                  >
                    Generating semantic vector embeddings...
                  </span>
                </div>

                {/* Step 4: Ready */}
                <div className="flex items-center space-x-3 text-sm">
                  {currentStep === 4 ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200" />
                  )}
                  <span
                    className={
                      currentStep === 4 ? 'font-medium text-teal-700 font-semibold' : 'text-slate-400'
                    }
                  >
                    Document ready for Q&A
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            id="cancel_upload_btn"
            type="button"
            disabled={uploading}
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="submit_upload_btn"
            type="button"
            disabled={!file || uploading}
            onClick={startUpload}
            className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                <span>Upload & Index</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
