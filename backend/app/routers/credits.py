from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Order, User
from app.schemas import PurchaseRequest, UserOut

router = APIRouter(prefix="/api/credits", tags=["credits"])

PLANS = {
    "pro": {"price": 29, "credits": 50},
    "enterprise": {"price": 99, "credits": 200},
}


@router.post("/purchase", response_model=UserOut)
def mock_purchase(
    payload: PurchaseRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    plan = PLANS.get(payload.plan_tier)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    user.credits += plan["credits"]
    user.plan_tier = payload.plan_tier
    db.add(
        Order(
            user_id=user.id,
            plan_tier=payload.plan_tier,
            amount=plan["price"],
            credits_added=plan["credits"],
            status="completed",
        )
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/orders")
def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.scalars(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    )
    return list(orders)
