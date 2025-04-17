import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';

import FunctionList from './components/FunctionList';
import FunctionDetail from './components/FunctionDetail';
import FunctionCreate from './components/FunctionCreate';
import FunctionExecute from './components/FunctionExecute';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Serverless Platform
              </Typography>
              <Button color="inherit" component={Link} href="/">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} href="/functions">
                Functions
              </Button>
              <Button color="inherit" component={Link} href="/functions/create">
                Create Function
              </Button>
            </Toolbar>
          </AppBar>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/functions" element={<FunctionList />} />
              <Route path="/functions/create" element={<FunctionCreate />} />
              <Route path="/functions/:id" element={<FunctionDetail />} />
              <Route path="/functions/:id/execute" element={<FunctionExecute />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 