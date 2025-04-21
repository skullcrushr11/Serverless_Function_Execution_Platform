import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  MenuItem,
} from '@mui/material';
import axios from 'axios';

const FunctionCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    route: '',
    language: 'python',
    code: '',
    timeout: 30,
    environment_variables: {},
  });

  // Language templates
  const templates = {
    python: `def main(input_data):
    """
    This is a simple serverless function.
    The input_data parameter contains the JSON input provided to the function.
    The return value will be serialized as JSON in the response.
    """
    # Simple example: add two numbers
    num1 = input_data.get("num1", 0)
    num2 = input_data.get("num2", 0)
    
    return {
        "sum": num1 + num2,
        "message": "Hello from Python serverless function!"
    }`,
    javascript: `/**
 * This is a simple serverless function.
 * The input_data parameter contains the JSON input provided to the function.
 * The return value will be serialized as JSON in the response.
 * For async operations, you can use async/await syntax.
 * 
 * @param {Object} input_data - The input data object
 * @returns {Object} The function result
 */
async function main(input_data) {
    // Simple example: add two numbers
    const num1 = input_data.num1 || 0;
    const num2 = input_data.num2 || 0;
    
    return {
        sum: num1 + num2,
        message: "Hello from JavaScript serverless function!"
    };
}`
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Apply code template when language changes
    if (name === 'language' && templates[value] && !formData.code) {
      setFormData((prev) => ({
        ...prev,
        code: templates[value],
      }));
    }
  };

  // Set default template on first load
  useEffect(() => {
    if (!formData.code && formData.language) {
      setFormData((prev) => ({
        ...prev,
        code: templates[prev.language] || '',
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/functions/', formData);
      navigate('/functions');
    } catch (error) {
      console.error('Error creating function:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Function
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Function Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Route"
                  name="route"
                  value={formData.route}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="javascript">JavaScript</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Timeout (seconds)"
                  name="timeout"
                  value={formData.timeout}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  label="Function Code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/functions')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    Create Function
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FunctionCreate; 