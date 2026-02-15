import * as functions from "firebase-functions";
import cors from "cors";

const corsHandler = cors({ origin: true });

export const verifyDrugAI = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const drugName = req.query.name as string | undefined;

      if (!drugName) {
        return res.status(400).json({
          error: "Drug name required"
        });
      }

      // Native fetch (Node 18+)
      const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${drugName}&limit=1`;
      const fdaRes = await fetch(url);
      const fdaData: any = await fdaRes.json();

      if (!fdaData.results || fdaData.results.length === 0) {
        return res.json({
          status: "NOT_FOUND",
          verdict: "❌ POSSIBLY FAKE",
          confidence: 25
        });
      }

      const drug = fdaData.results[0];
      const manufacturer =
        drug.openfda?.manufacturer_name?.[0] ?? "Unknown";

      return res.json({
        status: "FOUND",
        verdict: "✅ SAFE",
        confidence: 90,
        drugName: drug.openfda.generic_name?.[0],
        manufacturer
      });

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  });
});
