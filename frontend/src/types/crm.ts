export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface ImportResponse {
  success: boolean;
  total_input_rows: number;
  total_imported: number;
  total_skipped: number;
  failed_batches: number[];
  records: CrmRecord[];
}

export type RawRow = Record<string, string>;

export type Step = "upload" | "preview" | "processing" | "results";