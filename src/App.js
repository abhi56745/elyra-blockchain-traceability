import React, { useEffect, useRef, useState, useCallback } from "react";
import { ethers } from "ethers";
import { gsap } from "gsap";
import { QRCodeCanvas } from "qrcode.react";
import emailjs from "@emailjs/browser";
import {
  LayoutDashboard,
  User,
  PlusCircle,
  LogOut,
  Search,
  Package,
  CheckCircle,
  Lock,
  Cpu,
  Loader2,
  QrCode,
} from "lucide-react";
import "./App.css";

import DrugTraceabilityABI from "./contracts/DrugTraceability.json";

// Firebase Firestore
import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

// Contract Configuration
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0xf2F95784AE0b36313204A124be2c9A0D4Fa56A4D";

// Frontend URL - Dynamic for production
const FRONTEND_URL = window.location.origin;

// EmailJS Configuration
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

function App() {
  // Detect QR Page route
  const isQrPage = window.location.pathname === "/qr";

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showMobileFallback, setShowMobileFallback] = useState(false);

  // Dashboard State
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);

  // Loading States
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState(false);

  // Medicine Form State
  const [medicineForm, setMedicineForm] = useState({
    id: "",
    name: "",
    manufacturer: "",
    batchNumber: "",
    price: "",
    status: "In Stock",
  });

  // Blockchain Data
  const [drugs, setDrugs] = useState([]);

  // QR Generate State
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  // QR Page State
  const [drugDetails, setDrugDetails] = useState(null);
  const [emailTo, setEmailTo] = useState("");
  const [sendingMail, setSendingMail] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  // AI Verification State
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Refs for GSAP animations
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);

  // ========================================
  // FORM HANDLERS
  // ========================================

  const handleMedicineChange = (e) => {
    setMedicineForm({ ...medicineForm, [e.target.name]: e.target.value });
  };

  // ========================================
  // BLOCKCHAIN INITIALIZATION
  // ========================================

  const initBlockchain = useCallback(async () => {
    if (!window.ethereum) {
      // Robust mobile detection: User Agent + Touch Capabilities + Screen Width
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 800;

      const isMobile = isMobileUA || (isTouchDevice && isSmallScreen);

      setShowMobileFallback(true);

      if (isMobile) {
        // Redirection URL format for MetaMask mobile app link
        // Strip protocol and use metamask.app.link/dapp/
        const dappUrl = window.location.href.replace(/^https?:\/\//, "");
        const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;

        console.log("Redirecting to MetaMask Mobile:", metamaskAppDeepLink);

        // Give the user a hint before redirecting
        alert("📱 Mobile detected. Opening MetaMask in-app browser...");
        window.location.href = metamaskAppDeepLink;
        return false;
      }

      alert("❌ MetaMask not found! Please install the MetaMask extension or use the button below to open in MetaMask app.");
      return false;
    }

    try {
      setIsConnecting(true);

      // Switch to Sepolia network (Chain ID = 11155111 = 0xaa36a7)
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xaa36a7",
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "Sepolia Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.sepolia.org"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
          } catch (addError) {
            throw addError;
          }
        } else {
          throw switchError;
        }
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const drugContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DrugTraceabilityABI.abi,
        signer
      );

      setAccount(accounts[0]);
      setContract(drugContract);

      return true;
    } catch (error) {
      console.error("Blockchain Init Error:", error);

      if (error.code === 4902) {
        alert("❌ Sepolia network not found. Please add it to MetaMask.");
      } else {
        alert("❌ Failed to connect wallet. Make sure you're on the Sepolia network.");
      }

      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ========================================
  // WALLET EVENT LISTENERS
  // ========================================

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAccount("");
        setContract(null);
        alert("⚠️ Wallet disconnected. Please connect again.");
        return;
      }
      setAccount(accounts[0]);
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // ========================================
  // LOGIN / LOGOUT
  // ========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (username !== "admin" || password !== "1234") {
      alert("❌ Invalid Credentials. Use: admin / 1234");
      return;
    }

    const success = await initBlockchain();
    if (!success) return;

    alert("✅ MetaMask Connected Successfully!");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    setAccount("");
    setContract(null);
    setActiveTab("Dashboard");
    setDrugs([]);
    setSelectedDrugId("");
    setQrUrl("");
  };

  // ========================================
  // FETCH ALL DRUGS FROM BLOCKCHAIN
  // ========================================

  const fetchAllDrugs = useCallback(async () => {
    if (!contract) return;

    try {
      setIsLoadingDrugs(true);

      const ids = await contract.getAllDrugIds();
      const drugList = [];

      for (let i = 0; i < ids.length; i++) {
        const id = Number(ids[i]);
        const details = await contract.getDrugDetails(id);

        drugList.push({
          id: Number(details[0]),
          name: details[1],
          manufacturer: details[2],
          batchNumber: details[3],
          price: Number(details[4]),
          status: details[5],
          owner: details[6],
        });
      }

      setDrugs(drugList);
    } catch (err) {
      console.error("❌ Fetch Drugs Error:", err);
      alert("❌ Failed to fetch medicines. Check contract connection.");
    } finally {
      setIsLoadingDrugs(false);
    }
  }, [contract]);

  // Fetch drugs when contract is ready
  useEffect(() => {
    if (!contract) return;
    fetchAllDrugs();
  }, [contract, fetchAllDrugs]);

  // ========================================
  // FIRESTORE HELPER
  // ========================================

  const medicineExistsInFirestore = async (id) => {
    try {
      const snap = await getDoc(doc(db, "medicines", String(id)));
      return snap.exists();
    } catch (error) {
      console.error("Firestore check error:", error);
      return false;
    }
  };

  // ========================================
  // REGISTER DRUG (BLOCKCHAIN + FIRESTORE)
  // ========================================

  const handleRegister = async () => {
    if (!contract) {
      alert("❌ Blockchain not connected! Please login first.");
      return;
    }

    // Validation
    if (
      !medicineForm.id ||
      !medicineForm.name ||
      !medicineForm.manufacturer ||
      !medicineForm.batchNumber ||
      !medicineForm.price ||
      !medicineForm.status
    ) {
      alert("⚠️ Please fill all fields!");
      return;
    }

    if (Number(medicineForm.price) <= 0) {
      alert("⚠️ Price must be greater than 0");
      return;
    }

    const medicineId = String(medicineForm.id);

    try {
      setIsWriting(true);

      // Check if medicine already exists in Firestore
      const exists = await medicineExistsInFirestore(medicineId);
      if (exists) {
        alert("⚠️ This Medicine ID already exists!");
        return;
      }

      // Send blockchain transaction
      const tx = await contract.registerDrug(
        Number(medicineForm.id),
        medicineForm.name,
        medicineForm.manufacturer,
        medicineForm.batchNumber,
        Number(medicineForm.price),
        medicineForm.status
      );

      console.log("⏳ Transaction sent:", tx.hash);
      await tx.wait();
      console.log("✅ Blockchain transaction confirmed!");

      // Save to Firestore
      await setDoc(doc(db, "medicines", medicineId), {
        id: medicineId,
        name: medicineForm.name,
        manufacturer: medicineForm.manufacturer,
        batchNumber: medicineForm.batchNumber,
        price: String(medicineForm.price),
        status: medicineForm.status,
        owner: account || "N/A",
        createdAt: serverTimestamp(),
      });

      alert("✅ Medicine added successfully!");

      // Reset form
      setMedicineForm({
        id: "",
        name: "",
        manufacturer: "",
        batchNumber: "",
        price: "",
        status: "In Stock",
      });

      // Refresh drug list and go to dashboard
      await fetchAllDrugs();
      setActiveTab("Dashboard");
    } catch (err) {
      console.error("❌ Register Error:", err);

      // Better error messages
      if (err?.code === 4001 || err?.code === "ACTION_REJECTED") {
        alert("⚠️ Transaction rejected in MetaMask.");
      } else if (err?.code === "CALL_EXCEPTION") {
        alert(
          "❌ Transaction failed. Possible reasons:\n\n" +
          "• Medicine ID already exists on blockchain\n" +
          "• Contract address or ABI mismatch\n" +
          "• Not connected to correct Sepolia network"
        );
      } else {
        alert("❌ Transaction failed. Check console for details.");
      }
    } finally {
      setIsWriting(false);
    }
  };

  // ========================================
  // ANIMATIONS (ADMIN DASHBOARD)
  // ========================================

  useEffect(() => {
    if (!isLoggedIn) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      sidebarRef.current,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 }
    ).fromTo(
      headerRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      "-=0.4"
    );
  }, [isLoggedIn]);

  // ========================================
  // DASHBOARD STATS
  // ========================================

  const stats = [
    {
      title: "Connected Wallet",
      value: account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : "Not Connected",
      icon: <User />,
    },
    {
      title: "Total Medicines",
      value: drugs.length,
      icon: <Package />
    },
    {
      title: "In Stock",
      value: drugs.filter((d) => d.status === "In Stock").length,
      icon: <CheckCircle />,
    },
  ];

  // ========================================
  // GENERATE QR CODE
  // ========================================

  const handleGenerateQR = () => {
    if (!selectedDrugId) {
      alert("⚠️ Please select a Medicine ID first!");
      return;
    }

    const url = `${FRONTEND_URL}/qr?mid=${selectedDrugId}`;
    setQrUrl(url);
    alert("✅ QR Generated! Scan with phone camera.");
  };

  // ========================================
  // QR PAGE: FETCH MEDICINE DETAILS
  // ========================================

  useEffect(() => {
    if (!isQrPage) return;

    const params = new URLSearchParams(window.location.search);
    const mid = params.get("mid");

    if (mid) {
      fetchDrugDetailsFromFirestore(mid);
    }
  }, [isQrPage]);

  // ========================================
  // AI VERIFICATION LOGIC (CLIENT SIDE)
  // ========================================

  const fetchAIResult = async (drugName) => {
    try {
      setAiLoading(true);
      setAiResult(null);

      // Ported logic from Firebase Functions
      const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${encodeURIComponent(drugName)}&limit=1`;
      const fdaRes = await fetch(url);
      const fdaData = await fdaRes.json();

      if (!fdaData.results || fdaData.results.length === 0) {
        setAiResult({
          status: "NOT_FOUND",
          verdict: "❌ POSSIBLY FAKE",
          confidence: 25
        });
        return;
      }

      const drug = fdaData.results[0];
      const manufacturer = drug.openfda?.manufacturer_name?.[0] ?? "Unknown";

      setAiResult({
        status: "FOUND",
        verdict: "✅ SAFE",
        confidence: 90,
        drugName: drug.openfda.generic_name?.[0],
        manufacturer
      });

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

  const fetchDrugDetailsFromFirestore = async (id) => {
    try {
      setQrLoading(true);

      const snap = await getDoc(doc(db, "medicines", String(id)));

      if (!snap.exists()) {
        setDrugDetails(null);
        return;
      }

      const data = snap.data();
      setDrugDetails(data);

      // Trigger AI verification after fetching firestore data
      if (data.name) {
        fetchAIResult(data.name);
      }
    } catch (err) {
      console.error("❌ Firestore Fetch Error:", err);
      setDrugDetails(null);
    } finally {
      setQrLoading(false);
    }
  };

  // ========================================
  // QR PAGE: SEND EMAIL
  // ========================================

  const handleSendEmail = async () => {
    if (!emailTo) {
      alert("⚠️ Please enter your email!");
      return;
    }

    if (!drugDetails) {
      alert("❌ Medicine details not found!");
      return;
    }

    try {
      setSendingMail(true);

      const templateParams = {
        to_email: emailTo,
        medicine_id: drugDetails.id,
        medicine_name: drugDetails.name,
        manufacturer: drugDetails.manufacturer,
        batch: drugDetails.batchNumber,
        price: drugDetails.price,
        status: drugDetails.status,
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      alert("✅ Email sent successfully!");
      setEmailTo("");
    } catch (err) {
      console.error("❌ EmailJS Error:", err);
      alert("❌ Failed to send email. Please check your EmailJS configuration.");
    } finally {
      setSendingMail(false);
    }
  };

  // ========================================
  // RENDER: QR PAGE
  // ========================================

  if (isQrPage) {
    return (
      <div className="app-container">
        <div className="liquid-background">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: "24px",
            maxWidth: "480px",
            margin: "80px auto",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: "8px" }}>📩 Medicine Verification</h2>

          <p style={{ color: "var(--text-secondary)", marginBottom: "18px" }}>
            Enter your email to receive medicine details.
          </p>

          {qrLoading ? (
            <div style={{ padding: "20px" }}>
              <Loader2 size={24} className="spin" style={{ margin: "0 auto" }} />
              <p style={{ marginTop: "10px" }}>Loading medicine details...</p>
            </div>
          ) : !drugDetails ? (
            <p style={{ color: "var(--danger)", marginBottom: "12px" }}>
              ❌ Medicine not found
            </p>
          ) : (
            <div
              style={{
                textAlign: "left",
                padding: "14px",
                borderRadius: "12px",
                marginBottom: "18px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0" }}>✅ Medicine Details</h3>
              <p style={{ margin: "6px 0" }}>
                <strong>ID:</strong> {drugDetails.id}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Name:</strong> {drugDetails.name}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Manufacturer:</strong> {drugDetails.manufacturer}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Batch No:</strong> {drugDetails.batchNumber}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Price:</strong> ₹{drugDetails.price}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Status:</strong> {drugDetails.status}
              </p>
            </div>
          )}

          {/* AI Verification Results */}
          {(aiLoading || aiResult) && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                borderRadius: "15px",
                marginBottom: "18px",
                background: aiResult?.verdict?.includes("SAFE")
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                color: aiResult?.verdict?.includes("SAFE") ? "#10b981" : "#ef4444",
                border: "1px solid currentColor",
              }}
            >
              {aiLoading ? (
                <>
                  <Loader2 size={24} className="spin" style={{ margin: "0 auto" }} />
                  <p style={{ marginTop: "10px" }}>🤖 Verifying with AI...</p>
                </>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 10px 0" }}>🤖 AI Verification</h3>
                  <p style={{ margin: "6px 0", fontSize: "1.1rem" }}>
                    <strong>Verdict:</strong> {aiResult.verdict}
                  </p>
                  <p style={{ margin: "6px 0" }}>
                    <strong>Confidence:</strong> {aiResult.confidence}%
                  </p>
                  {aiResult.manufacturer && (
                    <p style={{ margin: "6px 0", fontSize: "0.85rem", opacity: 0.8 }}>
                      <strong>FDA Manufacturer:</strong> {aiResult.manufacturer}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <input
            className="glass-input"
            type="email"
            placeholder="Enter your email address"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            disabled={!drugDetails}
          />

          <button
            className="btn-primary"
            style={{ marginTop: "14px", width: "100%" }}
            onClick={handleSendEmail}
            disabled={sendingMail || qrLoading || !drugDetails}
          >
            {sendingMail ? (
              <>
                <Loader2 size={16} className="spin" />
                Sending...
              </>
            ) : (
              "Send Details"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: LOGIN PAGE
  // ========================================

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="cyber-grid"></div>

        <div className="glass-panel login-card">
          <div className="crypto-icon">
            <Cpu size={48} color="#3b82f6" />
          </div>

          <h2 style={{ marginBottom: "10px" }}>WELCOME TO ELYRA</h2>

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <input
              className="glass-input"
              type="text"
              placeholder="System Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              className="glass-input"
              type="password"
              placeholder="Encrypted Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Connecting MetaMask...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Authenticate
                </>
              )}
            </button>

            {showMobileFallback && (
              <div style={{ marginTop: "10px", textAlign: "center" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Can't connect? Try opening in MetaMask app:
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontSize: "0.9rem"
                  }}
                  onClick={() => {
                    const dappUrl = window.location.href.replace(/^https?:\/\//, "");
                    window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
                  }}
                >
                  <QrCode size={16} />
                  Open in MetaMask
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: MAIN DASHBOARD
  // ========================================

  return (
    <div className="app-container">
      <div className="liquid-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* SIDEBAR */}
      <aside ref={sidebarRef} className="sidebar glass-panel">
        <div
          className="sidebar-logo"
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "30px",
          }}
        >
          💊 ELYRA
        </div>

        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={activeTab === "Dashboard"}
          onClick={() => setActiveTab("Dashboard")}
        />

        <NavItem
          icon={<PlusCircle size={20} />}
          label="Add Medicine"
          active={activeTab === "Add Medicine"}
          onClick={() => setActiveTab("Add Medicine")}
        />

        <NavItem
          icon={<QrCode size={20} />}
          label="Generate QR"
          active={activeTab === "Generate QR"}
          onClick={() => setActiveTab("Generate QR")}
        />

        <div style={{ marginTop: "auto" }}>
          <NavItem
            icon={<LogOut size={20} />}
            label="Logout"
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HEADER */}
        <header
          ref={headerRef}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>DRUG PROBER</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "6px" }}>
              Wallet:{" "}
              {account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "Not Connected"}
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 18px",
              gap: "10px",
              minWidth: "260px",
            }}
          >
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search... (UI only)"
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === "Dashboard" && (
          <>
            <div className="stat-grid">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="glass-panel stat-card"
                  style={{ padding: "24px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.9rem",
                          margin: 0,
                        }}
                      >
                        {stat.title}
                      </p>
                      <h2
                        style={{
                          fontSize: "1.6rem",
                          marginTop: "10px",
                          marginBottom: 0,
                        }}
                      >
                        {stat.value}
                      </h2>
                    </div>

                    <div
                      style={{
                        padding: "10px",
                        background: "rgba(59, 130, 246, 0.12)",
                        borderRadius: "12px",
                        height: "fit-content",
                      }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: "26px", marginBottom: "18px" }}>
              Medicines on Blockchain
            </h3>

            {isLoadingDrugs ? (
              <div className="glass-panel" style={{ padding: "20px", textAlign: "center" }}>
                <Loader2 size={18} className="spin" style={{ display: "inline-block", marginRight: "8px" }} />
                Loading from blockchain...
              </div>
            ) : drugs.length === 0 ? (
              <div className="glass-panel" style={{ padding: "20px" }}>
                No medicines found. Add your first medicine.
              </div>
            ) : (
              <div className="medicine-grid">
                {drugs.map((d) => (
                  <div
                    key={d.id}
                    className="glass-panel medicine-card"
                    style={{ padding: "24px", position: "relative" }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "18px",
                        right: "18px",
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        background:
                          d.status === "In Stock"
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(239, 68, 68, 0.12)",
                        color: d.status === "In Stock" ? "#10b981" : "#ef4444",
                        border: "1px solid currentColor",
                      }}
                    >
                      {d.status}
                    </div>

                    <h3 style={{ margin: "0 0 6px 0" }}>{d.name}</h3>

                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        margin: 0,
                      }}
                    >
                      ID: {d.id}
                    </p>

                    <div
                      style={{
                        margin: "18px 0",
                        height: "1px",
                        background: "var(--glass-border)",
                      }}
                    />

                    <p style={{ margin: 0 }}>
                      <strong>Manufacturer:</strong> {d.manufacturer}
                    </p>

                    <p style={{ margin: "8px 0 0 0" }}>
                      <strong>Batch:</strong> {d.batchNumber}
                    </p>

                    <p style={{ margin: "8px 0 0 0" }}>
                      <strong>Price:</strong> ₹{d.price}
                    </p>

                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Owner: {d.owner?.slice(0, 6)}...{d.owner?.slice(-4)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ADD MEDICINE TAB */}
        {activeTab === "Add Medicine" && (
          <div className="glass-panel" style={{ padding: "24px", maxWidth: "520px" }}>
            <h2 style={{ marginBottom: "10px" }}>➕ Add Medicine</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Fill details and confirm in MetaMask
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input
                className="glass-input"
                type="number"
                name="id"
                placeholder="Medicine ID"
                value={medicineForm.id}
                onChange={handleMedicineChange}
              />

              <input
                className="glass-input"
                type="text"
                name="name"
                placeholder="Medicine Name"
                value={medicineForm.name}
                onChange={handleMedicineChange}
              />

              <input
                className="glass-input"
                type="text"
                name="manufacturer"
                placeholder="Manufacturer"
                value={medicineForm.manufacturer}
                onChange={handleMedicineChange}
              />

              <input
                className="glass-input"
                type="text"
                name="batchNumber"
                placeholder="Batch Number"
                value={medicineForm.batchNumber}
                onChange={handleMedicineChange}
              />

              <input
                className="glass-input"
                type="number"
                name="price"
                placeholder="Price (₹)"
                value={medicineForm.price}
                onChange={handleMedicineChange}
              />

              <select
                className="glass-input"
                name="status"
                value={medicineForm.status}
                onChange={handleMedicineChange}
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <button
                className="btn-primary"
                onClick={handleRegister}
                disabled={isWriting}
              >
                {isWriting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Adding...
                  </>
                ) : (
                  "Add Medicine (MetaMask + Firestore)"
                )}
              </button>
            </div>
          </div>
        )}

        {/* GENERATE QR TAB */}
        {activeTab === "Generate QR" && (
          <div className="glass-panel" style={{ padding: "24px", maxWidth: "720px" }}>
            <h2 style={{ marginBottom: "10px" }}>📌 Generate QR Code</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <select
                className="glass-input"
                value={selectedDrugId}
                onChange={(e) => setSelectedDrugId(e.target.value)}
              >
                <option value="">-- Select Medicine ID --</option>
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} - {d.name}
                  </option>
                ))}
              </select>

              <button className="btn-primary" onClick={handleGenerateQR}>
                Generate QR Code
              </button>

              {qrUrl && (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <h3 style={{ marginBottom: "12px" }}>✅ QR Ready</h3>
                  <div style={{
                    background: "white",
                    padding: "16px",
                    borderRadius: "12px",
                    display: "inline-block"
                  }}>
                    <QRCodeCanvas value={qrUrl} size={240} includeMargin={true} />
                  </div>
                  <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                    Scan with phone camera → opens verification page
                  </p>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7, wordBreak: "break-all" }}>
                    {qrUrl}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ========================================
// NAV ITEM COMPONENT
// ========================================

const NavItem = ({ icon, label, active, onClick }) => (
  <div
    className={`nav-item ${active ? "active" : ""}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        onClick();
      }
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);

export default App;