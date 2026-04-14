from sqlalchemy.orm import Session
from models import GeneralExpense, Task, TaskStatus, TaskPriority
from schemas.general import GeneralExpenseCreate
from schemas.tasks import TaskCreate
from datetime import datetime

def create_general_expense(db: Session, expense: GeneralExpenseCreate) -> GeneralExpense:
    db_expense = GeneralExpense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_general_expenses(db: Session, skip: int = 0, limit: int = 100) -> list[GeneralExpense]:
    return db.query(GeneralExpense).offset(skip).limit(limit).all()

def get_general_expense(db: Session, expense_id: int) -> GeneralExpense:
    return db.query(GeneralExpense).filter(GeneralExpense.id == expense_id).first()

def update_general_expense(db: Session, expense_id: int, expense: GeneralExpenseCreate) -> GeneralExpense:
    db_expense = get_general_expense(db, expense_id)
    if not db_expense:
        return None
    
    for key, value in expense.model_dump().items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_general_expense(db: Session, expense_id: int) -> bool:
    db_expense = get_general_expense(db, expense_id)
    if not db_expense:
        return False
    
    db.delete(db_expense)
    db.commit()
    return True

def create_task(db: Session, task: TaskCreate, assigned_by: int) -> Task:
    db_task = Task(**task.model_dump(), assigned_by=assigned_by)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_tasks(db: Session, skip: int = 0, limit: int = 100) -> list[Task]:
    return db.query(Task).offset(skip).limit(limit).all()

def get_task(db: Session, task_id: int) -> Task:
    return db.query(Task).filter(Task.id == task_id).first()

def get_user_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[Task]:
    return db.query(Task).filter(Task.assigned_to == user_id).offset(skip).limit(limit).all()

def get_created_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[Task]:
    return db.query(Task).filter(Task.assigned_by == user_id).offset(skip).limit(limit).all()

def update_task(db: Session, task_id: int, task_update: dict) -> Task:
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    # Normalize status and priority to enum values
    if "status" in task_update:
        status_val = task_update["status"]
        if isinstance(status_val, str):
            # Accept both uppercase and lowercase, with or without underscores
            status_val = status_val.strip().lower().replace("-", "_")
            valid_statuses = [e.value for e in TaskStatus]
            if status_val in valid_statuses:
                task_update["status"] = status_val
            else:
                raise ValueError(f"Invalid status value: {status_val}")

    if "priority" in task_update:
        priority_val = task_update["priority"]
        if isinstance(priority_val, str):
            priority_val = priority_val.strip().lower()
            valid_priorities = [e.value for e in TaskPriority]
            if priority_val in valid_priorities:
                task_update["priority"] = priority_val
            else:
                raise ValueError(f"Invalid priority value: {priority_val}")

    if task_update.get("status") == "completed" and db_task.status != "completed":
        task_update["completed_at"] = datetime.utcnow()

    for key, value in task_update.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task(db, task_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True 