import { ImportResponse } from "@/types/crm";

const API_URL = "http://localhost:5000";

export async function importCsv(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/import`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}