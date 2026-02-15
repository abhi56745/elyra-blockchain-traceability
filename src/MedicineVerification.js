import React, { useState, useEffect } from "react";
import "./App.css";

// Backend (blockchain + email)
const BACKEND_URL = `http://${window.location.hostname}:5000`;

// AI (Firebase Functions)
const AI_URL = `http://${window.location.hostname}:5001/elyra-drug/us-central1/verifyDrugAI`;

// Brand → Generic mapping (IMPORTANT)
const BRAND_MAP = {
  "DOLO 650": "acetaminophen",
  "PARACETAMOL": "acetaminophen",
  "CROCIN": "acetaminophen",
  "TYLENOL": "acetaminophen"
};

function MedicineVerification() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medicineData, setMedicineData] = useState(null);

  // AI
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Email
  const [email, setEmail] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMedicineDetails();
  }, []);

  // ========================
  // Fetch Blockchain Medicine
  // ========================
  const fetchMedicineDetails = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const medicineId = urlParams.get("id");

    if (!medicineId) {
      setError("No medicine ID provided!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/medicine/${medicineId}`);
      if (!response.ok) {
        setError("Medicine not found in blockchain");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setMedicineData(data);
      setLoading(false);

      // 🔥 BRAND → GENERIC LOGIC
      const normalizedName = data.name.toUpperCase();
      const aiQuery =
        BRAND_MAP[normalizedName] || data.name;

      fetchAIResult(aiQuery);

    } catch {
      setError("Backend connection failed");
      setLoading(false);
    }
  };

  // ========================
  // AI Verification
  // ========================
  const fetchAIResult = async (medicineName) => {
    try {
      setAiLoading(true);

      const response = await fetch(
        `${AI_URL}?name=${encodeURIComponent(medicineName)}`
      );

      const data = await response.json();
      setAiResult(data);

    } catch (err) {
      console.error("AI error:", err);
      setAiResult({
        verdict: "❌ AI ERROR",
        confidence: 0
      });
    } finally {
      setAiLoading(false);
    }
  };

  // ========================
  // Send Email
  // ========================
  const sendEmail = async () => {
    if (!email.trim()) return alert("Enter email");

    setSending(true);
    setEmailSuccess(false);

    try {
      const id = new URLSearchParams(window.location.search).get("id");

      const response = await fetch(`${BACKEND_URL}/sendMedicineEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email })
      });

      const result = await response.json();
      if (result.success) {
        setEmailSuccess(true);
        setEmail("");
      }
    } catch {
      alert("Email failed");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading…</div>;
  }

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.header}>💊 Medicine Verification</h1>

        {error && <div style={styles.error}>{error}</div>}

        {/* Medicine Info */}
        {medicineData && (
          <div style={styles.infoCard}>
            <Info label="ID" value={medicineData.id} />
            <Info label="Name" value={medicineData.name} />
            <Info label="Manufacturer" value={medicineData.manufacturer} />
            <Info label="Batch" value={medicineData.batchNumber} />
            <Info label="Price" value={`₹${medicineData.price}`} />
            <Info label="Status" value={medicineData.status} />
          </div>
        )}

        {/* AI Section (ALWAYS RENDERS) */}
        <div
          style={{
            ...styles.aiCard,
            background: aiResult?.verdict?.includes("SAFE")
              ? "#e8f5e9"
              : "#ffebee",
            color: aiResult?.verdict?.includes("SAFE")
              ? "#2e7d32"
              : "#c62828"
          }}
        >
          {aiLoading ? (
            "🤖 Verifying with AI..."
          ) : aiResult ? (
            <>
              <h3>🤖 AI Verification</h3>
              <p><strong>Verdict:</strong> {aiResult.verdict}</p>
              <p><strong>Confidence:</strong> {aiResult.confidence}%</p>
              {aiResult.manufacturer && (
                <p><strong>FDA Manufacturer:</strong> {aiResult.manufacturer}</p>
              )}
            </>
          ) : (
            "🤖 AI data unavailable"
          )}
        </div>

        {/* Email */}
        <div style={styles.email}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter email"
            style={styles.input}
          />
          <button onClick={sendEmail} disabled={sending} style={styles.button}>
            {sending ? "Sending…" : "Send Details"}
          </button>
          {emailSuccess && <div style={styles.success}>✅ Email sent</div>}
        </div>
      </div>
    </div>
  );
}

// Helper
const Info = ({ label, value }) => (
  <div style={styles.row}>
    <strong>{label}:</strong> <span>{value}</span>
  </div>
);

// Styles
const styles = {
  body: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    width: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
  },
  header: { textAlign: "center", color: "#667eea" },
  infoCard: { background: "#f8f9ff", padding: 20, borderRadius: 15 },
  row: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  aiCard: { marginTop: 20, padding: 20, borderRadius: 15, textAlign: "center" },
  email: { marginTop: 20 },
  input: { width: "100%", padding: 10, marginBottom: 10 },
  button: {
    width: "100%",
    padding: 12,
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: 10
  },
  error: { color: "#c62828", marginBottom: 10 },
  success: { color: "#2e7d32", marginTop: 10 }
};

export default MedicineVerification;
