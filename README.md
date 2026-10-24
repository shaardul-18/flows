# Flows — Advanced Expense Split & Treasury Ledger

> A state-of-the-art fintech web application for expense management, itemized bill splitting with proportional tax/tip allocation, receipt OCR scanning with error diagnostics, bilateral debt simplification, and WhatsApp settlement integration. Built with React, TypeScript, Tailwind CSS, and Google Stitch design tokens.

🚀 **Live Demo:** [https://shaardul-18.github.io/flows/](https://shaardul-18.github.io/flows/)

---

## ✨ Features

- 💎 **Unified Treasury & Net Balances**: Real-time visual ledger tracking total amounts *You Owe*, *You are Owed*, and overall net treasury position with privacy toggle.
- 🧾 **Receipt OCR Scanner with Live HUD**: Real-time scanner HUD with text bounding boxes, image upload processing, and dedicated diagnostic error handling (`Error 0x4B` low contrast/motion blur) with troubleshooting tips and manual fallback.
- 🍽️ **Custom Itemized Split Calculator**: Per-dish member allocation, proportional tax, tip, and packaging split logic (with integer paisa rounding preventing discrepancies).
- 💬 **WhatsApp Settlement Dispatcher**: Generates formatted markdown summaries and deep-links directly into WhatsApp (`https://wa.me/?text=...`) with an in-situ chat bubble preview.
- 🧮 **Greedy Bilateral Debt Simplification**: Graph reduction algorithm that collapses cyclical circular multi-peer debts into minimal direct one-tap settlements.
- 📊 **Spending Analytics & Micro-Expense Leak Tracker**: Identifies and flags recurring unmonitored spends under ₹200 (chai, auto, snacks) alongside category breakdown charts.
- 📥 **Multi-Sheet Excel (.XLSX) & CSV Exporter**: Generates full financial ledgers using SheetJS with dedicated summary and transaction sheets.
- 📱 **Dual Viewport Architecture**: Seamlessly switch between a mobile-first native layout and an expansive widescreen desktop ledger layout (`web.flows.money`).
- 🔐 **Secure Onboarding & Web Sync**: Dedicated authentication flow matching Google Stitch's `sign_in_web_sync` with Sign In vs Register tabs, 1-Tap Google Sign-In, SSO, and cross-device QR code pairing.

---

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with Google Stitch Fintech Design Tokens
- **Icons & Typography:** Space Grotesk, Manrope, JetBrains Mono, Google Material Symbols Outlined
- **Data Exporting:** [SheetJS (xlsx)](https://docs.sheetjs.com/)
- **Hosting & CI/CD:** GitHub Pages + GitHub Actions

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/shaardul-18/flows.git

# Navigate into directory
cd flows

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will start at `http://localhost:3000/`.

### Building for Production

```bash
npm run build
```

The output will be generated in `dist/`.

---

## 🔒 Security & Privacy

- Client-side storage and state persistence via encrypted `localStorage` protocols.
- Zero external tracking or unauthorized data exfiltration.

---

## 📄 License

MIT License. Designed and engineered by [Shaardul Ghag](https://github.com/shaardul-18).
