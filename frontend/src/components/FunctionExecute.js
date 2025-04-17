import React, { useState } from 'react';
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
} from '@mui/material';
import axios from 'axios';

const FunctionExecute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`http://localhost:8000/functions/${id}/execute`, 
        JSON.parse(inputData)
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error executing function');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Execute Function
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Input Data
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                variant="outlined"
                placeholder='Enter JSON input (e.g., {"num1": 5, "num2": 3})'
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                error={!!error}
                helperText={error}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleExecute}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Execute'}
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
              {result && (
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </Paper>
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