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

## Testing the Media Pipe

A Python script is provided to simulate the ingestion backend and verify that screen/audio capture is working correctly.

### 1. Requirements
Install the required Python packages:
```bash
pip install fastapi uvicorn python-multipart
```

### 2. Run the Test Server
```bash
python test_media_server.py
```
The server starts at `http://localhost:8000`.

### 3. Chunk Storage
When you start a meeting and select a screen to share, the app will send 2-second media chunks to this server.
- **Storage Path:** `./received_chunks/`
- **Filename:** `meeting_{id}.webm`
- Chunks are appended to the file in real-time, allowing you to play the resulting video after ending the meeting.
