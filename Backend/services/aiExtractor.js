import OpenAI from "openai";
import dotenv from "dotenv";

import {
  CRM_FIELDS,
  ALLOWED_CRM_STATUS,
  ALLOWED_DATA_SOURCE,
} from "../config/crmschema.js";

dotenv.config();

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt() {
  return `You are a data extraction engine for a CRM system called GrowEasy.

You will receive an array of raw CSV row objects. Each row may come from a different source (Facebook Ads, Google Ads, Excel exports, real estate CRMs, manual spreadsheets) with inconsistent, messy, or ambiguous column names.

Your job: map each raw row to the following GrowEasy CRM schema, using your best judgement to infer which raw column(s) correspond to which CRM field, even if column names don't match exactly (e.g. "Phone", "Contact No", "Mobile No." all mean mobile_without_country_code).

CRM FIELDS:
${CRM_FIELDS.map((f) => `- ${f}`).join("\n")}

RULES:
1. crm_status: ONLY use one of: ${ALLOWED_CRM_STATUS.join(", ")}. If none apply confidently, leave it as an empty string "".
2. data_source: ONLY use one of: ${ALLOWED_DATA_SOURCE.join(", ")}. If none match confidently, leave it as an empty string "".
3. created_at: must be a valid date string parseable by JavaScript's \`new Date(created_at)\`. If no date is present, leave it as an empty string "".
4. crm_note: use this field for remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, or any useful info that doesn't map to another field.
5. If multiple emails exist in a row, use the first as "email" and append the rest into crm_note.
6. If multiple mobile numbers exist in a row, use the first as "mobile_without_country_code" and append the rest into crm_note.
7. country_code should be normalized to a "+" prefixed format (e.g. "+91"). If not present, infer from context if possible (e.g. country = India -> +91), else leave blank.
8. SKIP a record entirely (do not include it in output) if it has NEITHER an email NOR a mobile number.
9. Never invent data that isn't present or reasonably inferable.
10. Return ONLY valid JSON — no markdown, no code fences, no commentary.

OUTPUT FORMAT (strict JSON, no other text):
{
  "records": [
    { "created_at": "...", "name": "...", "email": "...", "country_code": "...", "mobile_without_country_code": "...", "company": "...", "city": "...", "state": "...", "country": "...", "lead_owner": "...", "crm_status": "...", "crm_note": "...", "data_source": "...", "possession_time": "...", "description": "..." }
  ],
  "skipped_count": <number of input rows skipped>
}

Every field must be present in every output record, using "" for unknown/empty values.`;
}


export async function extractBatch(rawRows, { retries = 2 } = {}) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = `Raw CSV rows (JSON array):\n${JSON.stringify(rawRows, null, 2)}`;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content;
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed.records)) {
        throw new Error("AI response missing 'records' array.");
      }

      return {
        records: parsed.records,
        skipped_count: parsed.skipped_count ?? 0,
      };
    } catch (err) {
      lastError = err;
      console.error(`AI batch extraction attempt ${attempt + 1} failed:`, err.message);
      // small backoff before retrying
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `AI extraction failed after ${retries + 1} attempts: ${lastError.message}`
  );
}