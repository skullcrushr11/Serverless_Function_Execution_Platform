import docker
import time
import psutil
import json
import subprocess
import platform
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import tempfile
import tarfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

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
            logger.info("Docker is available and running")
            
            # Ensure Python image is available
            try:
                self.docker_client.images.get('python:3.9')
                logger.info("Python 3.9 image is already available")
            except docker.errors.ImageNotFound:
                logger.info("Pulling Python 3.9 image...")
                self.docker_client.images.pull('python:3.9')
                logger.info("Python 3.9 image pulled successfully")
            
            # Ensure Node.js image is available
            try:
                self.docker_client.images.get('node:18')
                logger.info("Node.js 18 image is already available")
            except docker.errors.ImageNotFound:
                logger.info("Pulling Node.js 18 image...")
                self.docker_client.images.pull('node:18')
                logger.info("Node.js 18 image pulled successfully")
                
        except Exception as e:
            logger.error(f"Docker initialization error: {str(e)}")
            logger.error("Docker is required to run this application. Please ensure Docker is running properly.")
            raise RuntimeError(f"Docker is required but not available: {str(e)}")

    def create_container(self, function_id: str, image: str) -> str:
        """Create a new container for a function."""
        logger.info(f"Creating container for function {function_id}")
        
        # Remove any existing container with the same name
        try:
            old_container_name = f"function_{function_id}"
            try:
                old_container = self.docker_client.containers.get(old_container_name)
                logger.info(f"Found existing container {old_container.id} with name {old_container_name}")
                logger.info(f"Stopping existing container {old_container.id}")
                old_container.stop()
                logger.info(f"Removing existing container {old_container.id}")
                old_container.remove()
            except docker.errors.NotFound:
                logger.info(f"No existing container with name {old_container_name}")
                pass
        except Exception as e:
            logger.warning(f"Error handling existing container: {str(e)}")
        
        try:
            container = self.docker_client.containers.run(
                image,
                detach=True,
                name=f"function_{function_id}",
                mem_limit='512m',
                cpu_period=100000,
                cpu_quota=50000,
                tty=True,  # Keep container running
                command="tail -f /dev/null"  # Keep container alive
            )
            logger.info(f"Container created: {container.id} for function {function_id}")
            return container.id
        except docker.errors.APIError as e:
            logger.error(f"Docker API error while creating container: {str(e)}")
            raise RuntimeError(f"Failed to create Docker container: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating container: {str(e)}")
            raise RuntimeError(f"Failed to create Docker container: {str(e)}")

    def execute_function(self, function_id: str, code: str, input_data: Dict[str, Any], language: str = "python") -> Dict[str, Any]:
        """Execute a function in a container."""
        start_time = time.time()
        logger.info(f"Starting execution of function {function_id} using language: {language}")
        
        try:
            # Get or create container based on language
            container_id = self.container_pool.get(function_id)
            
            # If container exists but might be for a different language, remove it
            if container_id:
                try:
                    container = self.docker_client.containers.get(container_id)
                    if language == "python" and not container.image.tags[0].startswith("python:"):
                        logger.info(f"Container {container_id} is not a Python container. Cleaning up.")
                        self.cleanup(function_id)
                        container_id = None
                    elif language == "javascript" and not container.image.tags[0].startswith("node:"):
                        logger.info(f"Container {container_id} is not a Node.js container. Cleaning up.")
                        self.cleanup(function_id)
                        container_id = None
                except Exception as e:
                    logger.warning(f"Error checking container image: {str(e)}")
                    self.cleanup(function_id)
                    container_id = None
            
            # Create new container if needed
            if not container_id:
                logger.info(f"No existing container found for function {function_id}")
                image = "python:3.9" if language == "python" else "node:18"
                container_id = self.create_container(function_id, image)
                self.container_pool[function_id] = container_id
                logger.info(f"Added container {container_id} to pool for function {function_id}")
            else:
                logger.info(f"Reusing existing container {container_id} for function {function_id}")

            # Prepare execution environment
            container = self.docker_client.containers.get(container_id)
            logger.info(f"Retrieved container {container.id} for execution")
            
            if language == "python":
                # Create a proper Python script with the function code
                wrapper_script = f"""#!/usr/bin/env python3
import json
import sys
import os

# User function code
{code}

# Main execution
if __name__ == "__main__":
    try:
        # Get input data from environment variable or file
        input_str = os.environ.get("INPUT", "{{}}")
        input_data = json.loads(input_str)
        
        # Execute the function
        result = main(input_data)
        
        # Print the result as JSON on its own line
        print("\\n##RESULT_START##")
        print(json.dumps({{"result": result}}))
        print("##RESULT_END##")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("\\n##RESULT_START##")
        print(json.dumps({{"error": str(e)}}))
        print("##RESULT_END##")
"""
                # Create a temp file with the script
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                    f.write(wrapper_script)
                    temp_file = f.name
                
                # Copy code to container
                container.exec_run("mkdir -p /tmp")
                try:
                    # Create a tar archive with the file
                    with tempfile.NamedTemporaryFile(suffix='.tar') as tar_file:
                        with tarfile.open(fileobj=tar_file, mode='w') as tar:
                            tar.add(temp_file, arcname='function.py')
                        tar_file.flush()
                        tar_file.seek(0)
                        # Copy the archive to the container
                        container.put_archive('/tmp', tar_file.read())
                        
                    # Make the script executable
                    container.exec_run("chmod +x /tmp/function.py")
                finally:
                    # Clean up temp file
                    os.unlink(temp_file)
                
                # Execute with better debugging
                exec_result = container.exec_run(
                    "bash -c 'echo \"INPUT=$INPUT\" && python /tmp/function.py'",
                    environment={"INPUT": json.dumps(input_data)}
                )
            
            elif language == "javascript":
                # Create a Node.js script with the function code
                wrapper_script = f"""// User function code
{code}

// Main execution
(async () => {{
    try {{
        // Get input data from environment variable
        const inputStr = process.env.INPUT || '{{}}';
        const inputData = JSON.parse(inputStr);
        
        // Execute the function
        const result = await main(inputData);
        
        // Print the result as JSON
        console.log("\\n##RESULT_START##");
        console.log(JSON.stringify({{ result }}));
        console.log("##RESULT_END##");
    }} catch (error) {{
        console.error(error);
        console.log("\\n##RESULT_START##");
        console.log(JSON.stringify({{ error: error.message }}));
        console.log("##RESULT_END##");
    }}
}})();
"""
                # Create a temp file with the script
                with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                    f.write(wrapper_script)
                    temp_file = f.name
                
                # Copy code to container
                container.exec_run("mkdir -p /tmp")
                try:
                    # Create a tar archive with the file
                    with tempfile.NamedTemporaryFile(suffix='.tar') as tar_file:
                        with tarfile.open(fileobj=tar_file, mode='w') as tar:
                            tar.add(temp_file, arcname='function.js')
                        tar_file.flush()
                        tar_file.seek(0)
                        # Copy the archive to the container
                        container.put_archive('/tmp', tar_file.read())
                finally:
                    # Clean up temp file
                    os.unlink(temp_file)
                
                # Execute with Node.js
                exec_result = container.exec_run(
                    "bash -c 'echo \"INPUT=$INPUT\" && node /tmp/function.js'",
                    environment={"INPUT": json.dumps(input_data)}
                )
            else:
                raise ValueError(f"Unsupported language: {language}")
            
            logger.info(f"Function execution completed with exit code: {exec_result.exit_code}")
            
            # Collect metrics
            end_time = time.time()
            execution_time = end_time - start_time
            
            # Get container stats
            stats = container.stats(stream=False)
            memory_usage = stats['memory_stats']['usage'] / (1024 * 1024)  # Convert to MB
            cpu_usage = self._calculate_cpu_usage(stats)
            logger.info(f"Collected metrics: Memory: {memory_usage:.2f}MB, CPU: {cpu_usage:.2f}%, Time: {execution_time:.4f}s")
            
            # Parse the result
            result = exec_result.output.decode()
            logger.info(f"Raw function output: {result}")
            
            # Extract JSON result using markers
            result_str = ""
            in_result = False
            for line in result.splitlines():
                if "##RESULT_START##" in line:
                    in_result = True
                    continue
                elif "##RESULT_END##" in line:
                    in_result = False
                    continue
                elif in_result:
                    result_str = line.strip()
            
            # Parse the extracted JSON
            if result_str:
                try:
                    json_result = json.loads(result_str)
                    logger.info(f"Parsed JSON result: {json_result}")
                    if "error" in json_result:
                        logger.error(f"Function returned error: {json_result['error']}")
                        raise Exception(json_result["error"])
                    result = json_result["result"]
                except json.JSONDecodeError:
                    logger.warning(f"Could not parse function result as JSON: {result_str}")
                    # Keep the raw output as result
                    result = result_str
            else:
                logger.warning(f"Could not find the result section in output, returning raw output")
            
            # Store metrics
            self.metrics[function_id] = {
                "execution_time": execution_time,
                "memory_usage": memory_usage,
                "cpu_usage": cpu_usage,
                "status": "success",
                "timestamp": datetime.utcnow().isoformat()
            }
            logger.info(f"Execution completed for function {function_id}")
            
            return {
                "result": result,
                "metrics": self.metrics[function_id]
            }
            
        except Exception as e:
            # Store error metrics
            logger.error(f"Function execution failed: {str(e)}")
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
        try:
            cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
            system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
            cpu_usage = (cpu_delta / system_delta) * 100 if system_delta > 0 else 0
            return cpu_usage
        except Exception as e:
            logger.error(f"Error calculating CPU usage: {str(e)}")
            return 0.0

    def cleanup(self, function_id: str):
        """Clean up resources for a function."""
        container_id = self.container_pool.get(function_id)
        if container_id:
            try:
                logger.info(f"Cleaning up container {container_id} for function {function_id}")
                container = self.docker_client.containers.get(container_id)
                logger.info(f"Stopping container {container_id}")
                container.stop()
                logger.info(f"Removing container {container_id}")
                container.remove()
                del self.container_pool[function_id]
                logger.info(f"Container {container_id} successfully removed from pool")
            except Exception as e:
                logger.error(f"Error cleaning up container: {str(e)}")
        else:
            logger.info(f"No container found in pool for function {function_id}")