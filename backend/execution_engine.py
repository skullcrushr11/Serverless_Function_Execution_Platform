import docker
import time
import psutil
import json
import subprocess
import platform
import os
from typing import Dict, Any, Optional
from datetime import datetime

class ExecutionEngine:
    def __init__(self):
        self.docker_available = False
        self.docker_client = None
        self.container_pool = {}
        self.metrics = {}
        
        try:
            if platform.system() == 'Windows':
                # Use Windows named pipe
                base_url = 'npipe:////./pipe/docker_engine'
                self.docker_client = docker.DockerClient(base_url=base_url)
            else:
                self.docker_client = docker.from_env()
                
            # Test connection
            self.docker_client.ping()
            self.docker_available = True
            print("Docker is available and running")
        except Exception as e:
            print(f"Docker initialization error: {str(e)}")
            print("Falling back to simulation mode")
            self.docker_available = False

    def create_container(self, function_id: str, image: str) -> str:
        """Create a new container for a function."""
        if not self.docker_available:
            print("Warning: Creating simulated container because Docker is not available")
            return f"simulated_container_{function_id}"
            
        try:
            container = self.docker_client.containers.run(
                image,
                detach=True,
                name=f"function_{function_id}",
                mem_limit='512m',
                cpu_period=100000,
                cpu_quota=50000
            )
            return container.id
        except docker.errors.APIError as e:
            print(f"Docker API error while creating container: {str(e)}")
            return f"simulated_container_{function_id}"
        except Exception as e:
            print(f"Error creating container: {str(e)}")
            return f"simulated_container_{function_id}"

    def execute_function(self, function_id: str, code: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a function in a container."""
        start_time = time.time()
        
        try:
            if self.docker_available:
                try:
                    # Get or create container
                    container_id = self.container_pool.get(function_id)
                    if not container_id:
                        container_id = self.create_container(function_id, "python:3.9")
                        self.container_pool[function_id] = container_id

                    # Prepare execution environment
                    container = self.docker_client.containers.get(container_id)
                    
                    # Copy code to container
                    container.exec_run(f"echo '{code}' > /tmp/function.py")
                    
                    # Execute function
                    exec_result = container.exec_run(
                        f"python /tmp/function.py",
                        environment={"INPUT": json.dumps(input_data)}
                    )
                    
                    # Collect metrics
                    end_time = time.time()
                    execution_time = end_time - start_time
                    
                    # Get container stats
                    stats = container.stats(stream=False)
                    memory_usage = stats['memory_stats']['usage'] / (1024 * 1024)  # Convert to MB
                    cpu_usage = self._calculate_cpu_usage(stats)
                    
                    result = exec_result.output.decode()
                except docker.errors.APIError as e:
                    print(f"Docker API error during execution: {str(e)}")
                    self.docker_available = False
                    raise
            else:
                # Simulation mode
                end_time = time.time()
                execution_time = end_time - start_time
                memory_usage = 100.0  # Simulated memory usage
                cpu_usage = 25.0      # Simulated CPU usage
                
                # Simulate function execution
                try:
                    # Create a temporary namespace to execute the code
                    namespace = {}
                    exec(code, namespace)
                    if 'main' in namespace:
                        result = str(namespace['main'](input_data))
                    else:
                        result = "Function executed successfully (simulation mode)"
                except Exception as e:
                    result = f"Error in simulation: {str(e)}"
            
            # Store metrics
            self.metrics[function_id] = {
                "execution_time": execution_time,
                "memory_usage": memory_usage,
                "cpu_usage": cpu_usage,
                "status": "success",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return {
                "result": result,
                "metrics": self.metrics[function_id]
            }
            
        except Exception as e:
            # Store error metrics
            self.metrics[function_id] = {
                "execution_time": time.time() - start_time,
                "memory_usage": 0,
                "cpu_usage": 0,
                "status": "failure",
                "error_message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            raise

    def _calculate_cpu_usage(self, stats: Dict[str, Any]) -> float:
        """Calculate CPU usage percentage from container stats."""
        if not self.docker_available:
            return 25.0  # Simulated CPU usage
            
        try:
            cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
            system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
            cpu_usage = (cpu_delta / system_delta) * 100 if system_delta > 0 else 0
            return cpu_usage
        except Exception as e:
            print(f"Error calculating CPU usage: {str(e)}")
            return 0.0

    def cleanup(self, function_id: str):
        """Clean up resources for a function."""
        if not self.docker_available:
            return
            
        container_id = self.container_pool.get(function_id)
        if container_id:
            try:
                container = self.docker_client.containers.get(container_id)
                container.stop()
                container.remove()
                del self.container_pool[function_id]
            except Exception as e:
                print(f"Error cleaning up container: {str(e)}")