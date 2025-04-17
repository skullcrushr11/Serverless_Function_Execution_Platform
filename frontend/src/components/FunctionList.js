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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from 'axios';

const FunctionList = () => {
  const [functions, setFunctions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/functions/');
      setFunctions(response.data);
    } catch (error) {
      console.error('Error fetching functions:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/functions/${id}`);
      fetchFunctions();
    } catch (error) {
      console.error('Error deleting function:', error);
    }
  };

  const handleExecute = (id) => {
    navigate(`/functions/${id}/execute`);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'route', headerName: 'Route', width: 200 },
    { field: 'language', headerName: 'Language', width: 130 },
    { field: 'timeout', headerName: 'Timeout (s)', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => navigate(`/functions/${params.row.id}`)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => handleExecute(params.row.id)}
          >
            <PlayArrowIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Functions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/functions/create')}
        >
          Create Function
        </Button>
      </Box>
      <Card>
        <CardContent>
          <DataGrid
            rows={functions}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            autoHeight
            disableSelectionOnClick
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default FunctionList; 