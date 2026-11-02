"""
Shelf Life Estimator — SQLAlchemy ORM Models
=============================================
Database table definitions for the Fruit Shelf Life Estimator.

Tables:
    - Fruit: Reference table of all known fruits with shelf life data
    - User: User accounts
    - UserInventory: Fruits a user is tracking
    - Notification: Expiry alert notifications
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Fruit(Base):
    """
    Reference table of all known fruits with shelf life data.

    Each fruit has baseline shelf life values for different
    storage methods (room temperature, refrigerator, freezer),
    fruit-specific attributes (subcategory, ethylene data),
    and curated storage tips.
    """

    __tablename__ = "fruits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    subcategory: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Shelf life data (in days) for each storage method
    shelf_life_room_temp_days: Mapped[float] = mapped_column(Float, nullable=False)
    shelf_life_fridge_days: Mapped[float] = mapped_column(Float, nullable=False)
    shelf_life_freezer_days: Mapped[float] = mapped_column(Float, nullable=False)

    # Fruit-specific attributes
    is_ethylene_producer: Mapped[bool] = mapped_column(Boolean, default=False)
    is_ethylene_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    optimal_temp_min: Mapped[float] = mapped_column(Float, nullable=True)  # °C
    optimal_temp_max: Mapped[float] = mapped_column(Float, nullable=True)  # °C
    ripeness_indicator: Mapped[str | None] = mapped_column(Text, nullable=True)

    # General info
    storage_tips: Mapped[str] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationship: a fruit can appear in many inventory entries
    inventory_items: Mapped[list["UserInventory"]] = relationship(
        back_populates="fruit", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Fruit(id={self.id}, name='{self.name}', subcategory='{self.subcategory}')>"


class User(Base):
    """
    User accounts for the application.

    Stores basic auth info. Can be expanded later with
    profile data, preferences, etc.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    inventory_items: Mapped[list["UserInventory"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"


class UserInventory(Base):
    """
    Tracks fruits scanned/added by a user.

    Each record represents one fruit the user is tracking,
    with its freshness score, storage method, and estimated expiry.
    """

    __tablename__ = "user_inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    fruit_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("fruits.id", ondelete="CASCADE"), nullable=False
    )
    freshness_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    storage_method: Mapped[str] = mapped_column(
        String(20), nullable=False, default="room_temp"
    )  # room_temp, fridge, freezer
    estimated_days_remaining: Mapped[float] = mapped_column(Float, nullable=False)
    scanned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    estimated_expiry: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    is_expired: Mapped[bool] = mapped_column(Boolean, default=False)
    is_consumed: Mapped[bool] = mapped_column(Boolean, default=False)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="inventory_items")
    fruit: Mapped["Fruit"] = relationship(back_populates="inventory_items")
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="inventory_item", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<UserInventory(id={self.id}, fruit='{self.fruit_id}', "
            f"days_remaining={self.estimated_days_remaining})>"
        )


class Notification(Base):
    """
    Expiry alert notifications for inventory items.

    Generated by the background scheduler when fruits
    are approaching their estimated expiry date.
    """

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    inventory_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_inventory.id", ondelete="CASCADE"), nullable=False
    )
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    notify_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    inventory_item: Mapped["UserInventory"] = relationship(back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, sent={self.sent})>"
