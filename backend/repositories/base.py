import uuid
from typing import Generic, List, Optional, Type, TypeVar
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.base import Base, get_utc_now

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: uuid.UUID) -> Optional[ModelType]:
        """Fetch a single record by its UUID, ignoring soft-deleted ones."""
        query = select(self.model).where(self.model.id == id, self.model.deleted_at.is_(None))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Fetch a list of active records."""
        query = (
            select(self.model)
            .where(self.model.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add(self, entity: ModelType) -> ModelType:
        """Add a new entity to the session and commit."""
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity

    async def update(self, entity: ModelType) -> ModelType:
        """Update an existing entity and commit."""
        await self.db.commit()
        await self.db.refresh(entity)
        return entity

    async def delete(self, id: uuid.UUID) -> bool:
        """Soft delete a record by ID."""
        entity = await self.get_by_id(id)
        if not entity:
            return False
        entity.deleted_at = get_utc_now()
        await self.db.commit()
        return True

    async def hard_delete(self, id: uuid.UUID) -> bool:
        """Hard delete a record from the database."""
        entity = await self.db.get(self.model, id)
        if not entity:
            return False
        await self.db.delete(entity)
        await self.db.commit()
        return True
