import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import FunctionsIcon from '@mui/icons-material/Functions';
import InfoIcon from '@mui/icons-material/Info';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 600,
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
  },
  '& .MuiDataGrid-cell': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
}));

const LanguageChip = styled(Chip)(({ theme, language }) => ({
  backgroundColor: language === 'python' ? '#306998' : '#f7df1e',
  color: language === 'python' ? '#fff' : '#000',
  fontWeight: 600,
  fontSize: '0.75rem',
}));

const FunctionList = () => {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [functionToDelete, setFunctionToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/functions/');
      setFunctions(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching functions:', error);
      setError('Failed to load functions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setFunctionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:8000/functions/${functionToDelete}`);
      setDeleteDialogOpen(false);
      setFunctionToDelete(null);
      fetchFunctions();
    } catch (error) {
      console.error('Error deleting function:', error);
      setError('Failed to delete function. Please try again.');
      setLoading(false);
    }
  };

  const handleExecute = (id) => {
    navigate(`/functions/${id}`);
  };

  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.value}
        </Typography>
      ),
    },
    { 
      field: 'name', 
      headerName: 'Function Name', 
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CodeIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
          <Typography sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'route', 
      headerName: 'Route', 
      width: 200,
      renderCell: (params) => (
        <Tooltip title={`Endpoint: ${params.value}`}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    { 
      field: 'language', 
      headerName: 'Language', 
      width: 130,
      renderCell: (params) => (
        <LanguageChip 
          label={params.value} 
          size="small" 
          language={params.value}
        />
      ),
    },
    { 
      field: 'timeout', 
      headerName: 'Timeout', 
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value} sec
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              color="primary"
              onClick={() => navigate(`/functions/${params.row.id}`)}
              size="small"
              sx={{ mr: 1 }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Execute Function">
            <IconButton
              color="secondary"
              onClick={() => handleExecute(params.row.id)}
              size="small"
              sx={{ mr: 1 }}
            >
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Function">
            <IconButton
              color="error"
              onClick={() => confirmDelete(params.row.id)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <HeaderBox>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FunctionsIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Functions
          </Typography>
        </Box>
        <ActionButton
          variant="contained"
          color="primary"
          onClick={() => navigate('/functions/create')}
          startIcon={<AddIcon />}
        >
          Create Function
        </ActionButton>
      </HeaderBox>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card elevation={2}>
        <CardContent>
          {loading && !functions.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <StyledDataGrid
              rows={functions}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25]}
              autoHeight
              disableSelectionOnClick
              loading={loading}
              sx={{ minHeight: 400 }}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this function? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FunctionList; 