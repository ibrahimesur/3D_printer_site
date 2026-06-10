import sys
from app.models.user import UserRole
print([e.name for e in UserRole])
from sqlalchemy import Enum
e = Enum(UserRole)
print(e.enums)
