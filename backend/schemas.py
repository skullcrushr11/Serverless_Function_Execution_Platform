from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class FunctionBase(BaseModel):
    name: str
    route: str
    language: str
    code: str
    timeout: int
    environment_variables: Optional[Dict[str, str]] = {}

class FunctionCreate(FunctionBase):
    pass

class FunctionUpdate(BaseModel):
    name: Optional[str] = None
    route: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None
    timeout: Optional[int] = None
    environment_variables: Optional[Dict[str, str]] = None

class Function(FunctionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FunctionMetrics(BaseModel):
    id: int
    function_id: int
    execution_time: float
    memory_usage: float
    cpu_usage: float
    status: str
    error_message: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ExecutionResult(BaseModel):
    result: str
    metrics: Dict[str, Any] 