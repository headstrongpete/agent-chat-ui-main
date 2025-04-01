import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThreadHistory from '@/components/thread/history';
import { agentApi } from '@/lib/agent-api';
import { AgentCard } from './AgentCard';
import { AgentDetailModal } from './AgentDetailModal';
import { LogOut } from 'lucide-react';
import { TooltipIconButton } from '@/components/thread/tooltip-icon-button';
import { useAuth } from '@/providers/Auth';

// Define the Agent interface based on API
interface Agent {
  _id: string;
  assistantId: string;
  displayName: string;
  description?: string;
  category?: string;
  iconUrl?: string;
}

interface PaginatedResponse<T> {
  agents: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export function AgentExplorerPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await agentApi.getAllAgents(1, 50);
        
        // Sort agents alphabetically by displayName
        const sortedAgents = [...response.agents].sort((a, b) => 
          a.displayName.localeCompare(b.displayName)
        );
        
        setAgents(sortedAgents);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgents();
  }, []);
  
  const startChatWithAgent = (agent: Agent) => {
    // Update URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('assistantId', agent.assistantId);
    searchParams.set('agentName', agent.displayName);
    
    // Navigate to chat with the new parameters
    navigate(`/chat?${searchParams.toString()}`);
  };
  
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Left sidebar with Thread History */}
      <div className="w-[300px] border-r border-gray-200 h-full overflow-hidden">
        <ThreadHistory />
      </div>
      
      {/* Main content - Agent exploration */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Explore Agents</h1>
            
            <TooltipIconButton
              size="lg"
              className="p-4"
              tooltip="Log out"
              variant="ghost"
              onClick={async () => {
                await logout();
                window.location.href = "/"; // Force redirect to login page
              }}
            >
              <LogOut className="size-5" />
            </TooltipIconButton>
          </div>
          
          {/* Optional categories/filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium">All Agents</button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 rounded-lg bg-gray-100 animate-pulse p-5">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent) => (
                <AgentCard 
                  key={agent._id} 
                  agent={agent} 
                  onSelect={() => startChatWithAgent(agent)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 