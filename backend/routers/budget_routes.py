from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Budget, Transaction, User
from schemas import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetStatusResponse
from auth import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetStatusResponse])
def get_budgets_with_status(
    month_year: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    current_month_prefix = now.strftime("%Y-%m")

    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()

    # Calculate spent amount per category for current month
    expenses_query = (
        db.query(
            Transaction.category,
            func.coalesce(func.sum(Transaction.amount), 0.0).label("total_spent")
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        )
    )

    # Filter to transactions in the active month
    start_of_month = datetime(now.year, now.month, 1)
    if now.month == 12:
        end_of_month = datetime(now.year + 1, 1, 1)
    else:
        end_of_month = datetime(now.year, now.month + 1, 1)

    expenses_query = expenses_query.filter(
        Transaction.date >= start_of_month,
        Transaction.date < end_of_month
    )

    expenses_by_cat = {
        row.category.lower(): float(row.total_spent)
        for row in expenses_query.group_by(Transaction.category).all()
    }

    results = []
    for b in budgets:
        spent = expenses_by_cat.get(b.category.lower(), 0.0)
        remaining = max(0.0, b.monthly_limit - spent)
        pct = round((spent / b.monthly_limit * 100), 1) if b.monthly_limit > 0 else 0.0

        if pct >= 100:
            status_val = "exceeded"
        elif pct >= 80:
            status_val = "warning"
        else:
            status_val = "safe"

        results.append(
            BudgetStatusResponse(
                id=b.id,
                category=b.category,
                monthly_limit=round(b.monthly_limit, 2),
                spent_amount=round(spent, 2),
                remaining_amount=round(remaining, 2),
                percentage_used=pct,
                status=status_val,
            )
        )

    return results


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def set_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clean_cat = budget_in.category.strip()

    # Check if budget for this category already exists for user
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        func.lower(Budget.category) == clean_cat.lower()
    ).first()

    if existing:
        existing.monthly_limit = round(budget_in.monthly_limit, 2)
        existing.month_year = budget_in.month_year or "ALL"
        db.commit()
        db.refresh(existing)
        return existing

    new_budget = Budget(
        user_id=current_user.id,
        category=clean_cat,
        monthly_limit=round(budget_in.monthly_limit, 2),
        month_year=budget_in.month_year or "ALL"
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    b.monthly_limit = round(budget_in.monthly_limit, 2)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    db.delete(b)
    db.commit()
    return None
