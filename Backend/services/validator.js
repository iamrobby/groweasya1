import { ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCE } from "../config/crmschema.js";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /\+?\d[\d\s-]{7,14}\d/g;

/**
 * Ensures created_at is parseable by `new Date()`. If not, blanks it out
 * rather than letting an invalid date reach the CRM.
 */
function sanitizeDate(record) {
  if (!record.created_at) return record;
  const d = new Date(record.created_at);
  if (isNaN(d.getTime())) {
    // invalid date -> move the raw string into crm_note so info isn't lost, blank the field
    record.crm_note = record.crm_note
      ? `${record.crm_note} | Unparsed date: ${record.created_at}`
      : `Unparsed date: ${record.created_at}`;
    record.created_at = "";
  }
  return record;
}

/**
 * Safety net for the multiple email/mobile rule: if the "email" or
 * "mobile_without_country_code" field itself contains multiple values
 * (AI sometimes leaves them comma/slash separated), split and fix it.
 */
function enforceSingleContact(record) {
  // Emails
  const emailMatches = (record.email || "").match(EMAIL_REGEX) || [];
  if (emailMatches.length > 1) {
    const [first, ...rest] = emailMatches;
    record.email = first;
    record.crm_note = appendNote(record.crm_note, `Extra email(s): ${rest.join(", ")}`);
  }

  // Mobiles
  const mobileMatches = (record.mobile_without_country_code || "").match(PHONE_REGEX) || [];
  if (mobileMatches.length > 1) {
    const [first, ...rest] = mobileMatches;
    record.mobile_without_country_code = first.trim();
    record.crm_note = appendNote(record.crm_note, `Extra mobile(s): ${rest.map(r => r.trim()).join(", ")}`);
  }

  return record;
}

function appendNote(existingNote, addition) {
  return existingNote ? `${existingNote} | ${addition}` : addition;
}

/**
 * Ensures enum fields never contain a hallucinated value.
 */
function enforceEnums(record) {
  if (record.crm_status && !ALLOWED_CRM_STATUS.includes(record.crm_status)) {
    record.crm_note = appendNote(record.crm_note, `Unmapped status: ${record.crm_status}`);
    record.crm_status = "";
  }
  if (record.data_source && !ALLOWED_DATA_SOURCE.includes(record.data_source)) {
    record.crm_note = appendNote(record.crm_note, `Unmapped source: ${record.data_source}`);
    record.data_source = "";
  }
  return record;
}

/**
 * Final skip check: a record must have an email OR a mobile number.
 * Returns true if the record should be KEPT.
 */
function hasContactInfo(record) {
  return Boolean(record.email?.trim() || record.mobile_without_country_code?.trim());
}

/**
 * Runs the full validation/sanitization pipeline over AI-extracted records.
 * Returns { validRecords, skippedCount }.
 */
export function validateRecords(records) {
  let skippedCount = 0;
  const validRecords = [];

  for (const raw of records) {
    let record = { ...raw };
    record = sanitizeDate(record);
    record = enforceSingleContact(record);
    record = enforceEnums(record);

    if (!hasContactInfo(record)) {
      skippedCount++;
      continue;
    }

    validRecords.push(record);
  }

  return { validRecords, skippedCount };
}