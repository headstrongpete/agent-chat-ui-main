import React from 'react';

// Use the same Agent interface as in AgentCard
interface Agent {
  _id: string;
  assistantId: string;
  displayName: string;
  description?: string;
  category?: string;
  iconUrl?: string;
}

interface AgentDetailModalProps {
  agent: Agent;
  onClose: () => void;
  onStartChat: (agent: Agent) => void;
}

export function AgentDetailModal({ agent, onClose, onStartChat }: AgentDetailModalProps) {
  if (!agent) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-start gap-6">
            {agent.iconUrl ? (
              <img src={agent.iconUrl} alt={agent.displayName} className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-semibold">
                {agent.displayName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold">{agent.displayName}</h2>
              <p className="text-sm text-gray-500 mb-4">{agent.category || 'General'}</p>
              <p className="text-gray-700">{agent.description || 'No description available.'}</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => onStartChat(agent)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Chat with this Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 