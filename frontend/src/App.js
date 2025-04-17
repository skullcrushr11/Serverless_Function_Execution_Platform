import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import FunctionsIcon from '@mui/icons-material/Functions';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import MenuIcon from '@mui/icons-material/Menu';

import FunctionList from './components/FunctionList';
import FunctionDetail from './components/FunctionDetail';
import FunctionCreate from './components/FunctionCreate';
import FunctionExecute from './components/FunctionExecute';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#90caf9',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: '#ffffff',
          color: '#121212',
          '&:hover': {
            backgroundColor: '#e0e0e0',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const drawerWidth = 240;

  const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Functions', path: '/functions', icon: <FunctionsIcon /> },
    { text: 'Create Function', path: '/functions/create', icon: <AddIcon /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="fixed" elevation={0}>
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer(true)}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'background.paper', mr: 2 }}>
                  <CodeIcon />
                </Avatar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                  Serverless Platform
                </Typography>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 'auto' }}>
                {navItems.map((item) => (
                  <Button 
                    key={item.text}
                    color="inherit" 
                    component={RouterLink} 
                    to={item.path}
                    sx={{ 
                      mx: 1, 
                      borderRadius: 2,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                    startIcon={item.icon}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            </Toolbar>
          </AppBar>

          {/* Drawer for mobile */}
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={toggleDrawer(false)}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                backgroundColor: 'background.paper',
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', color: 'background.paper', mr: 2 }}>
                <CodeIcon />
              </Avatar>
              <Typography variant="h6" component="div">
                Serverless
              </Typography>
            </Box>
            <Divider />
            <List>
              {navItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton 
                    component={RouterLink} 
                    to={item.path}
                    onClick={toggleDrawer(false)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Drawer>

          {/* Main content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 8,
              backgroundColor: 'background.default',
            }}
          >
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Paper elevation={0} sx={{ p: 3, backgroundColor: 'transparent' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/functions" element={<FunctionList />} />
                  <Route path="/functions/create" element={<FunctionCreate />} />
                  <Route path="/functions/:id" element={<FunctionDetail />} />
                  <Route path="/functions/:id/execute" element={<FunctionExecute />} />
                </Routes>
              </Paper>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 