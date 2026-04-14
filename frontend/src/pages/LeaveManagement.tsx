import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import CompanyLeavePolicy from '../components/CompanyLeavePolicy';
import axios from 'axios';

interface Employee {
  id: number;
  name: string;
}

interface LeaveRequest {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  employee?: Employee;
}

const LeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [calendarLeaves, setCalendarLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    console.log('Current user in LeaveManagement:', user);
    fetchLeaves();
  }, [activeTab, user]);

  const fetchLeaves = async () => {
    try {
      if (activeTab === 0) {
        const response = await axios.get('/api/leaves/my-leaves');
        setMyLeaves(response.data);
      } else if (activeTab === 1) {
        const response = await axios.get('/api/leaves/calendar');
        setCalendarLeaves(response.data);
      } else if (activeTab === 2) {
        const response = await axios.get('/api/leaves/approve');
        setPendingLeaves(response.data);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleApproveLeave = async (leaveId: number, action: 'approve' | 'reject') => {
    try {
      await axios.put(`/api/leaves/approve/${leaveId}`, { action });
      fetchLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Leave Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="My Leaves" />
          <Tab label="Calendar View" />
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <Tab label="Approve Leaves" />
          )}
        </Tabs>
      </Paper>

      {user?.role === 'admin' && (
        <Box sx={{ mb: 4 }}>
          <CompanyLeavePolicy />
        </Box>
      )}

      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.leave_type}</TableCell>
                  <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  <TableCell>
                    <Chip
                      label={leave.status}
                      color={getStatusColor(leave.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calendarLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.employee?.name}</TableCell>
                  <TableCell>{leave.leave_type}</TableCell>
                  <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={leave.status}
                      color={getStatusColor(leave.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 2 && (user?.role === 'admin' || user?.role === 'hr') && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.employee?.name}</TableCell>
                  <TableCell>{leave.leave_type}</TableCell>
                  <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleApproveLeave(leave.id, 'approve')}
                      sx={{ mr: 1 }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleApproveLeave(leave.id, 'reject')}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LeaveManagement; 