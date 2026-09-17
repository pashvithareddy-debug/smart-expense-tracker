from fastapi import FastAPI

app = FastAPI(
    title="Smart Expense Tracker API",
    description="Backend API for a personal expense tracking application",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Smart Expense Tracker API is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }