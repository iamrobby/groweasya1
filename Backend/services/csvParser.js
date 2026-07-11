import { parse } from "csv-parse/sync";

/**
 * Parses raw CSV buffer/string into an array of row objects.
 * Does NOT assume fixed column names — just reads whatever headers exist.
 */
export function parseCsv(csvString) {
  if (!csvString || !csvString.trim()) {
    throw new Error("CSV file is empty.");
  }

  let records;
  try {
    records = parse(csvString, {
      columns: true, // use first row as header keys
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, 
    });
  } catch (err) {
    throw new Error(`Failed to parse CSV: ${err.message}`);
  }

  if (!records.length) {
    throw new Error("CSV contains no data rows.");
  }

  return records;
}


  //Splits an array of rows into batches of a given size.
 
export function batchRecords(records, batchSize = 20) {
  const batches = [];
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }
  return batches;
}