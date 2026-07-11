"use client";

import { useState } from "react";
import Papa from "papaparse";
import FileDropzone from "@/components/FileDropzone";
import DataTable from "@/components/DataTable";
import StepIndicator from "@/components/StepIndicator";
import { importCsv } from "@/lib/api";
import { CrmRecord, ImportResponse, RawRow, Step } from "@/types/crm";
import { AlertCircle, Loader2, RotateCcw, CheckCircle2 } from "lucide-react";
import Analytics from "@/components/Analytics";
const CRM_COLUMNS: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [rawColumns, setRawColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  function handleFileSelected(selected: File) {
    setError(null);

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid .csv file.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("File too large. Max size is 5MB.");
      return;
    }

    setFile(selected);

    Papa.parse<RawRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setError("The CSV file has no data rows.");
          return;
        }
        setRawColumns(results.meta.fields || []);
        setRawRows(results.data);
        setStep("preview");
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }

  async function handleConfirmImport() {
    if (!file) return;
    setStep("processing");
    setError(null);

    try {
      const response = await importCsv(file);
      setResult(response);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setStep("preview");
    }
  }

  function handleReset() {
    setStep("upload");
    setFile(null);
    setRawRows([]);
    setRawColumns([]);
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            GrowEasy CSV Lead Importer
          </h1>
          <p className="mt-2 text-gray-500">
            Upload any CSV format — our AI maps it to your CRM automatically.
          </p>
        </header>

        <div className="mb-10">
          <StepIndicator current={step} />
        </div>

        {error && step !== "preview" && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="mx-auto max-w-xl">
            <FileDropzone onFileSelected={handleFileSelected} error={error} />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Preview: {file?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {rawRows.length} rows detected. Review before importing —
                  no AI processing has happened yet.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Confirm Import
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <DataTable columns={rawColumns} rows={rawRows} maxHeight="480px" />
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="text-gray-600 font-medium">
              AI is mapping your leads to CRM format…
            </p>
            <p className="text-sm text-gray-400">
              This may take a few seconds depending on file size.
            </p>
          </div>
        )}

        {step === "results" && result && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Rows" value={result.total_input_rows} />
              <StatCard
                label="Imported"
                value={result.total_imported}
                accent="text-green-600"
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
              />
              <StatCard
                label="Skipped"
                value={result.total_skipped}
                accent="text-red-500"
                icon={<AlertCircle className="h-4 w-4 text-red-400" />}
              />
              <StatCard
                label="Failed Batches"
                value={result.failed_batches.length}
              />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Imported CRM Records
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Import Another File
              </button>
            </div>

            <DataTable
              columns={CRM_COLUMNS}
              rows={result.records as unknown as Record<string, string>[]}
              maxHeight="520px"
              emptyMessage="No records were successfully imported."
            />
          
          <Analytics records={result.records} totalSkipped={result.total_skipped} />
        </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent = "text-gray-900",
  icon,
}: {
  label: string;
  value: number;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}