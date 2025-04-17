from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import uvicorn
import logging
import signal
import sys

import models
import database
import schemas
from execution_engine import ExecutionEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Serverless Function Platform")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

execution_engine = ExecutionEngine()

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/functions/")
def create_function(function: schemas.FunctionCreate, db: Session = Depends(get_db)):
    db_function = models.Function(**function.dict())
    db.add(db_function)
    db.commit()
    db.refresh(db_function)
    return db_function

@app.get("/functions/", response_model=List[schemas.Function])
def list_functions(db: Session = Depends(get_db)):
    return db.query(models.Function).all()

@app.get("/functions/{function_id}", response_model=schemas.Function)
def get_function(function_id: int, db: Session = Depends(get_db)):
    function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if function is None:
        raise HTTPException(status_code=404, detail="Function not found")
    return function

@app.put("/functions/{function_id}")
def update_function(function_id: int, function: schemas.FunctionUpdate, db: Session = Depends(get_db)):
    db_function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if db_function is None:
        raise HTTPException(status_code=404, detail="Function not found")
    
    for key, value in function.dict(exclude_unset=True).items():
        setattr(db_function, key, value)
    
    db.commit()
    db.refresh(db_function)
    return db_function

@app.delete("/functions/{function_id}")
def delete_function(function_id: int, db: Session = Depends(get_db)):
    function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if function is None:
        raise HTTPException(status_code=404, detail="Function not found")
    
    execution_engine.cleanup(str(function_id))
    db.delete(function)
    db.commit()
    return {"message": "Function deleted successfully"}

@app.post("/functions/{function_id}/execute")
def execute_function(function_id: int, input_data: dict, db: Session = Depends(get_db)):
    logger.info(f"Received request to execute function {function_id}")
    function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if function is None:
        logger.warning(f"Function {function_id} not found")
        raise HTTPException(status_code=404, detail="Function not found")
    
    try:
        logger.info(f"Starting execution of function {function_id} with input: {input_data}")
        result = execution_engine.execute_function(str(function_id), function.code, input_data)
        
        # Store metrics
        logger.info(f"Storing metrics for function {function_id}")
        metrics = models.FunctionMetrics(
            function_id=function_id,
            execution_time=result["metrics"]["execution_time"],
            memory_usage=result["metrics"]["memory_usage"],
            cpu_usage=result["metrics"]["cpu_usage"],
            status=result["metrics"]["status"],
            error_message=result["metrics"].get("error_message")
        )
        db.add(metrics)
        db.commit()
        logger.info(f"Function {function_id} executed successfully")
        
        return result
    except Exception as e:
        logger.error(f"Error executing function {function_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/functions/{function_id}/metrics")
def get_function_metrics(function_id: int, db: Session = Depends(get_db)):
    metrics = db.query(models.FunctionMetrics).filter(
        models.FunctionMetrics.function_id == function_id
    ).order_by(models.FunctionMetrics.timestamp.desc()).all()
    return metrics

# Setup shutdown handler for container cleanup
def cleanup_on_shutdown(signum, frame):
    logger.info("Received shutdown signal, cleaning up all containers...")
    for function_id in list(execution_engine.container_pool.keys()):
        try:
            logger.info(f"Cleaning up container for function {function_id}")
            execution_engine.cleanup(function_id)
        except Exception as e:
            logger.error(f"Error cleaning up container for function {function_id}: {str(e)}")
    logger.info("All containers cleaned up, shutting down")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, cleanup_on_shutdown)
signal.signal(signal.SIGTERM, cleanup_on_shutdown)

if __name__ == "__main__":
    logger.info("Starting Serverless Function Platform API")
    logger.info("Press Ctrl+C to shutdown and cleanup all containers")
    uvicorn.run(app, host="0.0.0.0", port=8000) 