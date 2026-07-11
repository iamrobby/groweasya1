"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText } from "lucide-react";

interface Props {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

export default function FileDropzone({ onFileSelected, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        onFileSelected(file); // let parent surface a clean error
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSelect(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors
          ${isDragging ? "border-orange-500 bg-orange-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
        `}
      >
        <div className="rounded-full bg-orange-100 p-4">
          <UploadCloud className="h-8 w-8 text-orange-500" />
        </div>
        <p className="text-lg font-medium text-gray-800">
          Drop your CSV file here
        </p>
        <p className="text-sm text-gray-500">or click to browse files</p>
        <div className="mt-2 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-gray-500 border">
          <FileText className="h-3.5 w-3.5" />
          Supported file: .csv (max 5MB)
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => validateAndSelect(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}