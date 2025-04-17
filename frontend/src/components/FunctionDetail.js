import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import axios from 'axios';

const FunctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [functionData, setFunctionData] = useState(null);
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFunction();
  }, [id]);

  const fetchFunction = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/functions/${id}`);
      setFunctionData(response.data);
    } catch (error) {
      console.error('Error fetching function:', error);
    }
  };

  const handleExecute = async () => {
    try {
      setError(null);
      const response = await axios.post(
        `http://localhost:8000/functions/${id}/execute`,
        JSON.parse(inputData || '{}')
      );
      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error executing function');
    }
  };

  if (!functionData) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {functionData.name}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Function Details
              </Typography>
              <Typography>
                <strong>Route:</strong> {functionData.route}
              </Typography>
              <Typography>
                <strong>Language:</strong> {functionData.language}
              </Typography>
              <Typography>
                <strong>Timeout:</strong> {functionData.timeout} seconds
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                Code
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#f5f5f5',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {functionData.code}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Execute Function
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Input Data (JSON)"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleExecute}
                fullWidth
              >
                Execute
              </Button>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              {result && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Result
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: '#f5f5f5',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {JSON.stringify(result.result, null, 2)}
                  </Paper>
                  <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                    Metrics
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: '#f5f5f5',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {JSON.stringify(result.metrics, null, 2)}
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FunctionDetail; 