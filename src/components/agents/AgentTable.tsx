import { useState, useEffect } from 'react';
import { agentApi, Agent } from '@/lib/agent-api';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter,
  SheetDescription
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Type for sortable fields
type SortField = 'displayName' | 'graphName' | 'category' | 'active';
type SortDirection = 'asc' | 'desc';

interface AgentTableProps {
  onEdit: (agent: Agent) => void;
  onRefresh: () => void;
}

export const AgentTable = ({ onEdit, onRefresh }: AgentTableProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [agentToToggle, setAgentToToggle] = useState<Agent | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Add sorting state
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await agentApi.getAllAgents(currentPage);
      if (response && response.agents) {
        const sortedAgents = sortAgents(response.agents, sortField, sortDirection);
        setAgents(sortedAgents);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        // Handle empty response
        setAgents([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
      // Set empty state on error
      setAgents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Sort agents based on field and direction
  const sortAgents = (agents: Agent[], field: SortField, direction: SortDirection) => {
    return [...agents].sort((a, b) => {
      let valueA, valueB;
      
      // Get the comparison values based on field
      if (field === 'active') {
        valueA = a.active ? 1 : 0;
        valueB = b.active ? 1 : 0;
      } else {
        valueA = a[field]?.toString().toLowerCase() || '';
        valueB = b[field]?.toString().toLowerCase() || '';
      }
      
      // Compare based on direction
      if (direction === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };
  
  // Handle sort when clicking on column headers
  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as the sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Re-sort agents when sort parameters change
  useEffect(() => {
    if (agents.length > 0) {
      const sortedAgents = sortAgents(agents, sortField, sortDirection);
      setAgents(sortedAgents);
    }
  }, [sortField, sortDirection]);

  useEffect(() => {
    fetchAgents();
  }, [currentPage]);

  const handleDelete = async () => {
    if (!agentToDelete) return;
    
    try {
      await agentApi.deleteAgent(agentToDelete._id);
      toast.success(`Agent "${agentToDelete.displayName}" deleted successfully`);
      fetchAgents();
      onRefresh();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setDeleteConfirmOpen(false);
      setAgentToDelete(null);
    }
  };

  const openDeleteConfirm = (agent: Agent) => {
    setOpenDropdown(null);
    setAgentToDelete(agent);
    setDeleteConfirmOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!agentToToggle) return;
    
    try {
      const updatedAgent = await agentApi.toggleAgentStatus(agentToToggle._id);
      toast.success(`Agent "${agentToToggle.displayName}" ${updatedAgent.active ? 'activated' : 'deactivated'} successfully`);
      fetchAgents();
      onRefresh();
    } catch (error) {
      console.error('Error toggling agent status:', error);
      toast.error('Failed to update agent status');
    } finally {
      setStatusConfirmOpen(false);
      setAgentToToggle(null);
    }
  };

  const openToggleStatusConfirm = (agent: Agent) => {
    setOpenDropdown(null);
    setAgentToToggle(agent);
    setStatusConfirmOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditClick = (agent: Agent) => {
    setOpenDropdown(null);
    onEdit(agent);
  };

  const toggleDropdown = (agentId: string) => {
    setOpenDropdown(openDropdown === agentId ? null : agentId);
  };
  
  // Render sort icon based on current sort state
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        <table className="w-full caption-bottom text-sm table-fixed">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[28%] cursor-pointer"
                onClick={() => handleSort('displayName')}
              >
                <div className="flex items-center">
                  Display Name
                  {renderSortIcon('displayName')}
                </div>
              </th>
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[28%] cursor-pointer"
                onClick={() => handleSort('graphName')}
              >
                <div className="flex items-center">
                  Graph Name
                  {renderSortIcon('graphName')}
                </div>
              </th>
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[18%] cursor-pointer"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  {renderSortIcon('category')}
                </div>
              </th>
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[8%] cursor-pointer"
                onClick={() => handleSort('active')}
              >
                <div className="flex items-center">
                  Status
                  {renderSortIcon('active')}
                </div>
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-[18%]">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">Loading...</td>
              </tr>
            ) : agents?.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">No agents found</td>
              </tr>
            ) : (
              agents?.map((agent) => (
                <tr key={agent._id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 truncate">{agent.displayName}</td>
                  <td className="p-4 truncate">{agent.graphName}</td>
                  <td className="p-4 truncate">{agent.category}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agent.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {agent.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleDropdown(agent._id);
                              return false;
                            }}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end"
                          open={openDropdown === agent._id}
                          setOpen={(open: boolean) => setOpenDropdown(open ? agent._id : null)}
                        >
                          <div className="z-[100]">
                            <DropdownMenuItem onClick={() => handleEditClick(agent)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteConfirm(agent)}>
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openToggleStatusConfirm(agent)}>
                              {agent.active ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>Activate</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the agent "{agentToDelete?.displayName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {agentToToggle?.active ? 'Deactivate' : 'Activate'} Agent
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {agentToToggle?.active ? 'deactivate' : 'activate'} the agent "{agentToToggle?.displayName}"?
              {agentToToggle?.active 
                ? ' This will make it unavailable for end users.' 
                : ' This will make it available for end users.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setStatusConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant={agentToToggle?.active ? 'destructive' : 'default'} onClick={handleToggleStatus}>
              {agentToToggle?.active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};