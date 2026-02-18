from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from db import SessionLocal, engine, Base
from models import Task

# ✅ Load environment variables FIRST
load_dotenv()

# ✅ Import AI AFTER .env is loaded
from ai import parse_task


# ---------------- APP ----------------
app = FastAPI(title="Executive Personal Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# ---------------- AI ----------------
class ParseTaskIn(BaseModel):
    text: str


class ParseTaskOut(BaseModel):
    title: str
    notes: str | None = None
    priority: int = 2


@app.post("/ai/parse-task", response_model=ParseTaskOut)
def ai_parse_task(payload: ParseTaskIn):
    return parse_task(payload.text)


# ---------------- DATABASE ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- TASK SCHEMAS ----------------
class TaskCreate(BaseModel):
    title: str
    notes: str | None = None
    priority: int = 2


class TaskOut(BaseModel):
    id: int
    title: str
    notes: str | None
    priority: int
    done: bool

    class Config:
        from_attributes = True


# ---------------- ROUTES ----------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/tasks", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = Task(title=payload.title, notes=payload.notes, priority=payload.priority)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.get("/tasks", response_model=list[TaskOut])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.id.desc()).all()


@app.patch("/tasks/{task_id}/done", response_model=TaskOut)
def mark_done(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        return {"error": "Task not found"}

    task.done = True
    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        return {"error": "Task not found"}

    db.delete(task)
    db.commit()
    return {"ok": True}
