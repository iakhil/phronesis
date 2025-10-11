"""
CRUD operations for database models.
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from models import Curriculum, LearningSession
from datetime import datetime


# ============================================================================
# Curriculum CRUD Operations
# ============================================================================

def get_curriculum(db: Session, subtopic: str) -> Optional[Curriculum]:
    """
    Get curriculum by subtopic name.
    
    Args:
        db: Database session
        subtopic: Name of the subtopic
        
    Returns:
        Curriculum object or None if not found
    """
    return db.query(Curriculum).filter(Curriculum.subtopic == subtopic).first()


def get_all_curriculums(db: Session) -> List[Curriculum]:
    """
    Get all curriculums from the database.
    
    Args:
        db: Database session
        
    Returns:
        List of all Curriculum objects
    """
    return db.query(Curriculum).all()


def create_curriculum(db: Session, subtopic: str, curriculum_data: list) -> Curriculum:
    """
    Create a new curriculum entry.
    
    Args:
        db: Database session
        subtopic: Name of the subtopic
        curriculum_data: List of curriculum items
        
    Returns:
        Created Curriculum object
    """
    db_curriculum = Curriculum(
        subtopic=subtopic,
        curriculum_data=curriculum_data
    )
    db.add(db_curriculum)
    db.commit()
    db.refresh(db_curriculum)
    return db_curriculum


def update_curriculum(db: Session, subtopic: str, curriculum_data: list) -> Optional[Curriculum]:
    """
    Update existing curriculum or create if doesn't exist.
    
    Args:
        db: Database session
        subtopic: Name of the subtopic
        curriculum_data: List of curriculum items
        
    Returns:
        Updated Curriculum object
    """
    db_curriculum = get_curriculum(db, subtopic)
    if db_curriculum:
        db_curriculum.curriculum_data = curriculum_data
        db_curriculum.updated_at = datetime.now()
        db.commit()
        db.refresh(db_curriculum)
        return db_curriculum
    else:
        return create_curriculum(db, subtopic, curriculum_data)


def delete_curriculum(db: Session, subtopic: str) -> bool:
    """
    Delete a curriculum entry.
    
    Args:
        db: Database session
        subtopic: Name of the subtopic
        
    Returns:
        True if deleted, False if not found
    """
    db_curriculum = get_curriculum(db, subtopic)
    if db_curriculum:
        db.delete(db_curriculum)
        db.commit()
        return True
    return False


# ============================================================================
# Learning Session CRUD Operations (for future use)
# ============================================================================

def create_learning_session(
    db: Session, 
    subtopic: str, 
    mode: str, 
    session_data: dict = None
) -> LearningSession:
    """
    Create a new learning session.
    
    Args:
        db: Database session
        subtopic: Name of the subtopic
        mode: 'learn' or 'quiz'
        session_data: Optional session-specific data
        
    Returns:
        Created LearningSession object
    """
    db_session = LearningSession(
        subtopic=subtopic,
        mode=mode,
        session_data=session_data or {}
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_learning_session(db: Session, session_id: int) -> Optional[LearningSession]:
    """
    Get a learning session by ID.
    
    Args:
        db: Database session
        session_id: Session ID
        
    Returns:
        LearningSession object or None if not found
    """
    return db.query(LearningSession).filter(LearningSession.id == session_id).first()


def complete_learning_session(db: Session, session_id: int) -> Optional[LearningSession]:
    """
    Mark a learning session as completed.
    
    Args:
        db: Database session
        session_id: Session ID
        
    Returns:
        Updated LearningSession object or None if not found
    """
    db_session = get_learning_session(db, session_id)
    if db_session:
        db_session.completed_at = datetime.now()
        db.commit()
        db.refresh(db_session)
    return db_session

