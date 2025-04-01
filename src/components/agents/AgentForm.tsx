import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { agentApi, Agent, LangGraphAgent } from '@/lib/agent-api';
import { getApiKey } from '@/lib/config-utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentFormProps {
  apiUrl: string;
  apiKey: string;
  onSubmit: () => void;
  onCancel: () => void;
  agent?: Agent;
}

export function AgentForm({ apiUrl, apiKey, onSubmit, onCancel, agent }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<LangGraphAgent[]>([]);
  const [graphName, setGraphName] = useState(agent?.graphName || "");
  const [displayName, setDisplayName] = useState(agent?.displayName || "");
  const [description, setDescription] = useState(agent?.description || "");
  const [category, setCategory] = useState(agent?.category || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [assistantId, setAssistantId] = useState(agent?.assistantId || "");
  const [starterQuestions, setStarterQuestions] = useState<string[]>(agent?.starterQuestions || []);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available agents from LangGraph
  useEffect(() => {
    const fetchAgents = async () => {
      if (!apiUrl) {
        console.log('No API URL provided, skipping fetch');
        return;
      }

      if (!apiKey) {
        console.log('No API key provided, skipping fetch');
        toast.error('LangSmith API key is required to fetch available agents');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Fetching available agents with:', { apiUrl, apiKey });
        const agents = await agentApi.fetchAvailableAgents(apiUrl, apiKey);
        console.log('Available agents:', agents);
        setAvailableAgents(agents);
      } catch (error) {
        console.error('Error fetching available agents:', error);
        toast.error('Failed to fetch available agents from LangGraph server');
      } finally {
        setLoading(false);
      }
    };

    console.log('AgentForm mounted/updated with:', { apiUrl, apiKey });
    fetchAgents();
  }, [apiUrl, apiKey]);

  // Update fields when a graph name is selected
  const handleGraphNameChange = (value: string) => {
    console.log('Graph name changed to:', value);
    setGraphName(value);
    
    // Find the selected agent data
    const selectedAgent = availableAgents.find(agent => agent.name === value);
    console.log('Selected agent data:', selectedAgent);
    if (selectedAgent) {
      setCategory(selectedAgent.graph_id);
      setAssistantId(selectedAgent.assistant_id);
      console.log(`Updated from selection: category=${selectedAgent.graph_id}, assistantId=${selectedAgent.assistant_id}`);
    }
  };

  // Validate the form
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (!graphName.trim()) {
      newErrors.graphName = 'Graph name is required';
    }
    
    if (!category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!assistantId.trim()) {
      newErrors.assistantId = 'Assistant ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const agentData = {
        displayName,
        graphName,
        category,
        description,
        assistantId,
        starterQuestions: starterQuestions.filter(q => q.trim().length > 0),
        active: agent?.active !== undefined ? agent.active : true
      };
      
      if (agent) {
        // Update existing agent
        await agentApi.updateAgent(agent._id, agentData);
        toast.success(`Agent "${displayName}" updated successfully`);
      } else {
        // Create new agent
        await agentApi.createAgent(agentData);
        toast.success(`Agent "${displayName}" created successfully`);
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error(`Failed to ${agent ? 'update' : 'create'} agent`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">
          Display Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
          className={errors.displayName ? 'border-red-500' : ''}
        />
        {errors.displayName && (
          <p className="text-red-500 text-xs">{errors.displayName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="graphName">
          Graph Name <span className="text-red-500">*</span>
        </Label>
        <select
          id="graphName"
          value={graphName}
          onChange={(e) => {
            const value = e.target.value;
            console.log('Native select onChange called with:', value);
            handleGraphNameChange(value);
          }}
          disabled={loading}
          className={`w-full h-10 px-3 py-2 rounded-md border ${errors.graphName ? 'border-red-500' : 'border-gray-300'} bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="" disabled>Select a graph name</option>
          {loading ? (
            <option value="loading" disabled>Loading...</option>
          ) : availableAgents.length === 0 ? (
            <option value="none" disabled>No agents available</option>
          ) : (
            availableAgents.map((agent) => (
              <option key={agent.assistant_id} value={agent.name}>
                {agent.name} ({agent.graph_id})
              </option>
            ))
          )}
        </select>
        {errors.graphName && (
          <p className="text-red-500 text-xs">{errors.graphName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-red-500">*</span>
        </Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          readOnly
          className={`bg-gray-100 ${errors.category ? 'border-red-500' : ''}`}
        />
        {errors.category && (
          <p className="text-red-500 text-xs">{errors.category}</p>
        )}
        <p className="text-xs text-gray-500">
          This field is automatically populated when you select a graph name.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description for this agent"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assistantId">
          Assistant ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="assistantId"
          value={assistantId}
          onChange={(e) => setAssistantId(e.target.value)}
          placeholder="Assistant ID"
          readOnly
          className={`bg-gray-100 ${errors.assistantId ? 'border-red-500' : ''}`}
        />
        {errors.assistantId && (
          <p className="text-red-500 text-xs">{errors.assistantId}</p>
        )}
        <p className="text-xs text-gray-500">
          This field is automatically populated when you select a graph name.
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          Starter Questions (up to 6, max 150 characters each)
        </Label>
        {starterQuestions.map((question, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              value={question}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= 150) {
                  const updatedQuestions = [...starterQuestions];
                  updatedQuestions[index] = newValue;
                  setStarterQuestions(updatedQuestions);
                }
              }}
              placeholder={`Question ${index + 1}`}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => {
                const updatedQuestions = starterQuestions.filter((_, i) => i !== index);
                setStarterQuestions(updatedQuestions);
              }}
            >
              &times;
            </Button>
            <span className="text-xs text-gray-500 w-16">
              {question.length}/150
            </span>
          </div>
        ))}
        {starterQuestions.length < 6 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (starterQuestions.length < 6) {
                setStarterQuestions([...starterQuestions, '']);
              }
            }}
            className="mt-2"
          >
            Add Question
          </Button>
        )}
        <p className="text-xs text-gray-500">
          Add questions that will be suggested to users when they first interact with this agent.
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting || loading}
        >
          {submitting 
            ? agent ? 'Updating...' : 'Creating...' 
            : agent ? 'Update Agent' : 'Add Agent'}
        </Button>
      </div>
    </form>
  );
}