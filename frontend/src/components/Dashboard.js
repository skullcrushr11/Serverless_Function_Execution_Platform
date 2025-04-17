import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [functions, setFunctions] = useState([]);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    fetchFunctions();
    const interval = setInterval(fetchFunctions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchFunctions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/functions/');
      setFunctions(response.data);
      
      // Fetch metrics for each function
      const metricsData = {};
      for (const func of response.data) {
        const metricsResponse = await axios.get(
          `http://localhost:8000/functions/${func.id}/metrics`
        );
        metricsData[func.id] = metricsResponse.data;
      }
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const renderMetricsChart = (functionId) => {
    const functionMetrics = metrics[functionId] || [];
    const chartData = functionMetrics.map((metric) => ({
      timestamp: new Date(metric.timestamp).toLocaleTimeString(),
      executionTime: metric.execution_time,
      memoryUsage: metric.memory_usage,
      cpuUsage: metric.cpu_usage,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="executionTime"
            stroke="#8884d8"
            name="Execution Time (s)"
          />
          <Line
            type="monotone"
            dataKey="memoryUsage"
            stroke="#82ca9d"
            name="Memory Usage (MB)"
          />
          <Line
            type="monotone"
            dataKey="cpuUsage"
            stroke="#ffc658"
            name="CPU Usage (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {functions.map((func) => (
          <Grid item xs={12} key={func.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {func.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Route: {func.route}
                </Typography>
                {renderMetricsChart(func.id)}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 