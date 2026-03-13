from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
from supabase import create_client, Client

app = FastAPI(title="Notus API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_supabase)
):
    token = credentials.credentials
    try:
        res = db.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return res.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Não autenticado")


# ─── Models ───────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    name: str
    color: str = "#7c6af7"

class NoteCreate(BaseModel):
    title: str
    content: str = ""
    tag_ids: Optional[List[str]] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    is_pinned: Optional[bool] = None

class EventCreate(BaseModel):
    title: str
    description: str = ""
    date: str
    time: Optional[str] = None
    tag_ids: Optional[List[str]] = []

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    tag_ids: Optional[List[str]] = None


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# ─── Tags ─────────────────────────────────────────────────────────────────────

@app.get("/api/tags")
def list_tags(user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    res = db.table("tags").select("*").eq("user_id", user_id).order("name").execute()
    return res.data

@app.post("/api/tags", status_code=201)
def create_tag(body: TagCreate, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    res = db.table("tags").insert({"name": body.name, "color": body.color, "user_id": user_id}).execute()
    return res.data[0]

@app.delete("/api/tags/{tag_id}", status_code=204)
def delete_tag(tag_id: str, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    db.table("tags").delete().eq("id", tag_id).eq("user_id", user_id).execute()


# ─── Notes ────────────────────────────────────────────────────────────────────

def _get_note(note_id: str, user_id: str, db: Client):
    res = db.table("notes").select("*, note_tags(tag_id, tags(id, name, color))").eq("id", note_id).eq("user_id", user_id).single().execute()
    note = res.data
    note["tags"] = [nt["tags"] for nt in note.pop("note_tags", []) if nt.get("tags")]
    return note

@app.get("/api/notes")
def list_notes(
    q: Optional[str] = None,
    tag_id: Optional[str] = None,
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_supabase)
):
    query = db.table("notes").select("*, note_tags(tag_id, tags(id, name, color))").eq("user_id", user_id)
    if q:
        query = query.or_(f"title.ilike.%{q}%,content.ilike.%{q}%")
    res = query.order("is_pinned", desc=True).order("updated_at", desc=True).execute()
    notes = res.data
    if tag_id:
        notes = [n for n in notes if any(nt["tag_id"] == tag_id for nt in n.get("note_tags", []))]
    for note in notes:
        note["tags"] = [nt["tags"] for nt in note.pop("note_tags", []) if nt.get("tags")]
    return notes

@app.post("/api/notes", status_code=201)
def create_note(body: NoteCreate, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    note = db.table("notes").insert({
        "title": body.title, "content": body.content,
        "user_id": user_id, "is_pinned": False
    }).execute().data[0]
    if body.tag_ids:
        db.table("note_tags").insert([{"note_id": note["id"], "tag_id": tid} for tid in body.tag_ids]).execute()
    return _get_note(note["id"], user_id, db)

@app.put("/api/notes/{note_id}")
def update_note(note_id: str, body: NoteUpdate, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    data = body.model_dump(exclude_none=True, exclude={"tag_ids"})
    if data:
        data["updated_at"] = datetime.utcnow().isoformat()
        db.table("notes").update(data).eq("id", note_id).eq("user_id", user_id).execute()
    if body.tag_ids is not None:
        db.table("note_tags").delete().eq("note_id", note_id).execute()
        if body.tag_ids:
            db.table("note_tags").insert([{"note_id": note_id, "tag_id": tid} for tid in body.tag_ids]).execute()
    return _get_note(note_id, user_id, db)

@app.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: str, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    db.table("notes").delete().eq("id", note_id).eq("user_id", user_id).execute()


# ─── Events ───────────────────────────────────────────────────────────────────

def _get_event(event_id: str, user_id: str, db: Client):
    res = db.table("events").select("*, event_tags(tag_id, tags(id, name, color))").eq("id", event_id).eq("user_id", user_id).single().execute()
    event = res.data
    event["tags"] = [et["tags"] for et in event.pop("event_tags", []) if et.get("tags")]
    return event

@app.get("/api/events")
def list_events(
    q: Optional[str] = None,
    tag_id: Optional[str] = None,
    month: Optional[str] = None,
    user_id: str = Depends(get_current_user),
    db: Client = Depends(get_supabase)
):
    query = db.table("events").select("*, event_tags(tag_id, tags(id, name, color))").eq("user_id", user_id)
    if q:
        query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
    if month:
        year, mo = month.split("-")
        next_mo = f"{year}-{int(mo)+1:02d}-01" if int(mo) < 12 else f"{int(year)+1}-01-01"
        query = query.gte("date", f"{month}-01").lt("date", next_mo)
    res = query.order("date").order("time").execute()
    events = res.data
    if tag_id:
        events = [e for e in events if any(et["tag_id"] == tag_id for et in e.get("event_tags", []))]
    for event in events:
        event["tags"] = [et["tags"] for et in event.pop("event_tags", []) if et.get("tags")]
    return events

@app.post("/api/events", status_code=201)
def create_event(body: EventCreate, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    event = db.table("events").insert({
        "title": body.title, "description": body.description,
        "date": body.date, "time": body.time, "user_id": user_id
    }).execute().data[0]
    if body.tag_ids:
        db.table("event_tags").insert([{"event_id": event["id"], "tag_id": tid} for tid in body.tag_ids]).execute()
    return _get_event(event["id"], user_id, db)

@app.put("/api/events/{event_id}")
def update_event(event_id: str, body: EventUpdate, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    data = body.model_dump(exclude_none=True, exclude={"tag_ids"})
    if data:
        db.table("events").update(data).eq("id", event_id).eq("user_id", user_id).execute()
    if body.tag_ids is not None:
        db.table("event_tags").delete().eq("event_id", event_id).execute()
        if body.tag_ids:
            db.table("event_tags").insert([{"event_id": event_id, "tag_id": tid} for tid in body.tag_ids]).execute()
    return _get_event(event_id, user_id, db)

@app.delete("/api/events/{event_id}", status_code=204)
def delete_event(event_id: str, user_id: str = Depends(get_current_user), db: Client = Depends(get_supabase)):
    db.table("events").delete().eq("id", event_id).eq("user_id", user_id).execute()
