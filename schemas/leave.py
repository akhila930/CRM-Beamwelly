class LeaveRequestResponse(LeaveRequestBase):
    id: int
    employee_name: Optional[str] = None
    approver_name: Optional[str] = None
    duration: Optional[int] = None
    employee_id: int
    company_name: Optional[str] = None

    class Config:
        orm_mode = True 