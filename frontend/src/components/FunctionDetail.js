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
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
} from '@mui/material';
import axios from 'axios';
import { styled } from '@mui/material/styles';

// Icons
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouteIcon from '@mui/icons-material/Route';
import LanguageIcon from '@mui/icons-material/Language';

const CodePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#1e1e1e',
  color: '#ffffff',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
  borderRadius: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const ResultPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
  borderRadius: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.spacing(1),
}));

const MetricsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
}));

const FunctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [functionData, setFunctionData] = useState(null);
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    route: '',
    timeout: 30,
    language: 'python',
    code: '',
  });

  useEffect(() => {
    fetchFunction();
  }, [id]);

  useEffect(() => {
    if (functionData) {
      setEditData({
        name: functionData.name || '',
        route: functionData.route || '',
        timeout: functionData.timeout || 30,
        language: functionData.language || 'python',
        code: functionData.code || '',
      });
    }
  }, [functionData]);

  const fetchFunction = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/functions/${id}`);
      setFunctionData(response.data);
    } catch (error) {
      console.error('Error fetching function:', error);
      setError('Failed to load function details.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.post(
        `http://localhost:8000/functions/${id}/execute`,
        JSON.parse(inputData || '{}')
      );
      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error executing function');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset to original data
    if (functionData) {
      setEditData({
        name: functionData.name || '',
        route: functionData.route || '',
        timeout: functionData.timeout || 30,
        language: functionData.language || 'python',
        code: functionData.code || '',
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`http://localhost:8000/functions/${id}`, editData);
      setFunctionData(response.data);
      setEditMode(false);
      
      // Show success message or toast here if needed
    } catch (error) {
      console.error('Error updating function:', error);
      setError('Failed to update function. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:8000/functions/${id}`);
      navigate('/functions');
    } catch (error) {
      setError('Failed to delete function');
      setLoading(false);
    }
  };

  if (loading && !functionData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!functionData && !loading) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Function not found or failed to load.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CodeIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
          {editMode ? (
            <TextField
              label="Function Name"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              variant="outlined"
              size="small"
              sx={{ minWidth: 200 }}
            />
          ) : (
            <Typography variant="h4" component="h1">
              {functionData?.name}
            </Typography>
          )}
        </Box>
        <Box>
          {editMode ? (
            <>
              <Button 
                variant="outlined" 
                onClick={handleCancelEdit} 
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveEdit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Tooltip title="Edit Function">
                <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Function">
                <IconButton onClick={handleDelete} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CodeIcon sx={{ mr: 1 }} /> Function Details
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {editMode ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Route"
                      name="route"
                      value={editData.route}
                      onChange={handleEditChange}
                      variant="outlined"
                      size="small"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Language"
                      name="language"
                      value={editData.language}
                      onChange={handleEditChange}
                      variant="outlined"
                      size="small"
                      margin="normal"
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Timeout (seconds)"
                      name="timeout"
                      type="number"
                      value={editData.timeout}
                      onChange={handleEditChange}
                      variant="outlined"
                      size="small"
                      margin="normal"
                      InputProps={{ inputProps: { min: 1, max: 300 } }}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <RouteIcon fontSize="small" sx={{ mr: 1 }} /> ROUTE
                    </Typography>
                    <Typography variant="body1">{functionData?.route}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <LanguageIcon fontSize="small" sx={{ mr: 1 }} /> LANGUAGE
                    </Typography>
                    <Chip 
                      label={functionData?.language || 'python'} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} /> TIMEOUT
                    </Typography>
                    <Typography variant="body1">{functionData?.timeout} seconds</Typography>
                  </Box>
                </Stack>
              )}
              
              <Typography variant="h6" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
                <CodeIcon sx={{ mr: 1 }} /> Source Code
              </Typography>
              
              {editMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  name="code"
                  value={editData.code}
                  onChange={handleEditChange}
                  variant="outlined"
                  sx={{
                    fontFamily: 'monospace',
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1e1e1e',
                      color: '#ffffff',
                    }
                  }}
                />
              ) : (
                <CodePaper>
                  {functionData?.code}
                </CodePaper>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PlayArrowIcon sx={{ mr: 1 }} /> Execute Function
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Input Data (JSON)"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                sx={{ mb: 2 }}
                placeholder='{"key": "value"}'
                variant="outlined"
              />
              
              <ActionButton
                variant="contained"
                color="primary"
                onClick={handleExecute}
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
              >
                {loading ? 'Executing...' : 'Execute Function'}
              </ActionButton>
              
              {result && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Result
                  </Typography>
                  <ResultPaper>
                    {JSON.stringify(result.result, null, 2)}
                  </ResultPaper>
                  
                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    Execution Metrics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <MetricsCard>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            EXECUTION TIME
                          </Typography>
                          <Typography variant="h6">
                            {result.metrics.execution_time.toFixed(4)} s
                          </Typography>
                        </CardContent>
                      </MetricsCard>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <MetricsCard>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            MEMORY USAGE
                          </Typography>
                          <Typography variant="h6">
                            {result.metrics.memory_usage.toFixed(2)} MB
                          </Typography>
                        </CardContent>
                      </MetricsCard>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <MetricsCard>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            CPU USAGE
                          </Typography>
                          <Typography variant="h6">
                            {result.metrics.cpu_usage.toFixed(2)} %
                          </Typography>
                        </CardContent>
                      </MetricsCard>
                    </Grid>
                  </Grid>
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