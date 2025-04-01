import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AgentTable } from './AgentTable';
import { AgentForm } from './AgentForm';
import { Agent } from '@/lib/agent-api';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getApiKey } from '@/lib/config-utils';
import { toast } from 'sonner';

interface AgentManagerProps {
  apiUrl: string;
}

export const AgentManager = ({ apiUrl }: AgentManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const apiKey = getApiKey();

  console.log('AgentManager: Current API key status:', apiKey ? 'present' : 'missing');

  const handleAddNew = () => {
    if (!apiKey) {
      toast.error('API Key Required', {
        description: 'Please configure your LangSmith API key in the settings before adding agents.'
      });
      return;
    }
    setIsAddDialogOpen(true);
  };

  const handleEdit = (agent: Agent) => {
    if (!apiKey) {
      toast.error('API Key Required', {
        description: 'Please configure your LangSmith API key in the settings before editing agents.'
      });
      return;
    }
    setSelectedAgent(agent);
    setIsEditDialogOpen(true);
  };

  const handleFormSubmit = () => {
    // Close dialogs and reset state
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedAgent(null);
    
    // Refresh the agent list to show the new/updated agent
    setRefreshKey(prev => prev + 1);
    
    // Clear the URL just to be safe
    // This prevents any unintended navigation that might be happening
    window.history.replaceState(null, '', window.location.pathname);
    
    // Show success message
    toast.success(isEditDialogOpen ? 'Agent updated successfully' : 'Agent added successfully');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agent Management</h2>
        <Button 
          type="button" 
          onClick={handleAddNew} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      <Separator />

      <div className="mt-4">
        <AgentTable 
          key={refreshKey} 
          onEdit={handleEdit} 
          onRefresh={handleRefresh} 
        />
      </div>

      {/* Add Agent Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Only handle the dialog closing event
          setIsAddDialogOpen(false);
          // Ensure we're staying on the config page
          if (window.location.pathname !== '/config') {
            window.history.replaceState(null, '', '/config');
          }
        } else {
          setIsAddDialogOpen(true);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
            <DialogDescription>
              Create a new agent by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            {apiKey && (
              <AgentForm 
                apiUrl={apiUrl}
                apiKey={apiKey}
                onCancel={() => setIsAddDialogOpen(false)} 
                onSubmit={handleFormSubmit} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Only handle the dialog closing event
          setIsEditDialogOpen(false);
          setSelectedAgent(null);
          // Ensure we're staying on the config page
          if (window.location.pathname !== '/config') {
            window.history.replaceState(null, '', '/config');
          }
        } else {
          setIsEditDialogOpen(true);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Modify the agent's details using the form below.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            {selectedAgent && apiKey && (
              <AgentForm 
                apiUrl={apiUrl}
                apiKey={apiKey}
                onCancel={() => setIsEditDialogOpen(false)} 
                onSubmit={handleFormSubmit} 
                agent={selectedAgent}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};