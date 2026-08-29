import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("AI_API_KEY")
BASE_URL = os.getenv("AI_BASE_URL")

if API_KEY and BASE_URL:
    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL
    )
    
# Initialize FastAPI app
app = FastAPI(title="TunasCoal Website")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Read Knowledge Base and System Instruction
kb_path = "TunasCoal_Knowledge_v1.md"
kb_content = ""
try:
    with open(kb_path, "r", encoding="utf-8") as f:
        kb_content = f.read()
except FileNotFoundError:
    print(f"Warning: {kb_path} not found.")

sys_inst_path = "System Instruction.md"
sys_content = ""
try:
    with open(sys_inst_path, "r", encoding="utf-8") as f:
        sys_content = f.read()
except FileNotFoundError:
    print(f"Warning: {sys_inst_path} not found.")

system_instruction = f"{sys_content}\n\nKNOWLEDGE BASE:\n{kb_content}"

class ChatMessage(BaseModel):
    conversation_id: str
    message: str

chat_histories = {}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.post("/api/chat")
async def chat_endpoint(chat_message: ChatMessage):
    if not API_KEY or not BASE_URL:
         return {"response": "System: AI_API_KEY or AI_BASE_URL is not configured yet. Please configure it in the .env file."}
    
    # Initialize history for new conversation
    if chat_message.conversation_id not in chat_histories:
        chat_histories[chat_message.conversation_id] = [
            {"role": "system", "content": system_instruction}
        ]
    
    history = chat_histories[chat_message.conversation_id]
    
    # Add user message
    history.append({"role": "user", "content": chat_message.message})
    
    try:
        response = client.chat.completions.create(
            model="siaptuan",
            messages=history,
            temperature=0.3
        )
        bot_reply = response.choices[0].message.content
        
        # Add assistant message
        history.append({"role": "assistant", "content": bot_reply})
        
        return {"response": bot_reply}
    except Exception as e:
        history.pop() # Remove failed user message
        return {"response": f"An error occurred: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
