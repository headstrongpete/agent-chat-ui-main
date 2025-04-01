import React from 'react';

// Define the Agent interface based on your API response
interface Agent {
  _id: string;
  assistantId: string;
  displayName: string;
  description?: string;
  category?: string;
  iconUrl?: string;
}

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
}

export function AgentCard({ agent, onSelect }: AgentCardProps) {
  return (
    <button
      onClick={() => onSelect(agent)}
      className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full p-5"
    >
      <div className="w-full text-left">
        <h3 className="font-semibold text-lg">{agent.displayName}</h3>
        {agent.description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-4">{agent.description}</p>
        )}
      </div>
    </button>
  );
} 