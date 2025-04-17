from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Function(Base):
    __tablename__ = "functions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    route = Column(String(255), unique=True)
    language = Column(String(50))
    code = Column(Text)
    timeout = Column(Integer)  # in seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    environment_variables = Column(JSON, default={})
    metrics = relationship("FunctionMetrics", back_populates="function")

class FunctionMetrics(Base):
    __tablename__ = "function_metrics"

    id = Column(Integer, primary_key=True, index=True)
    function_id = Column(Integer, ForeignKey("functions.id"))
    execution_time = Column(Float)  # in seconds
    memory_usage = Column(Float)    # in MB
    cpu_usage = Column(Float)       # in percentage
    status = Column(String(50))     # success/failure
    error_message = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    function = relationship("Function", back_populates="metrics") 