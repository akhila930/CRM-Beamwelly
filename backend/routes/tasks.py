from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import User, Task, Employee, TaskStatus
from schemas.tasks import TaskCreate, Task as TaskSchema
from crud import (
    create_task,
    get_tasks,
    get_task,
    get_user_tasks,
    get_created_tasks,
    update_task,
    delete_task
)
from routes.auth import get_current_user, require_role

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

async def allow_any():
    """Allows any request, bypassing authentication requirements."""
    return True

@router.post("/", response_model=TaskSchema)
async def create_new_task(
    request: Request,
    title: str = Form(...),
    description: str = Form(None),
    assigned_to: int = Form(...),
    due_date: str = Form(...),
    priority: str = Form(...),
    task_status: str = Form(...),
    tags: str = Form(None),
    comments: str = Form(None),
    document: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task with optional document upload"""
    try:
        # Validate that assigned_to employee exists
        assignee = db.query(Employee).filter(Employee.id == assigned_to).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned employee not found"
            )
        # Check if the assignee belongs to the same company
        if current_user.role != "admin" and assignee.company_name != current_user.company_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign task to employee from different company"
            )
        # Handle file upload
        document_url = None
        if document:
            import os
            from uuid import uuid4
            upload_dir = "uploaded_task_docs"
            os.makedirs(upload_dir, exist_ok=True)
            ext = os.path.splitext(document.filename)[1]
            file_id = str(uuid4())
            file_path = os.path.join(upload_dir, f"{file_id}{ext}")
            with open(file_path, "wb") as f:
                f.write(await document.read())
            # Use relative URL for Render compatibility
            document_url = f"/uploaded_task_docs/{file_id}{ext}"
        # Parse tags if provided
        tags_list = None
        if tags:
            import json
            try:
                tags_list = json.loads(tags)
            except Exception:
                tags_list = [t.strip() for t in tags.split(",") if t.strip()]
        # Create the task
        now = datetime.utcnow()
        db_task = Task(
            title=title,
            description=description,
            assigned_to=assigned_to,
            assigned_by=current_user.id,
            due_date=due_date,
            priority=priority,
            status=task_status.lower(),
            tags=tags_list,
            comments=comments,
            created_at=now,
            updated_at=now,
            company_name=current_user.company_name,
            document_url=document_url
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating task: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating task: {str(e)}"
        )

@router.get("/", response_model=List[TaskSchema])
def list_tasks(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all tasks for the user's company"""
    if current_user.role == "admin":
        # Admin sees all tasks in their company
        tasks = db.query(Task).filter(Task.company_name == current_user.company_name).offset(skip).limit(limit).all()
    else:
        # Regular users see tasks assigned to them or created by them in their company
        tasks = db.query(Task).filter(
            (Task.company_name == current_user.company_name) &
            ((Task.assigned_to == current_user.id) | (Task.assigned_by == current_user.id))
        ).offset(skip).limit(limit).all()
    return tasks

@router.get("/assigned", response_model=List[TaskSchema])
def list_assigned_tasks(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List tasks assigned to the current user in their company"""
    tasks = db.query(Task).filter(
        Task.assigned_to == current_user.id,
        Task.company_name == current_user.company_name
    ).offset(skip).limit(limit).all()
    return tasks

@router.get("/created", response_model=List[TaskSchema])
def list_created_tasks(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List tasks created by the current user in their company"""
    tasks = db.query(Task).filter(
        Task.assigned_by == current_user.id,
        Task.company_name == current_user.company_name
    ).offset(skip).limit(limit).all()
    return tasks

@router.get("/productivity-metrics", include_in_schema=True)
async def get_user_productivity_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return KPI metrics for tasks assigned to the current user"""
    try:
        now = datetime.utcnow()

        # Filter tasks by assigned_to the current user
        user_tasks_query = db.query(Task).filter(Task.assigned_to == current_user.id)
        
        # Add logging to see the user ID and query counts
        print(f"Fetching productivity metrics for user ID: {current_user.id}")

        total_tasks = user_tasks_query.count() or 0
        print(f"Total tasks for user {current_user.id}: {total_tasks}")

        # Use lowercase string values for status filtering
        completed = user_tasks_query.filter(Task.status == "completed").count() or 0
        print(f"Completed tasks for user {current_user.id}: {completed}")

        in_progress = user_tasks_query.filter(Task.status == "in_progress").count() or 0
        print(f"In Progress tasks for user {current_user.id}: {in_progress}")

        pending = user_tasks_query.filter(Task.status == "pending").count() or 0
        print(f"Pending tasks for user {current_user.id}: {pending}")

        # Overdue tasks assigned to the user and not completed
        overdue = user_tasks_query.filter(
            Task.due_date < now.date(),
            Task.status != "completed"
        ).count() or 0
        print(f"Overdue tasks for user {current_user.id}: {overdue}")

        completion_rate = (completed / total_tasks * 100) if total_tasks > 0 else 0

        result = {
            "completed": {"count": completed, "percentage": round(completed / total_tasks * 100, 2) if total_tasks > 0 else 0},
            "inProgress": {"count": in_progress, "percentage": round(in_progress / total_tasks * 100, 2) if total_tasks > 0 else 0},
            "pending": {"count": pending, "percentage": round(pending / total_tasks * 100, 2) if total_tasks > 0 else 0}, # Include pending in response
            "overdue": {"count": overdue, "percentage": round(overdue / total_tasks * 100, 2) if total_tasks > 0 else 0},
            "completionRate": round(completion_rate, 2)
        }

        print("User productivity metrics result:", result)
        return result
    except Exception as e:
        print(f"Error getting user productivity metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return sample data on error for consistency
        return {
            "completed": {"count": 0, "percentage": 0},
            "inProgress": {"count": 0, "percentage": 0},
            "pending": {"count": 0, "percentage": 0},
            "overdue": {"count": 0, "percentage": 0},
            "completionRate": 0
        }

@router.get("/productivity-chart", include_in_schema=True)
def get_productivity_chart(
    range: str = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return productivity data for chart analytics (completed, pending, overdue per day)"""
    try:
        now = datetime.utcnow()
        if range == "week":
            start_date = now - timedelta(days=7)
            date_format = "%Y-%m-%d"
            interval = 'day'
        elif range == "month":
            start_date = now - timedelta(days=30)
            date_format = "%Y-%m-%d"
            interval = 'day'
        elif range == "quarter":
            start_date = now - timedelta(days=90)
            date_format = "%Y-%m-%d"
            interval = 'week'
        else:
            raise HTTPException(status_code=400, detail="Invalid time range")

        # Get tasks for the user's company
        tasks_query = db.query(Task).filter(
            Task.created_at >= start_date,
            Task.company_name == current_user.company_name
        )
        
        # If not admin, only show tasks assigned to or created by the user
        if current_user.role != "admin":
            tasks_query = tasks_query.filter(
                (Task.assigned_to == current_user.id) | (Task.assigned_by == current_user.id)
            )
        
        tasks = tasks_query.all()
        
        # Group by day/week
        buckets = {}
        for task in tasks:
            if interval == 'day':
                bucket = task.due_date.strftime(date_format) if task.due_date else task.created_at.strftime(date_format)
            else:  # week
                bucket = task.due_date.strftime("%Y-W%U") if task.due_date else task.created_at.strftime("%Y-W%U")
            if bucket not in buckets:
                buckets[bucket] = {"completed": 0, "pending": 0, "overdue": 0}
            if task.status == "completed":
                buckets[bucket]["completed"] += 1
            elif task.status == "pending":
                buckets[bucket]["pending"] += 1
            # Overdue: due date < now and not completed
            if task.due_date and task.due_date < now.date() and task.status != "completed":
                buckets[bucket]["overdue"] += 1
        
        # Format for chart
        chart_data = [
            {"name": k, **v} for k, v in sorted(buckets.items())
        ]
        if not chart_data:
            # Provide sample data if there's no data
            if range == "week":
                days = [(now - timedelta(days=i)).strftime(date_format) for i in range(7, 0, -1)]
                chart_data = [{"name": day, "completed": 0, "pending": 0, "overdue": 0} for day in days]
            elif range == "month":
                days = [(now - timedelta(days=i)).strftime(date_format) for i in range(30, 0, -1)]
                chart_data = [{"name": day, "completed": 0, "pending": 0, "overdue": 0} for day in days]
        
        print(f"Productivity chart data for {range}:", chart_data)
        return chart_data
    except Exception as e:
        print(f"Error getting productivity chart: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching productivity chart data: {str(e)}"
        )

@router.get("/{task_id}", response_model=TaskSchema)
def get_task_by_id(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific task by ID"""
    task = get_task(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user has access to this task
    if current_user.role != "admin" and task.company_name != current_user.company_name:
        raise HTTPException(status_code=403, detail="Not authorized to access this task")
    
    if current_user.role != "admin" and task.assigned_to != current_user.id and task.assigned_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this task")
    
    return task

@router.put("/{task_id}", response_model=TaskSchema)
def update_task_by_id(
    task_id: int,
    task_update: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a task"""
    task = get_task(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user has permission to update this task
    if current_user.role != "admin" and task.company_name != current_user.company_name:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    # Allow both task creator and assigned user to update the task
    if current_user.role != "admin" and task.assigned_by != current_user.id and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    updated_task = update_task(db, task_id=task_id, task_update=task_update)
    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return updated_task

@router.delete("/{task_id}")
def delete_task_by_id(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task"""
    task = get_task(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user has permission to delete this task
    if current_user.role != "admin" and task.company_name != current_user.company_name:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    # Allow both task creator and assigned user to delete the task
    if current_user.role != "admin" and task.assigned_by != current_user.id and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    if delete_task(db, task_id=task_id):
        return {"message": "Task deleted successfully"}
    raise HTTPException(status_code=404, detail="Task not found")
