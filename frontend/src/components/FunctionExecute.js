import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

const FunctionExecute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inputData, setInputData] = useState('{\n  "num1": 5,\n  "num2": 3\n}');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [functionDetails, setFunctionDetails] = useState(null);

  // Fetch function details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/functions/${id}`);
        setFunctionDetails(response.data);
      } catch (err) {
        setError('Failed to load function details');
      }
    };
    fetchDetails();
  }, [id]);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Parse the input data
      let parsedInput;
      try {
        parsedInput = JSON.parse(inputData);
      } catch (parseError) {
        setError('Invalid JSON input. Please check your syntax.');
        setLoading(false);
        return;
      }
      
      // Execute the function
      const response = await axios.post(
        `http://localhost:8000/functions/${id}/execute`,
        parsedInput
      );
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Error executing function. Check server logs for details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Execute Function
      </Typography>
      
      {functionDetails && (
        <Box mb={3}>
          <Typography variant="h6">{functionDetails.name}</Typography>
          <Typography variant="body2" color="textSecondary">
            Language: {functionDetails.language}
          </Typography>
        </Box>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Input Data (JSON)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                variant="outlined"
                placeholder='Enter JSON input'
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                error={!!error && error.includes('JSON')}
                helperText={error && error.includes('JSON') ? error : ''}
                sx={{ fontFamily: 'monospace' }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleExecute}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Execute Function'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Result
              </Typography>
              
              {error && !error.includes('JSON') && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {result && (
                <>
                  {result.metrics && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Execution Time: {result.metrics.execution_time.toFixed(4)}s
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Memory: {result.metrics.memory_usage.toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}
                  
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default',
                      maxHeight: '300px',
                      overflow: 'auto',
                      fontFamily: 'monospace'
                    }}
                  >
                    <pre>{JSON.stringify(result.result, null, 2)}</pre>
                  </Paper>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/functions')}
        >
          Back to Functions
        </Button>
      </Box>
    </Box>
  );
};

export default FunctionExecute; 