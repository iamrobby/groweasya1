import { Router } from "express";
import multer from "multer";
import { parseCsv, batchRecords } from "../services/csvParser.js";
import { extractBatch } from "../services/aiExtractor.js";
import { validateRecords } from "../services/validator.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, //5MB
});

//parse & preview
router.post("/preview", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const csvString = req.file.buffer.toString("utf-8");
    const records = parseCsv(csvString);
    res.json({ rows: records, total: records.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// full import with AI extraction
router.post("/", upload.single("file"), async (req, res) => {
  //handle error
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const csvString = req.file.buffer.toString("utf-8");
    const rawRecords = parseCsv(csvString);
    const batches = batchRecords(rawRecords, 20);

    const allParsed = [];
    let totalSkipped = 0;
    const failedBatches = [];

    for (let i = 0; i < batches.length; i++) {
      try {
        const { records, skipped_count } = await extractBatch(batches[i]);
        const { validRecords, skippedCount } = validateRecords(records);//extra security layer for messy layers
        allParsed.push(...validRecords);
        
        totalSkipped += skipped_count+skipped_count;
      } catch (err) {
        console.error(`Batch ${i} permanently failed:`, err.message);
        failedBatches.push(i);
        totalSkipped += batches[i].length; // count as skipped
      }
    }

    res.json({
      success: true,
      total_input_rows: rawRecords.length,
      total_imported: allParsed.length,
      total_skipped: totalSkipped,
      failed_batches: failedBatches,
      records: allParsed,
    });
  } catch (err) {
    console.error("Import failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;