from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a directory to save chunks
UPLOAD_DIR = "received_chunks"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Media Ingest Test Server Running"}

@app.post("/ingest/chunk")
async def ingest_chunk(
    meetingId: str = Form(...),
    streamTicket: str = Form(...),
    mediaChunk: UploadFile = File(...)
):
    print(f"Received chunk for meeting: {meetingId}, ticket: {streamTicket}")
    
    # Save the chunk to a file (appending to simulate a stream)
    file_name = f"meeting_{meetingId}.webm"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    content = await mediaChunk.read()
    content_size = len(content)
    
    with open(file_path, "ab") as f:
        f.write(content)
        
    print(f"Saved {content_size} bytes to {file_path}")
    
    return {
        "status": "ok", 
        "meetingId": meetingId, 
        "received_bytes": content_size,
        "total_file": file_path
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting test server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
