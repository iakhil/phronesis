"""
SQLAlchemy models for Phronesis database.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Curriculum(Base):
    """
    Model for storing curriculum data for each subtopic.
    """
    __tablename__ = "curriculums"

    id = Column(Integer, primary_key=True, index=True)
    subtopic = Column(String(255), unique=True, index=True, nullable=False)
    curriculum_data = Column(JSON, nullable=False)  # Stores the list of curriculum items
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Curriculum(subtopic='{self.subtopic}', items={len(self.curriculum_data)})>"


class LearningSession(Base):
    """
    Model for tracking user learning sessions (future enhancement).
    Can be used to store user progress, quiz scores, etc.
    """
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    subtopic = Column(String(255), index=True, nullable=False)
    mode = Column(String(50), nullable=False)  # 'learn' or 'quiz'
    session_data = Column(JSON)  # Stores session-specific data (questions, scores, etc.)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<LearningSession(subtopic='{self.subtopic}', mode='{self.mode}')>"


class ScrollContent(Base):
    """
    Model for caching generated scroll feed content.
    Stores content for each topic and type to avoid regenerating.
    """
    __tablename__ = "scroll_contents"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(255), index=True, nullable=False)
    content_type = Column(String(50), index=True, nullable=False)  # 'fact', 'story', 'question', etc.
    content = Column(Text, nullable=False)  # The generated content text
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ScrollContent(topic='{self.topic}', type='{self.content_type}')>"

