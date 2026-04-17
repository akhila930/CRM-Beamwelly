from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from database import get_db
from models import Employee, Task, Document, Attendance, Milestone
from schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, 
    TaskCreate, TaskUpdate, DocumentCreate,
    AttendanceCreate, MilestoneCreate, MilestoneUpdate
)
from datetime import datetime, date
from decimal import Decimal
import traceback
from utils.auth import get_current_user
from models import User
import os
from models import MilestoneStatus
from fastapi.responses import FileResponse
from pathlib import Path
from models import DocumentType
from auth_helpers import get_password_hash, generate_password, send_employee_credentials_email

router = APIRouter(prefix="/api/employees", tags=["employees"])

@router.get("", response_model=List[EmployeeResponse])
@router.get("/", response_model=List[EmployeeResponse])
async def get_employees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print("Fetching employees...")
        # Only admin or employees with can_assign_tasks can view all employees, others see only themselves
        if current_user.role == "admin":
            # Admin sees all employees in their company
            employees = db.query(Employee).filter(Employee.company_name == current_user.company_name).all()
        else:
            # Check if the current user is an employee with can_assign_tasks
            current_employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
            if current_employee and current_employee.can_assign_tasks:
                employees = db.query(Employee).filter(Employee.company_name == current_employee.company_name).all()
            else:
                # Regular employees only see their own record
                employees = db.query(Employee).filter(Employee.user_id == current_user.id).all()
        print(f"Found {len(employees)} employees")
        
        # Convert to response format
        response_data = []
        for emp in employees:
            # Load related data
            tasks_data = [{
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "tags": task.tags if isinstance(task.tags, list) else [],
                "comments": task.comments or "",
                "document_url": task.document_url
            } for task in emp.tasks]

            documents_data = [{
                "id": doc.id,
                "title": doc.title,
                "description": doc.description,
                "file_path": doc.file_path,
                "file_type": doc.file_type,
                "created_at": doc.created_at.isoformat() if doc.created_at else None
            } for doc in emp.documents]

            attendance_data = [{
                "id": att.id,
                "date": att.date.isoformat() if att.date else None,
                "status": att.status,
                "created_at": att.created_at.isoformat() if att.created_at else None
            } for att in emp.attendance]

            milestones_data = [{
                "id": ms.id,
                "title": ms.title,
                "description": ms.description,
                "date": ms.date.isoformat() if ms.date else None,
                "type": ms.type,
                "created_at": ms.created_at.isoformat() if ms.created_at else None
            } for ms in emp.milestones]

            response_data.append({
                "id": emp.id,
                "name": emp.name,
                "email": emp.email,
                "phone": emp.phone,
                "position": emp.position,
                "department": emp.department,
                "salary": float(emp.salary) if emp.salary else 0,
                "hire_date": emp.hire_date.isoformat() if emp.hire_date else None,
                "status": emp.status,
                "created_at": emp.created_at.isoformat() if emp.created_at else None,
                "updated_at": emp.updated_at.isoformat() if emp.updated_at else None,
                "tasks": tasks_data,
                "documents": documents_data,
                "attendance": attendance_data,
                "milestones": milestones_data,
                "can_assign_tasks": True if current_user.role == "admin" else emp.can_assign_tasks,
                "can_access_recruitment": emp.can_access_recruitment
            })
        return response_data
    except Exception as e:
        print(f"Error fetching employees: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching employees: {str(e)}"
        )

# Helper function for getting employee data
async def get_employee(employee_id: int, current_user: User, db: Session, request: Request = None):
    try:
        # Check if user has permission to view this employee
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
            
        # Admin can view any employee in their company, employees can only view themselves
        if current_user.role != "admin" and employee.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this employee profile"
            )
            
        print(f"[EMPLOYEE GET] Returning employee: {employee.id}, name={employee.name}, email={employee.email}")
        # Load related data
        base_url = str(request.base_url).rstrip('/') if request else ''
        tasks_data = [{
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "tags": task.tags if isinstance(task.tags, list) else [],
            "comments": task.comments or "",
            "document_url": task.document_url
        } for task in employee.tasks]
        
        documents_data = [{
            "id": doc.id,
            "title": doc.title,
            "description": doc.description,
            "file_path": doc.file_path,
            "file_type": doc.file_type,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        } for doc in employee.documents]
        
        attendance_data = [{
            "id": att.id,
            "date": att.date.isoformat() if att.date else None,
            "status": att.status,
            "created_at": att.created_at.isoformat() if att.created_at else None
        } for att in employee.attendance]
        
        milestones_data = [{
            "id": ms.id,
            "title": ms.title,
            "description": ms.description,
            "date": ms.date.isoformat() if ms.date else None,
            "type": ms.type,
            "created_at": ms.created_at.isoformat() if ms.created_at else None
        } for ms in employee.milestones]
        
        # Create response with related data
        response_data = {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "phone": employee.phone,
            "position": employee.position,
            "department": employee.department,
            "salary": str(employee.salary) if employee.salary else None,
            "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
            "status": employee.status,
            "address": employee.address,
            "created_at": employee.created_at.isoformat() if employee.created_at else None,
            "updated_at": employee.updated_at.isoformat() if employee.updated_at else None,
            "company_name": employee.company_name,
            "can_assign_tasks": True if current_user.role == "admin" else employee.can_assign_tasks,
            "can_access_recruitment": employee.can_access_recruitment,
            "tasks": tasks_data,
            "documents": documents_data,
            "attendance": attendance_data,
            "milestones": milestones_data
        }
        
        return response_data
    
    except Exception as e:
        print(f"Error fetching employee: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching employee: {str(e)}"
        )

# Route wrapper for getting employee
@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee_route(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await get_employee(employee_id, current_user, db)

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Find employee record
        db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not db_employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
            
        # Admins can edit any employee in their company, employees can only edit their own profile
        if current_user.role != "admin" and db_employee.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to edit this employee profile"
            )

        # Convert the update data to match the database model
        update_data = employee_update.model_dump(exclude_unset=True)

        # Convert hire_date string to datetime if it exists
        if 'hire_date' in update_data and update_data['hire_date']:
            try:
                if isinstance(update_data['hire_date'], str):
                    date_str = update_data['hire_date']
                    if 'T' in date_str:
                        date_str = date_str.split('T')[0]
                    update_data['hire_date'] = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format for hire_date"
                )

        # Handle salary field
        if 'salary' in update_data and update_data['salary'] is not None:
            try:
                update_data['salary'] = Decimal(str(update_data['salary']))
            except (ValueError, TypeError):
                update_data['salary'] = None

        # Handle boolean fields explicitly
        if 'can_assign_tasks' in update_data:
            db_employee.can_assign_tasks = bool(update_data['can_assign_tasks'])
        if 'can_access_recruitment' in update_data:
            db_employee.can_access_recruitment = bool(update_data['can_access_recruitment'])

        # Update other fields that are provided
        for key, value in update_data.items():
            if key not in ['can_assign_tasks', 'can_access_recruitment'] and value is not None:
                setattr(db_employee, key, value)

        # Commit the changes to the database
        db.commit()
        db.refresh(db_employee)

        # Load related data
        tasks_data = [{
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "priority": task.priority,
            "status": task.status,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "tags": task.tags,
            "comments": task.comments,
            "document_url": task.document_url
        } for task in db_employee.tasks]

        documents_data = [{
            "id": doc.id,
            "title": doc.title,
            "description": doc.description,
            "file_path": doc.file_path,
            "file_type": doc.file_type,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        } for doc in db_employee.documents]

        attendance_data = [{
            "id": att.id,
            "date": att.date.isoformat() if att.date else None,
            "status": att.status,
            "created_at": att.created_at.isoformat() if att.created_at else None
        } for att in db_employee.attendance]

        milestones_data = [{
            "id": ms.id,
            "title": ms.title,
            "description": ms.description,
            "date": ms.date.isoformat() if ms.date else None,
            "type": ms.type,
            "created_at": ms.created_at.isoformat() if ms.created_at else None
        } for ms in db_employee.milestones]

        # Convert to response format with all related data
        response_data = {
            "id": db_employee.id,
            "name": db_employee.name,
            "email": db_employee.email,
            "phone": db_employee.phone,
            "position": db_employee.position,
            "department": db_employee.department,
            "salary": float(db_employee.salary) if db_employee.salary else 0,
            "hire_date": db_employee.hire_date.isoformat() if db_employee.hire_date else None,
            "status": db_employee.status,
            "created_at": db_employee.created_at.isoformat() if db_employee.created_at else None,
            "updated_at": db_employee.updated_at.isoformat() if db_employee.updated_at else None,
            "can_assign_tasks": db_employee.can_assign_tasks,
            "can_access_recruitment": db_employee.can_access_recruitment,
            "tasks": tasks_data,
            "documents": documents_data,
            "attendance": attendance_data,
            "milestones": milestones_data
        }

        return response_data

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating employee: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating employee: {str(e)}"
        )

@router.post("", response_model=EmployeeResponse)
@router.post("/", response_model=EmployeeResponse)
def create_employee(
    employee: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None,
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create employees"
        )
    
    try:
        # Check if email already exists
        if db.query(User).filter(User.email == employee.email).first():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Convert hire_date string to date object if needed
        if isinstance(employee.hire_date, str):
            try:
                employee.hire_date = datetime.strptime(employee.hire_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid hire date format. Use YYYY-MM-DD"
                )
        
        # Handle salary fields
        if employee.salary is not None:
            if isinstance(employee.salary, str):
                if employee.salary.strip() == '':
                    employee.salary = None
                else:
                    try:
                        employee.salary = float(employee.salary)
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail="Invalid salary format"
                        )
        
        # Create linked User account first (Employee.user_id is NOT NULL)
        temp_password = generate_password()
        db_user = User(
            name=employee.name,
            email=str(employee.email),
            hashed_password=get_password_hash(temp_password),
            role="employee",
            is_active=True,
            # Admin-created employees should be able to login immediately.
            is_verified=True,
            company_name=current_user.company_name,
        )
        db.add(db_user)
        db.flush()  # assign db_user.id without committing yet

        # Set default values for optional fields and link to created user
        employee_data = employee.model_dump()
        employee_data["company_name"] = current_user.company_name
        employee_data["user_id"] = db_user.id

        # Create new employee
        db_employee = Employee(**employee_data)
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)

        # Send credentials email if background_tasks is available/configured
        if background_tasks is not None:
            try:
                send_employee_credentials_email(
                    email=db_user.email,
                    name=db_user.name,
                    password=temp_password,
                    background_tasks=background_tasks,
                )
            except Exception:
                # Don't fail employee creation if email fails
                pass
        
        return db_employee
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can delete employees
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete employee records"
        )
    try:
        db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not db_employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        db.delete(db_employee)
        db.commit()
        return {"message": "Employee deleted successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting employee: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting employee: {str(e)}"
        )

# Task management routes
@router.post("/{employee_id}/tasks", response_model=EmployeeResponse)
async def add_task(
    employee_id: int,
    document: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    try:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )

        # Support JSON payloads from the React SPA (so we don't require Form fields)
        title: Optional[str] = None
        description: Optional[str] = None
        due_date: Optional[str] = None
        priority: Optional[str] = None
        status: Optional[str] = None
        tags: Optional[Any] = None
        comments: Optional[str] = None

        if request is not None:
            content_type = (request.headers.get("content-type") or "").lower()
        else:
            content_type = ""

        if "application/json" in content_type:
            body = await request.json()
            title = body.get("title")
            description = body.get("description")
            due_date = body.get("due_date")
            priority = body.get("priority")
            status = body.get("status", body.get("task_status"))
            comments = body.get("comments")
            tags = body.get("tags")
        else:
            # multipart/form-data path
            form = await request.form()
            title = form.get("title")
            description = form.get("description")
            due_date = form.get("due_date")
            priority = form.get("priority")
            status = form.get("status") or form.get("task_status")
            tags = form.get("tags")
            comments = form.get("comments")

        # Validate required values
        if not title or not due_date or not priority or not status:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Missing required fields (title, due_date, priority, status). Send JSON or multipart/form-data.",
            )

        # Normalize due_date to YYYY-MM-DD date string/Date-compatible value
        if isinstance(due_date, str):
            try:
                due_date = datetime.strptime(due_date, "%Y-%m-%d").date()
            except ValueError:
                # keep as-is; downstream ORM may handle it
                pass

        # Handle file upload
        document_url = None
        if document:
            import os
            from uuid import uuid4
            upload_base = Path(os.getenv("UPLOAD_DIR", "uploads"))
            upload_dir = upload_base / "task_docs"
            upload_dir.mkdir(parents=True, exist_ok=True)
            ext = os.path.splitext(document.filename)[1]
            file_id = str(uuid4())
            file_path = upload_dir / f"{file_id}{ext}"
            with open(file_path, "wb") as f:
                f.write(await document.read())
            # Use relative URL for Render compatibility
            document_url = f"/uploads/task_docs/{file_id}{ext}"
        # Parse tags if provided
        tags_list = None
        if tags is not None and tags != "":
            if isinstance(tags, list):
                tags_list = [str(t).strip() for t in tags if str(t).strip()]
            else:
                # Form values come in as string
                import json
                try:
                    parsed = json.loads(tags)  # tags might be JSON stringified list
                    tags_list = parsed if isinstance(parsed, list) else [str(parsed)]
                except Exception:
                    tags_list = [t.strip() for t in str(tags).split(",") if t.strip()]
        # Create new task with assigned_by set to current user
        from datetime import datetime
        now = datetime.utcnow()
        new_task = Task(
            title=title,
            description=description,
            assigned_to=employee_id,
            assigned_by=current_user.id,
            due_date=due_date,
            priority=priority,
            status=status.lower(),
            tags=tags_list,
            comments=comments,
            created_at=now,
            updated_at=now,
            company_name=employee.company_name,
            document_url=document_url
        )
        employee.tasks.append(new_task)
        db.add(new_task)
        db.commit()
        db.refresh(employee)
        # Always refresh the employee with the request for correct document_url
        return await get_employee(employee_id, current_user, db, request)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding task: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding task: {str(e)}"
        )

@router.put("/{employee_id}/tasks/{task_id}", response_model=EmployeeResponse)
async def update_task(
    employee_id: int,
    task_id: int,
    document: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    try:
        print(f"[UPDATE TASK] employee_id={employee_id}, task_id={task_id}")
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            print("[UPDATE TASK] Employee not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        task = db.query(Task).filter(Task.id == task_id, Task.assigned_to == employee_id).first()
        if not task:
            print("[UPDATE TASK] Task not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Support JSON payloads from the React SPA (JSON -> same fields as multipart/form-data)
        title: Optional[str] = None
        description: Optional[str] = None
        due_date: Optional[str] = None
        priority: Optional[str] = None
        status: Optional[str] = None
        tags: Optional[Any] = None
        comments: Optional[str] = None

        if request is not None:
            content_type = (request.headers.get("content-type") or "").lower()
        else:
            content_type = ""

        if "application/json" in content_type:
            body = await request.json()
            title = body.get("title")
            description = body.get("description")
            due_date = body.get("due_date")
            priority = body.get("priority")
            status = body.get("status", body.get("task_status"))
            comments = body.get("comments")
            tags = body.get("tags")
        else:
            form = await request.form()
            title = form.get("title")
            description = form.get("description")
            due_date = form.get("due_date")
            priority = form.get("priority")
            status = form.get("status") or form.get("task_status")
            tags = form.get("tags")
            comments = form.get("comments")

        # Normalize due_date if provided as YYYY-MM-DD
        if isinstance(due_date, str) and due_date:
            try:
                due_date = datetime.strptime(due_date, "%Y-%m-%d").date()
            except ValueError:
                pass

        # Handle file upload
        if document:
            import os
            from uuid import uuid4
            upload_base = Path(os.getenv("UPLOAD_DIR", "uploads"))
            upload_dir = upload_base / "task_docs"
            upload_dir.mkdir(parents=True, exist_ok=True)
            ext = os.path.splitext(document.filename)[1]
            file_id = str(uuid4())
            file_path = upload_dir / f"{file_id}{ext}"
            with open(file_path, "wb") as f:
                f.write(await document.read())
            print(f"[UPDATE TASK] Uploaded new document: {file_path}")
            # Optionally, delete the old file if it exists
            if task.document_url:
                old_path = task.document_url.lstrip("/")
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                        print(f"[UPDATE TASK] Deleted old document: {old_path}")
                    except Exception as e:
                        print(f"[UPDATE TASK] Failed to delete old document: {e}")
            # Use relative URL for Render compatibility
            task.document_url = f"/uploads/task_docs/{file_id}{ext}"
        # Parse tags if provided
        tags_list = None
        if tags is not None and tags != "":
            if isinstance(tags, list):
                tags_list = [str(t).strip() for t in tags if str(t).strip()]
            else:
                import json
                try:
                    parsed = json.loads(tags)
                    tags_list = parsed if isinstance(parsed, list) else [str(parsed)]
                except Exception:
                    tags_list = [t.strip() for t in str(tags).split(",") if t.strip()]
        # Update only provided fields
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if due_date is not None:
            task.due_date = due_date
        if priority is not None:
            task.priority = priority
        if status is not None:
            task.status = status.lower()
        if tags is not None:
            task.tags = tags_list
        if comments is not None:
            task.comments = comments
        from datetime import datetime
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(employee)
        print(f"[UPDATE TASK] Updated task {task_id} for employee {employee_id}, document_url={task.document_url}")
        return await get_employee(employee_id, current_user, db, request)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating task: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating task: {str(e)}"
        )

@router.delete("/{employee_id}/tasks/{task_id}", response_model=EmployeeResponse)
async def delete_task(
    employee_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        task = db.query(Task).filter(Task.id == task_id, Task.assigned_to == employee_id).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        db.delete(task)
        db.commit()
        db.refresh(employee)
        
        return await get_employee(employee_id, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting task: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting task: {str(e)}"
        )

# Document management routes
@router.post("/{employee_id}/documents", response_model=EmployeeResponse)
async def add_document(
    employee_id: int,
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    file_type: str = Form("other"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"[add_document] employee_id={employee_id}, title={title}, description={description}, file={file.filename}, file_type={file_type}")
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Determine file extension from the uploaded file
        original_filename = file.filename.lower()
        file_extension = original_filename.split('.')[-1] if '.' in original_filename else 'bin'
        
        # Generate a unique filename with timestamp to prevent collisions
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Use only alphanumeric characters in the filename to avoid issues
        safe_title = ''.join(c for c in title if c.isalnum() or c in ' _-').replace(' ', '_')
        filename = f"{safe_title}_{timestamp}.{file_extension}"
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/documents"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)
        
        # Log the file details for debugging
        print(f"Original filename: {original_filename}")
        print(f"Safe title: {safe_title}")
        print(f"File extension: {file_extension}")
        print(f"Saving to: {file_path}")
        
        # Map common MIME types to extensions
        mime_type_map = {
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'text/plain': 'txt',
            'image/jpeg': 'jpg',
            'image/png': 'png'
        }
        
        # Check for content type and ensure extension matches
        content_type = file.content_type
        print(f"File content type: {content_type}")
        
        if content_type in mime_type_map and file_extension != mime_type_map[content_type]:
            print(f"Extension mismatch - content type suggests {mime_type_map[content_type]} but filename has {file_extension}")
            # Update extension to match content type
            file_extension = mime_type_map[content_type]
            filename = f"{safe_title}_{timestamp}.{file_extension}"
            file_path = os.path.join(upload_dir, filename)
            print(f"Updated filename to: {filename}")
        
        # Map file extension to DocumentType
        document_type_map = {
            'pdf': DocumentType.OTHER,
            'doc': DocumentType.OTHER,
            'docx': DocumentType.OTHER,
            'txt': DocumentType.OTHER,
            'jpg': DocumentType.OTHER,
            'jpeg': DocumentType.OTHER,
            'png': DocumentType.OTHER
        }
        
        # Process user-specified file_type
        user_document_type = file_type.lower()
        valid_document_types = {t.value: t for t in DocumentType}
        
        if user_document_type in valid_document_types:
            document_type = valid_document_types[user_document_type]
        else:
            # Default to file extension based type if user type is invalid
            document_type = document_type_map.get(file_extension.lower(), DocumentType.OTHER)
        
        # Save the file
        print(f"Saving file to {file_path}")
        try:
            # Read the file content
            content = await file.read()
            
            # Write the file
            with open(file_path, 'wb') as f:
                f.write(content)
                
            # Verify file was saved
            saved_file_path = Path(file_path)
            if saved_file_path.exists():
                file_size = saved_file_path.stat().st_size
                print(f"File saved successfully. Size: {file_size} bytes")
            else:
                print(f"Warning: File was not saved at {file_path}")
                
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
        
        # Create new document
        new_document = Document(
            title=title,
            description=description,
            file_path=file_path,
            file_type=document_type,
            employee_id=employee_id
        )
        
        employee.documents.append(new_document)
        db.add(new_document)
        db.commit()
        db.refresh(employee)
        
        print(f"Document added successfully with ID {new_document.id}")
        return await get_employee(employee_id, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding document: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding document: {str(e)}"
        )

@router.delete("/{employee_id}/documents/{document_id}", response_model=EmployeeResponse)
async def delete_document(
    employee_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        document = db.query(Document).filter(Document.id == document_id, Document.employee_id == employee_id).first()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        db.delete(document)
        db.commit()
        db.refresh(employee)
        
        return await get_employee(employee_id, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting document: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )

@router.get("/{employee_id}/documents/{document_id}/download")
async def download_employee_document(
    employee_id: int,
    document_id: int,
    db: Session = Depends(get_db)
):
    try:
        print(f"[download_employee_document] Attempting to download document_id={document_id} for employee_id={employee_id}")
        
        document = db.query(Document).filter(Document.id == document_id, Document.employee_id == employee_id).first()
        if not document:
            print(f"Document not found: employee_id={employee_id}, document_id={document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        file_path = Path(document.file_path)
        print(f"Document file path: {file_path}")
        print(f"Document title: {document.title}")
        print(f"Document type: {document.file_type}")
        
        if not file_path.exists():
            print(f"File not found on disk: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on server"
            )
        
        # Map file extensions to MIME types
        mime_types = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png'
        }
        
        # Get file extension and determine content type
        file_extension = file_path.suffix.lstrip('.').lower()
        media_type = mime_types.get(file_extension, 'application/octet-stream')
        
        # Log the file details for debugging
        print(f"Downloading file: {file_path}")
        print(f"File extension: {file_extension}")
        print(f"Media type: {media_type}")
        print(f"File exists: {file_path.exists()}")
        print(f"File size: {file_path.stat().st_size if file_path.exists() else 'N/A'} bytes")
        
        # Make sure the filename is URL safe
        safe_filename = document.title.replace(' ', '_').replace(',', '')
        if not safe_filename.lower().endswith(f'.{file_extension}'):
            safe_filename = f"{safe_filename}.{file_extension}"
        
        # Get only the relative file path from uploads directory
        # If file_path is something like 'uploads/documents/file.pdf', get 'documents/file.pdf'
        relative_path = str(file_path)
        if 'uploads/' in relative_path:
            relative_path = relative_path.split('uploads/', 1)[1]
        
        # Return a redirect to the static file URL
        direct_url = f"/uploads/{relative_path}"
        print(f"Redirecting to direct URL: {direct_url}")
        
        # For PDF files, set proper headers
        headers = {
            'Content-Disposition': f'inline; filename="{safe_filename}"',
            'Access-Control-Allow-Origin': '*',
        }
        
        if file_extension == 'pdf':
            headers['Content-Type'] = 'application/pdf'
        
        # Use a direct file path for better browser compatibility
        return FileResponse(
            path=file_path,
            filename=safe_filename,
            media_type=media_type,
            headers=headers
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading document: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading document: {str(e)}"
        )

# Attendance management routes
@router.post("/{employee_id}/attendance", response_model=EmployeeResponse)
async def mark_attendance(
    employee_id: int,
    attendance: AttendanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Check if attendance for this date already exists
        existing_attendance = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date == attendance.date
        ).first()
        
        if existing_attendance:
            # Update existing attendance
            for field, value in attendance.model_dump().items():
                setattr(existing_attendance, field, value)
        else:
            # Create new attendance record
            new_attendance = Attendance(**attendance.model_dump())
            employee.attendance.append(new_attendance)
            db.add(new_attendance)
        
        db.commit()
        db.refresh(employee)
        
        return await get_employee(employee_id, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking attendance: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking attendance: {str(e)}"
        )

# Milestone management routes
@router.post("/{employee_id}/milestones", response_model=EmployeeResponse)
async def add_milestone(
    employee_id: int,
    milestone: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"[add_milestone] employee_id={employee_id}, milestone={milestone}")
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Create new milestone with proper date
        milestone_data = milestone.model_dump()
        if not milestone_data.get('date'):
            milestone_data['date'] = datetime.now().date()
        elif isinstance(milestone_data['date'], str):
            try:
                milestone_data['date'] = datetime.strptime(milestone_data['date'], '%Y-%m-%d').date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Expected YYYY-MM-DD"
                )
        if not milestone_data.get('description'):
            milestone_data['description'] = ''
        try:
            new_milestone = Milestone(
                employee_id=employee_id,
                title=milestone_data['title'],
                description=milestone_data['description'],
                date=milestone_data['date'],
                type=milestone_data.get('type', 'general')
            )
            employee.milestones.append(new_milestone)
            db.add(new_milestone)
            db.commit()
            db.refresh(employee)
            return await get_employee(employee_id, current_user, db)
        except Exception as e:
            db.rollback()
            raise
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding milestone: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding milestone: {str(e)}"
        )

@router.put("/{employee_id}/milestones/{milestone_id}", response_model=EmployeeResponse)
async def update_milestone(
    employee_id: int,
    milestone_id: int,
    milestone_update: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        milestone = db.query(Milestone).filter(Milestone.id == milestone_id, Milestone.employee_id == employee_id).first()
        if not milestone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Milestone not found"
            )
        
        # Update milestone fields with validation
        update_data = milestone_update.model_dump(exclude_unset=True)
        
        # Handle date update if provided
        if 'date' in update_data and (update_data['date'] is None or update_data['date'] == "" or update_data['date'] == "null"):
            update_data.pop('date')
        if 'date' in update_data and isinstance(update_data['date'], str):
            try:
                update_data['date'] = datetime.strptime(update_data['date'], '%Y-%m-%d').date()
            except ValueError:
                # Keep existing date if format is invalid
                update_data.pop('date')
        
        # Apply updates to the milestone
        for field, value in update_data.items():
            setattr(milestone, field, value)
        
        db.commit()
        db.refresh(employee)
        
        return await get_employee(employee_id, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating milestone: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating milestone: {str(e)}"
        )

@router.delete("/{employee_id}/milestones/{milestone_id}", response_model=EmployeeResponse)
async def delete_milestone(
    employee_id: int,
    milestone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        milestone = db.query(Milestone).filter(Milestone.id == milestone_id, Milestone.employee_id == employee_id).first()
        if not milestone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Milestone not found"
            )
        
        db.delete(milestone)
        db.commit()
        db.refresh(employee)
        
        return await get_employee(employee_id, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting milestone: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting milestone: {str(e)}"
        )

@router.get("/public/productivity-metrics")
async def get_productivity_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Find the current employee if not admin
        current_employee = db.query(Employee).filter(Employee.user_id == current_user.id).first() if current_user.role != "admin" else None
        # Admins and employees with can_assign_tasks see all company tasks
        if current_user.role == "admin" or (current_employee and current_employee.can_assign_tasks):
            company_name = current_user.company_name if current_user.role == "admin" else current_employee.company_name
            employees = db.query(Employee).filter(Employee.company_name == company_name).all()
            all_tasks = []
            for emp in employees:
                all_tasks.extend(emp.tasks)
        elif current_employee:
            all_tasks = current_employee.tasks
        else:
            all_tasks = []

        total = len(all_tasks)
        completed = [t for t in all_tasks if t.status == "completed"]
        in_progress = [t for t in all_tasks if t.status == "in_progress"]
        overdue = [t for t in all_tasks if t.status != "completed" and t.due_date and t.due_date < date.today()]

        def percent(count):
            return int((count / total) * 100) if total else 0

        return {
            "completed": {"count": len(completed), "percentage": percent(len(completed))},
            "inProgress": {"count": len(in_progress), "percentage": percent(len(in_progress))},
            "overdue": {"count": len(overdue), "percentage": percent(len(overdue))},
            "completionRate": percent(len(completed)),
        }
    except Exception as e:
        print(f"Error fetching productivity metrics: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching productivity metrics: {str(e)}"
        ) 