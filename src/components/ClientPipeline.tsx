'use client';

import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Client, ClientStage } from '@/types/client';
import { getClients, downloadClientTemplate, uploadClients, createClient, updateClient, deleteClient } from '@/services/leadClient';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';
import AddClientDialog from './AddClientDialog';
import { tokens } from '@/theme';
import { toast } from 'react-hot-toast';

const ClientPipeline = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stages: ClientStage[] = ['active', 'inactive', 'onboarding', 'churned'];

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      toast.error('Failed to fetch clients');
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newClient = await createClient(clientData);
      setClients([...clients, newClient]);
      toast.success('Client added successfully');
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add client');
      console.error('Error adding client:', error);
    }
  };

  const handleUpdateClient = async (clientId: string, updatedData: Partial<Client>) => {
    try {
      const updatedClient = await updateClient(clientId, updatedData);
      setClients(clients.map(client => 
        client.id === clientId ? updatedClient : client
      ));
      toast.success('Client updated successfully');
    } catch (error) {
      toast.error('Failed to update client');
      console.error('Error updating client:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      setClients(clients.filter(client => client.id !== clientId));
      toast.success('Client deleted successfully');
    } catch (error) {
      toast.error('Failed to delete client');
      console.error('Error deleting client:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadClientTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'client_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Error downloading template:', error);
    }
  };

  const handleImportClients = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadClients(formData);
      await fetchClients();
      toast.success('Clients imported successfully');
    } catch (error) {
      toast.error('Failed to import clients');
      console.error('Error importing clients:', error);
    }
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="bold" sx={{ color: colors.grey[100] }}>
          Client Pipeline
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>
          <Button
            variant="contained"
            component="label"
            startIcon={<FileUploadIcon />}
          >
            Import Clients
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImportClients(e.target.files[0]);
                }
              }}
            />
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Client
          </Button>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} mb={2}>
        <Box display="flex" gap={2} alignItems="center">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterButton />
        </Box>
        <Box>
          <IconButton
            onClick={() => setViewMode('kanban')}
            color={viewMode === 'kanban' ? 'primary' : 'default'}
          >
            <ViewKanbanIcon />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ViewListIcon />
          </IconButton>
        </Box>
      </Box>

      {viewMode === 'kanban' ? (
        <KanbanBoard
          items={filteredClients}
          stages={stages}
          onUpdateItem={handleUpdateClient}
          onDeleteItem={handleDeleteClient}
          isLoading={isLoading}
        />
      ) : (
        <ListView
          items={filteredClients}
          onUpdateItem={handleUpdateClient}
          onDeleteItem={handleDeleteClient}
          isLoading={isLoading}
        />
      )}

      <AddClientDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddClient}
      />
    </Box>
  );
};

export default ClientPipeline; 