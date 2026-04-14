"""
Routes package initialization
"""

# This file makes the routes directory a Python package 

from . import auth
from . import employee
from . import recruitment
from . import budget
from . import social
from . import documents
from . import feedback
from . import leave
from . import leads
from . import tasks
from . import lead_client
from . import productivity
from . import analytics
from . import salary
from . import dashboard

__all__ = [
    'auth',
    'employee',
    'recruitment',
    'budget',
    'social',
    'documents',
    'feedback',
    'leave',
    'leads',
    'tasks',
    'lead_client',
    'productivity',
    'analytics',
    'salary',
    'dashboard'
] 