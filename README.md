# Linen Calculator

A web application for calculating linen requirements across holiday rental properties. Built with React and Tailwind CSS.

Based on the Excel spreadsheet calculator, enhanced with a multi-step interface, PAR level support, scenario management, and PDF export.

## Features

- **Multi-step wizard** - Properties setup, item selection, quantity configuration, and results
- **6 pre-loaded properties** from the original spreadsheet with real data
- **15 linen item types** organised by category (Bedding, Towels, Kitchen, Other)
- **PAR level multiplier** (1x to 3x) for stock rotation planning
- **Real-time calculations** updating as you adjust quantities
- **Save/load scenarios** with local storage persistence
- **PDF export** and print-friendly layout
- **Custom items** - add your own linen types
- **Responsive design** - works on mobile and desktop

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
```

Output goes to `dist/` directory.

## Deploy to Vercel

```bash
npx vercel
```

Or connect your Git repository to Vercel for automatic deployments. No configuration needed - Vite is auto-detected.

## How It Works

The core calculation: **Total = (items per stay) x (number of stays) x (PAR level)**

1. **Properties** - Define your rental properties and how many guest stays are expected
2. **Linen Items** - Select which items to track (pre-populated from the spreadsheet)
3. **Quantities** - Set per-stay quantities for each item at each property
4. **Results** - View totals by property, by item, and grand totals with visual charts

## Tech Stack

- React 19 with functional components and hooks
- Tailwind CSS v4
- Vite
- jsPDF + html2canvas for PDF export
- Lucide React for icons
- Local storage for data persistence
