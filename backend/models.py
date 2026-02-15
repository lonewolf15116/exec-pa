from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from db import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    priority = Column(Integer, default=2)  # 1=high, 2=normal, 3=low
    done = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
