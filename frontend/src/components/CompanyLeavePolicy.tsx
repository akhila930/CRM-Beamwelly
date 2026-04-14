import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface LeavePolicy {
  annual_leave_count: number;
  sick_leave_count: number;
  casual_leave_count: number;
}

const CompanyLeavePolicy: React.FC = () => {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<LeavePolicy>({
    annual_leave_count: 20,
    sick_leave_count: 15,
    casual_leave_count: 12,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await axios.get('/api/leave-policy');
      setPolicy(response.data);
    } catch (error) {
      console.error('Error fetching leave policy:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.put('/api/leave-policy', policy);
      setMessage('Leave policy updated successfully');
      setPolicy(response.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error updating leave policy');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPolicy(prev => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Company Leave Policy
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Annual Leave Count"
                name="annual_leave_count"
                type="number"
                value={policy.annual_leave_count}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                label="Sick Leave Count"
                name="sick_leave_count"
                type="number"
                value={policy.sick_leave_count}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                label="Casual Leave Count"
                name="casual_leave_count"
                type="number"
                value={policy.casual_leave_count}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
              >
                {loading ? 'Updating...' : 'Update Leave Policy'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
      >
        <Alert severity="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyLeavePolicy; 