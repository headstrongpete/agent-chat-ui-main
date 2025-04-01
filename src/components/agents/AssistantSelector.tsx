import { useState, useEffect } from 'react';
import { agentApi, Agent } from '@/lib/agent-api';

interface AssistantSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function AssistantSelector({ value, onChange }: AssistantSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch agents on component mount
  useEffect(() => {
    console.log("AssistantSelector: Fetching agents...");
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await agentApi.getAllAgents(1, 100);
        console.log("AssistantSelector: Received agents:", response.agents);
        const activeAgents = response.agents.filter(agent => agent.active);
        setAgents(activeAgents);

        // If no value is set and we have agents, set the first one as default
        if ((!value || value === '') && activeAgents.length > 0) {
          console.log("AssistantSelector: Setting default agent:", activeAgents[0].assistantId);
          onChange(activeAgents[0].assistantId);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);
  
  // Handle manual selection
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    console.log(`AssistantSelector: Native select changed to: ${newValue}`);
    onChange(newValue);
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="h-10 w-full flex items-center px-3 py-2 border rounded-md">
          Loading assistants...
        </div>
      ) : (
        <select 
          value={value}
          onChange={handleChange}
          className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background"
        >
          <option value="" disabled>Select an assistant</option>
          {agents.map((agent) => (
            <option 
              key={agent._id} 
              value={agent.assistantId}
            >
              {agent.displayName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}