from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ----------------- User Schemas -----------------
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    currency: Optional[str] = "$"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    currency: str = "$"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


# ----------------- Transaction Schemas -----------------
class TransactionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=60)
    transaction_type: str = Field(..., pattern="^(income|expense)$")
    payment_method: Optional[str] = "card"
    date: Optional[datetime] = None
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    transaction_type: Optional[str] = Field(None, pattern="^(income|expense)$")
    payment_method: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total_count: int
    total_income: float
    total_expense: float


# ----------------- Budget Schemas -----------------
class BudgetCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=60)
    monthly_limit: float = Field(..., gt=0)
    month_year: Optional[str] = "ALL"


class BudgetUpdate(BaseModel):
    monthly_limit: float = Field(..., gt=0)


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    month_year: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BudgetStatusResponse(BaseModel):
    id: int
    category: str
    monthly_limit: float
    spent_amount: float
    remaining_amount: float
    percentage_used: float
    status: str  # 'safe' (<80%), 'warning' (80-100%), 'exceeded' (>100%)


# ----------------- Analytics Schemas -----------------
class OverviewStats(BaseModel):
    total_balance: float
    total_income: float
    total_expense: float
    savings_rate: float
    transaction_count: int
    currency: str = "$"


class CashflowPoint(BaseModel):
    period: str
    income: float
    expense: float
    net: float


class CategoryBreakdown(BaseModel):
    category: str
    total_amount: float
    percentage: float
    count: int
    color: str


class SmartInsight(BaseModel):
    id: str
    type: str  # 'success' | 'warning' | 'info' | 'danger'
    title: str
    message: str
    metric: Optional[str] = None