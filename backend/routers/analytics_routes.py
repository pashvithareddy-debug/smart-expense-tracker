from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Transaction, Budget, User
from schemas import (
    OverviewStats,
    CashflowPoint,
    CategoryBreakdown,
    SmartInsight,
)
from auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

CATEGORY_PALETTE = [
    "#6366f1",  # Indigo
    "#ec4899",  # Pink
    "#f59e0b",  # Amber
    "#10b981",  # Emerald
    "#06b6d4",  # Cyan
    "#8b5cf6",  # Violet
    "#f97316",  # Orange
    "#14b8a6",  # Teal
    "#3b82f6",  # Blue
    "#a855f7",  # Purple
    "#ef4444",  # Red
]


@router.get("/overview", response_model=OverviewStats)
def get_overview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "income"
        )
        .scalar()
    )
    total_expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        )
        .scalar()
    )
    tx_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.user_id == current_user.id)
        .scalar()
    )

    income_val = float(total_income)
    expense_val = float(total_expense)
    balance = income_val - expense_val
    savings_rate = round(((balance / income_val) * 100), 1) if income_val > 0 else 0.0

    return OverviewStats(
        total_balance=round(balance, 2),
        total_income=round(income_val, 2),
        total_expense=round(expense_val, 2),
        savings_rate=savings_rate,
        transaction_count=tx_count,
        currency=current_user.currency or "$",
    )


@router.get("/cashflow", response_model=List[CashflowPoint])
def get_cashflow_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.asc())
        .all()
    )

    if not transactions:
        # Generate placeholder months so charts render cleanly
        now = datetime.utcnow()
        months = []
        for i in range(5, -1, -1):
            target = now - timedelta(days=i * 30)
            months.append(
                CashflowPoint(
                    period=target.strftime("%b %Y"),
                    income=0.0,
                    expense=0.0,
                    net=0.0,
                )
            )
        return months

    monthly_data = {}
    for tx in transactions:
        period_key = tx.date.strftime("%b %Y")
        if period_key not in monthly_data:
            monthly_data[period_key] = {"income": 0.0, "expense": 0.0}

        if tx.transaction_type == "income":
            monthly_data[period_key]["income"] += tx.amount
        else:
            monthly_data[period_key]["expense"] += tx.amount

    result = []
    for period, vals in monthly_data.items():
        inc = round(vals["income"], 2)
        exp = round(vals["expense"], 2)
        result.append(
            CashflowPoint(
                period=period,
                income=inc,
                expense=exp,
                net=round(inc - exp, 2),
            )
        )

    # Return at most last 12 periods
    return result[-12:]


@router.get("/categories", response_model=List[CategoryBreakdown])
def get_category_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense_query = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count")
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    total_expense = sum(row.total for row in expense_query) if expense_query else 0.0

    breakdown = []
    for idx, row in enumerate(expense_query):
        total_amt = round(float(row.total), 2)
        pct = round((total_amt / total_expense * 100), 1) if total_expense > 0 else 0.0
        color = CATEGORY_PALETTE[idx % len(CATEGORY_PALETTE)]

        breakdown.append(
            CategoryBreakdown(
                category=row.category,
                total_amount=total_amt,
                percentage=pct,
                count=row.count,
                color=color,
            )
        )

    return breakdown


@router.get("/insights", response_model=List[SmartInsight])
def get_smart_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    insights = []
    currency = current_user.currency or "$"

    # 1. Check Totals & Savings Rate
    income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "income"
        )
        .scalar()
    )
    expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        )
        .scalar()
    )

    inc_val = float(income)
    exp_val = float(expense)

    if inc_val > 0:
        savings_pct = ((inc_val - exp_val) / inc_val) * 100
        if savings_pct >= 30:
            insights.append(
                SmartInsight(
                    id="savings_high",
                    type="success",
                    title="Exceptional Savings Velocity",
                    message=f"You are saving {savings_pct:.1f}% of your total earnings. You are well above the recommended 20% financial rule!",
                    metric=f"+{savings_pct:.1f}% Saved",
                )
            )
        elif savings_pct > 0:
            insights.append(
                SmartInsight(
                    id="savings_moderate",
                    type="info",
                    title="Healthy Positive Cash Flow",
                    message=f"Your savings rate is {savings_pct:.1f}%. Trimming discretionary expenses could help boost this to 25%.",
                    metric=f"{savings_pct:.1f}% Savings",
                )
            )
        else:
            insights.append(
                SmartInsight(
                    id="savings_deficit",
                    type="danger",
                    title="Cash Flow Deficit Alert",
                    message=f"Total expenses ({currency}{exp_val:,.2f}) currently exceed recorded income ({currency}{inc_val:,.2f}).",
                    metric="Negative Balance",
                )
            )

    # 2. Check Top Spending Category
    top_category = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("cat_total")
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
        .first()
    )

    if top_category and exp_val > 0:
        cat_pct = (float(top_category.cat_total) / exp_val) * 100
        insights.append(
            SmartInsight(
                id="top_spend",
                type="info",
                title=f"Primary Expense Driver: {top_category.category}",
                message=f"{top_category.category} represents {cat_pct:.1f}% of all your recorded expenses ({currency}{float(top_category.cat_total):,.2f}).",
                metric=f"{cat_pct:.1f}% of Expenses",
            )
        )

    # 3. Check Budgets Status
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    if budgets:
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        over_budget_cats = []
        near_budget_cats = []

        for b in budgets:
            spent = (
                db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
                .filter(
                    Transaction.user_id == current_user.id,
                    Transaction.transaction_type == "expense",
                    func.lower(Transaction.category) == b.category.lower(),
                    Transaction.date >= start_of_month
                )
                .scalar()
            )
            spent_amt = float(spent)
            if spent_amt > b.monthly_limit:
                over_budget_cats.append((b.category, spent_amt - b.monthly_limit))
            elif spent_amt >= (b.monthly_limit * 0.8):
                near_budget_cats.append(b.category)

        if over_budget_cats:
            cat_names = ", ".join([c[0] for c in over_budget_cats])
            insights.append(
                SmartInsight(
                    id="budget_exceeded",
                    type="danger",
                    title="Budget Limit Exceeded",
                    message=f"Category '{cat_names}' has exceeded your planned monthly limit this month.",
                    metric="Action Needed",
                )
            )
        elif near_budget_cats:
            cat_names = ", ".join(near_budget_cats)
            insights.append(
                SmartInsight(
                    id="budget_warning",
                    type="warning",
                    title="Approaching Monthly Limit",
                    message=f"Category '{cat_names}' is currently over 80% of its designated monthly limit.",
                    metric="80%+ Used",
                )
            )
        else:
            insights.append(
                SmartInsight(
                    id="budget_on_track",
                    type="success",
                    title="All Category Budgets On Track",
                    message="All your monitored categories are well within their spending limits for this month.",
                    metric="100% Compliant",
                )
            )
    else:
        insights.append(
            SmartInsight(
                id="budget_prompt",
                type="info",
                title="Unlock Smarter Tracking with Budgets",
                message="Set category monthly limits in the Budgets tab to receive real-time threshold warnings and pace tracking.",
                metric="Get Started",
            )
        )

    return insights
