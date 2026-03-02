# 💊 ELYRA – Blockchain Drug Traceability Platform

ELYRA is a **blockchain-based drug verification and traceability system** designed to fight counterfeit medicines.  
It enables secure registration, tracking, and verification of medicines using **Ethereum smart contracts**, **QR codes**, and **MetaMask transactions**.

Every medicine added to the system is **immutably stored on the blockchain**, making tampering or duplication practically impossible.

---

## 📌 Problem Statement

Counterfeit medicines are a serious global issue that:
- Endanger patient lives
- Cause financial loss
- Damage trust in healthcare systems

Traditional databases can be altered, hacked, or manipulated.  
**ELYRA solves this by using blockchain**, where data is transparent, decentralized, and immutable.

---

## 🚀 Solution Overview

ELYRA ensures:
- Each medicine is registered **once** on the blockchain
- Every medicine has a **unique QR code**
- Patients can **verify authenticity instantly** by scanning the QR
- Ownership and supply chain details are fully traceable

---

## 🧠 How the System Works (High-Level Flow)

1. **Manufacturer / Admin connects MetaMask**
2. **Medicine details are entered**
3. **Transaction is signed via MetaMask**
4. **Smart contract stores medicine data**
5. **QR code is generated**
6. **User scans QR to verify authenticity**

---

## 🏗️ Architecture

---

## 🔐 Blockchain & Wallet Setup

### 🧪 Ganache (Local Blockchain)
- Used to generate **private keys**
- Provides **test ETH**
- Runs a local Ethereum network for development

### 🦊 MetaMask
- Imported Ganache accounts
- Used for:
  - Wallet connection
  - Transaction signing
  - Gas fee confirmation

### 📦 Truffle
- Used for:
  - Writing smart contracts
  - Compiling Solidity code
  - Deploying contracts to Ganache / Sepolia
  - Managing contract addresses

---

## 🔗 Smart Contract Details

- **Language:** Solidity
- **Network:** Sepolia Testnet (Production) / Ganache (Local)
- **Functionality:**
  - Add medicine
  - Store batch details
  - Track ownership
  - Prevent duplicate entries

**Contract Address (Sepolia):**

---

## 📸 Application Features

### 🧾 Medicine Registration
- Medicine ID
- Name
- Manufacturer
- Batch number
- Price
- Owner wallet address

All details are written to the blockchain after MetaMask confirmation.

---

### 🔳 QR Code Generation
- QR code is generated **after successful blockchain transaction**
- Each QR contains a **unique medicine verification URL**
- Can be scanned by any smartphone

---

### 📲 Verification Page
- Opens automatically after scanning QR
- Fetches data directly from blockchain
- Confirms:
  - Authenticity
  - Manufacturer
  - Batch number
  - Ownership

---

### 📧 Email Notifications
- Uses EmailJS
- Sends verification details to users
- Helps patients keep a digital record

---

## 🎨 UI / UX Highlights

- Glassmorphism design
- Smooth GSAP animations
- Responsive layout
- Dark professional theme
- Mobile-friendly QR scanning flow

---

## 🛠️ Tech Stack

### Frontend
- React.js
- GSAP (Animations)
- Lucide React (Icons)

### Blockchain
- Solidity
- Ethereum
- Ethers.js
- Ganache
- MetaMask
- Truffle

### Backend / Services
- Firebase Firestore
- EmailJS
- OpenFDA API (for validation)

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v16+)
- MetaMask Extension
- Ganache
- Truffle

---

### 🔧 Installation

```bash
git clone https://github.com/your-username/drug-ui.git
cd drug-ui
npm install
🧪 Testing with Ganache

Start Ganache

Copy a private key

Import account into MetaMask

Connect MetaMask to localhost:8545

Perform transactions safely with test ETH

🔒 Security Advantages

Immutable blockchain storage

No centralized database manipulation

Wallet-based authentication

Transparent medicine lifecycle
