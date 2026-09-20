import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

from database import get_db
from models import Transaction, User
from schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
)
from auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    search: Optional[str] = Query(None, description="Search keyword in title or notes"),
    category: Optional[str] = Query(None, description="Filter by category"),
    transaction_type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    start_date: Optional[datetime] = Query(None, description="Filter start date"),
    end_date: Optional[datetime] = Query(None, description="Filter end date"),
    sort_by: str = Query("date", pattern="^(date|amount|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Transaction.title.ilike(search_pattern)) |
            (Transaction.category.ilike(search_pattern)) |
            (Transaction.notes.ilike(search_pattern))
        )

    if category and category != "All":
        query = query.filter(Transaction.category.ilike(category))

    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)

    if start_date:
        query = query.filter(Transaction.date >= start_date)

    if end_date:
        query = query.filter(Transaction.date <= end_date)

    # Compute totals for the filtered set
    total_count = query.count()

    total_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "income"
        )
    )
    if search:
        total_income = total_income.filter(
            (Transaction.title.ilike(f"%{search}%")) |
            (Transaction.category.ilike(f"%{search}%")) |
            (Transaction.notes.ilike(f"%{search}%"))
        )
    if category and category != "All":
        total_income = total_income.filter(Transaction.category.ilike(category))
    if start_date:
        total_income = total_income.filter(Transaction.date >= start_date)
    if end_date:
        total_income = total_income.filter(Transaction.date <= end_date)
    income_sum = float(total_income.scalar() or 0.0)

    total_expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        )
    )
    if search:
        total_expense = total_expense.filter(
            (Transaction.title.ilike(f"%{search}%")) |
            (Transaction.category.ilike(f"%{search}%")) |
            (Transaction.notes.ilike(f"%{search}%"))
        )
    if category and category != "All":
        total_expense = total_expense.filter(Transaction.category.ilike(category))
    if start_date:
        total_expense = total_expense.filter(Transaction.date >= start_date)
    if end_date:
        total_expense = total_expense.filter(Transaction.date <= end_date)
    expense_sum = float(total_expense.scalar() or 0.0)

    # Apply sorting
    sort_col = getattr(Transaction, sort_by)
    query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))

    transactions = query.offset(skip).limit(limit).all()

    return {
        "transactions": transactions,
        "total_count": total_count,
        "total_income": income_sum,
        "total_expense": expense_sum,
    }


@router.get("/export/csv")
def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.date))
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Title", "Category", "Type", "Amount", "Payment Method", "Notes"])

    for tx in transactions:
        date_str = tx.date.strftime("%Y-%m-%d %H:%M:%S") if tx.date else ""
        writer.writerow([
            tx.id,
            date_str,
            tx.title,
            tx.category,
            tx.transaction_type,
            f"{tx.amount:.2f}",
            tx.payment_method or "card",
            tx.notes or "",
        ])

    csv_data = output.getvalue()
    filename = f"smart_expense_transactions_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = Transaction(
        user_id=current_user.id,
        title=tx_in.title.strip(),
        amount=round(tx_in.amount, 2),
        category=tx_in.category.strip(),
        transaction_type=tx_in.transaction_type,
        payment_method=tx_in.payment_method or "card",
        date=tx_in.date or datetime.utcnow(),
        notes=tx_in.notes.strip() if tx_in.notes else None,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/{tx_id}", response_model=TransactionResponse)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return tx


@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: int,
    tx_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if tx_in.title is not None:
        tx.title = tx_in.title.strip()
    if tx_in.amount is not None:
        tx.amount = round(tx_in.amount, 2)
    if tx_in.category is not None:
        tx.category = tx_in.category.strip()
    if tx_in.transaction_type is not None:
        tx.transaction_type = tx_in.transaction_type
    if tx_in.payment_method is not None:
        tx.payment_method = tx_in.payment_method
    if tx_in.date is not None:
        tx.date = tx_in.date
    if tx_in.notes is not None:
        tx.notes = tx_in.notes.strip() if tx_in.notes else None

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return None
