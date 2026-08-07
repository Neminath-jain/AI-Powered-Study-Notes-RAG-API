import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

def get_utc_now():
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False
    )
    
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
        nullable=True
    )

    def to_dict(self) -> Dict[str, Any]:
        """Simple helper to convert a model to a dictionary."""
        return {
            c.name: getattr(self, c.name)
            for c in self.__table__.columns
            if getattr(self, c.name) is not None
        }
