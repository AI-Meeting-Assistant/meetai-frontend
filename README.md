# MeetAI Frontend

AI-powered meeting assistant built with Electron and React.

## Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Run in development:**
   ```bash
   npm run dev
   ```

## Building the Executable

To generate the standalone `.exe` file for Windows:
```bash
npm run build
```
The packaged output and installer will be located in the `release/<version>/` directory. (Note: `dist/` only contains the compiled React frontend assets).

---

## Tests

```bash
npm test
```

PDF export is generated client-side in the Electron main process (`window.meetai.exportPdf`); no backend export endpoint is used.
