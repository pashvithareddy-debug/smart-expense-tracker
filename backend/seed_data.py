import os
import sys
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User, Transaction, Budget
from auth import hash_password


def seed():
    db = SessionLocal()
    try:
        # Check or create demo user
        demo_email = "ashvitha@example.com"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            user = User(
                name="Ashvitha",
                email=demo_email,
                hashed_password=hash_password("password123"),
                currency="$"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {user.email}")
        else:
            user.hashed_password = hash_password("password123")
            db.commit()
            db.refresh(user)
            print(f"Using existing user and reset demo password: {user.email}")

        # Check existing transactions
        tx_count = db.query(Transaction).filter(Transaction.user_id == user.id).count()
        if tx_count == 0:
            print("Seeding demo transactions...")
            categories_expenses = [
                ("Housing & Rent", 1200.00, ["Apartment monthly rent"]),
                ("Groceries & Markets", 95.50, ["Whole Foods weekly haul", "Trader Joe's essentials", "Costco household goods", "Organic market vegetables"]),
                ("Dining & Cafes", 32.50, ["Artisan Coffee & Croissant", "Italian Bistro dinner", "Sushi takeout", "Lunch with colleagues", "Sunday Brunch"]),
                ("Utilities & Internet", 115.00, ["High-speed fiber internet", "Electricity & Gas bill", "Water bill"]),
                ("Entertainment & Tech", 45.00, ["Netflix & Spotify subscription", "Cinema tickets", "Steam game purchase", "Concert tickets"]),
                ("Transportation", 55.00, ["Metro monthly pass", "Uber rides across town", "Gas station refill"]),
                ("Health & Wellness", 75.00, ["Gym membership", "Pharmacy vitamins", "Yoga session class"]),
                ("Shopping", 85.00, ["Amazon essentials", "Spring wardrobe upgrade", "Tech accessories"])
            ]

            categories_income = [
                ("Salary", 4500.00, ["Monthly Software Engineer Salary"]),
                ("Freelance & Consulting", 850.00, ["UI/UX consultation project", "Backend API audit", "Web design sprint"]),
                ("Dividends & Investments", 220.00, ["Quarterly index fund dividend", "Yield staking reward"])
            ]

            now = datetime.utcnow()

            # Seed 4 months of transactions
            for month_offset in range(3, -1, -1):
                base_date = now - timedelta(days=month_offset * 30)

                # Add income for each month
                salary_tx = Transaction(
                    user_id=user.id,
                    title="Tech Corp Monthly Salary",
                    amount=4500.00,
                    category="Salary",
                    transaction_type="income",
                    payment_method="bank_transfer",
                    date=datetime(base_date.year, base_date.month, 1, 9, 0),
                    notes="Direct deposit paystub"
                )
                db.add(salary_tx)

                if month_offset % 2 == 0:
                    freelance_tx = Transaction(
                        user_id=user.id,
                        title="Client API Development Project",
                        amount=950.00,
                        category="Freelance & Consulting",
                        transaction_type="income",
                        payment_method="bank_transfer",
                        date=datetime(base_date.year, base_date.month, 15, 14, 30),
                        notes="Milestone 2 deliverable payment"
                    )
                    db.add(freelance_tx)

                # Add rent
                rent_tx = Transaction(
                    user_id=user.id,
                    title="Modern Heights Apartment Rent",
                    amount=1200.00,
                    category="Housing & Rent",
                    transaction_type="expense",
                    payment_method="bank_transfer",
                    date=datetime(base_date.year, base_date.month, 2, 10, 0),
                    notes="Lease payment month"
                )
                db.add(rent_tx)

                # Add various expenses throughout the month
                for day in range(3, 28, 3):
                    cat, base_amt, titles = random.choice(categories_expenses)
                    tx_title = random.choice(titles)
                    # slight random variation in amount
                    amt = round(base_amt * random.uniform(0.75, 1.35), 2)
                    tx_date = datetime(base_date.year, base_date.month, min(day, 28), random.randint(8, 21), random.randint(0, 59))
                    tx = Transaction(
                        user_id=user.id,
                        title=tx_title,
                        amount=amt,
                        category=cat,
                        transaction_type="expense",
                        payment_method=random.choice(["card", "card", "cash", "upi"]),
                        date=tx_date,
                        notes=f"Auto-logged expense for {cat}"
                    )
                    db.add(tx)

            db.commit()
            print("Transactions seeded successfully!")
        else:
            print(f"Transactions already exist ({tx_count} records).")

        # Check or create budgets
        budget_count = db.query(Budget).filter(Budget.user_id == user.id).count()
        if budget_count == 0:
            print("Seeding category budgets...")
            demo_budgets = [
                ("Housing & Rent", 1300.00),
                ("Groceries & Markets", 500.00),
                ("Dining & Cafes", 300.00),
                ("Entertainment & Tech", 200.00),
                ("Transportation", 180.00),
                ("Health & Wellness", 150.00),
                ("Shopping", 250.00),
            ]
            for cat, limit in demo_budgets:
                b = Budget(
                    user_id=user.id,
                    category=cat,
                    monthly_limit=limit,
                    month_year="ALL"
                )
                db.add(b)
            db.commit()
            print("Budgets seeded successfully!")
        else:
            print(f"Budgets already exist ({budget_count} records).")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
