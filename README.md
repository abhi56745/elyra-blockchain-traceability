# 💊 ELYRA - Blockchain Drug Traceability Platform

ELYRA is a cutting-edge, blockchain-powered solution designed to combat the global counterfeit medicine crisis. By integrating Ethereum smart contracts, automated AI verification, and secure cloud forensics, ELYRA ensures every pill can be traced from the manufacturer to the patient.

## 🚀 Key Features

- **Blockchain Immutable Ledger**: Uses Ethereum (Sepolia Testnet) to record the entire lifecycle of a medicine.
- **AI-Powered Verification**: Real-time authenticity checks against FDA databases using client-side AI logic.
- **Dynamic QR Codes**: Generate secure QR codes for every batch, easily scanable by patients.
- **Instant Email Alerts**: Integration with EmailJS to send medicine verification details directly to users.
- **MetaMask Integration**: Seamless wallet connection with robust mobile redirection for browsers.
- **Premium UI/UX**: High-end glassmorphism design with GSAP animations for a professional feel.

## 📸 Screenshots

Checkout the project in action:

- [Dashboard Overview](images/Screenshot%202026-02-15%20203156.png)
- [Medicine Registration](images/Screenshot%202026-02-15%20203204.png)
- [QR Code Generation](images/Screenshot%202026-02-15%20203213.png)
- [Mobile Verification Flow](images/Screenshot%202026-02-15%20203711.png)

## 🛠️ Tech Stack

- **Frontend**: React.js, GSAP (Animations), Lucide React (Icons)
- **Blockchain**: Solidity, Ethers.js, Sepolia Testnet
- **Backend/Storage**: Firebase Firestore
- **Communication**: EmailJS
- **Verification**: OpenFDA API

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MetaMask](https://metamask.io/) browser extension or mobile app

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/drug-ui.git
   cd drug-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and fill in your actual credentials:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` with your Firebase, EmailJS, and Contract details.

### Running the App

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 🔗 Smart Contract

The platform interacts with a `DrugTraceability` contract deployed on the Sepolia Testnet.
- **Contract Address**: `0xf2F95784AE0b36313204A124be2c9A0D4Fa56A4D`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
