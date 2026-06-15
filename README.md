# Logistics Control Tower

A unified, high-performance web dashboard engineered for global supply-chain operators, dispatch agents, and logistics managers. This platform consolidates real-time freight telemetry, partner carrier performance analytics, anomaly detection, satellite audit paths, and responsive workflows.

## 🛰️ Key Features

- **Consolidated Dashboard**: High-level telemetry displaying active dispatches, on-time SLA metrics, total managed tonnage, and urgent anomalies at a glance.
- **Waybill & Shipment Registry**: Deep search-and-filter database for packages with sorting capabilities, complete status nodes, dimensional descriptions, and detailed event timeline histories.
- **Operational Logistical Analytics**: Detailed interactive charting (using Recharts) to analyze transit volumes, cargo tonnage, carbon footprint levels, regional sector flows, and automated heuristic recommendation modules.
- **Exceptions Control Desk**: Tactical terminal for active backlogs, customs blocks, and routing delays. Features manual resolution overrides and simulated emergency carrier rerouting.
- **Carrier Partner Matrix**: Performance scorecards evaluating partner transit delivery times, active loads, coverage zones, and dynamic rating systems.
- **Responsive Mobile Enhancement**: Designed for seamless transition between high-definition desktop monitors and dynamic hand-held touch viewports, featuring an ergonomic thumb-oriented floating bottom menu.

---

## 🛠️ Technology Stack & Architecture

- **Framework**: [React](https://react.dev/) 18+ with [TypeScript](https://www.typescriptlang.org/) for type safety, robust state management, and clear components.
- **Build System**: [Vite](https://vitejs.dev/) for quick HMR-free server orchestration and lightweight production bundles.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a sleek, dark-slate aesthetic prioritizing negative space, typography hierarchy, and flexible grids.
- **Data Visualization**: [Recharts](https://recharts.org/) for lightweight, responsive micro-trends, SVG-rendered area graphs, horizontal bars, and status pie charts.
- **Icons**: [Lucide React](https://lucide.dev/) for clean, visually standardized line illustrations.

---

## 🚀 Getting Started

To run the application locally on your machine or inside the platform workspace, use the typical npm CLI steps.

### 1. Installation
Install project-level node dependencies:
```bash
npm install
```

### 2. Live Development Server
Launch the Node development server:
```bash
npm run dev
```

### 3. Production Build
Verify type checks and build output for deployment configurations:
```bash
npm run build
```

---

## 🎨 Visual Identity & Aesthetic Principles

This application applies precise editorial and dark-mode layout methodologies to replace low-quality UI cliches with refined, focused interfaces:
- **Swiss Modern Layouts**: Elements are grouped naturally within structural cards featuring spacious negative padding and high contrast.
- **Tech-Forward Typography**: Employs elegant standard type pairings to emphasize functional values (mono spacing for trackings/telemetry, display weights for metrics).
- **Proportional Accessibility**: Strict contrast values across status colors (Emerald, Amber, Violet, Rose) on an immersive dark canvas ensure maximum reading accuracy during critical operations.
