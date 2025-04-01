import axios from 'axios';

export interface Agent {
  _id: string;
  displayName: string;
  graphName: string;
  category: string;
  description: string;
  assistantId: string;
  active: boolean;
  starterQuestions?: string[];
  createdAt: string;
  updatedAt: string;
  lastModified: string;
}

export interface PaginatedResponse<T> {
  agents: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface LangGraphAgent {
  assistant_id: string;
  graph_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  version: number;
  config?: {
    configurable?: {
      model?: string;
      system_message?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  metadata?: {
    created_by?: string;
    [key: string]: any;
  };
}

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || "http://localhost:4000/api",
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  console.log('AgentAPI: Auth token:', token ? 'Present' : 'Missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AgentAPI: Request failed:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      headers: error.config?.headers
    });
    return Promise.reject(error);
  }
);

export const agentApi = {
  // Fetch available agents from LangGraph
  fetchAvailableAgentsFromLangGraph: async (apiUrl: string, apiKey: string): Promise<LangGraphAgent[]> => {
    console.log('Making request to fetch available agents:', {
      baseURL: api.defaults.baseURL,
      endpoint: '/agents/available',
      requestBody: {
        apiUrl,
        apiKey: apiKey ? '***' : undefined
      }
    });
    
    const response = await api.post('/agents/available', {
      apiUrl,
      apiKey,
    });
    
    console.log('Response from fetch available agents:', {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  },

  // Fetch available agents from backend
  fetchAvailableAgents: async (apiUrl: string, apiKey: string): Promise<LangGraphAgent[]> => {
    const response = await api.post('/agents/available', { apiUrl, apiKey });
    return response.data;
  },

  // Get all agents with pagination
  getAllAgents: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Agent>> => {
    try {
      console.log(`AgentAPI: Fetching agents from /api/agents?page=${page}&limit=${limit}`);
      const response = await api.get(`/agents?page=${page}&limit=${limit}`);
      console.log('AgentAPI: Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getAllAgents:', error);
      // Return a default empty response
      return {
        agents: [],
        pagination: {
          total: 0,
          page: page,
          pages: 1
        }
      };
    }
  },

  // Get agent by ID
  getAgentById: async (id: string): Promise<Agent> => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },

  // Create new agent
  createAgent: async (agent: Omit<Agent, '_id' | 'createdAt' | 'updatedAt' | 'lastModified'>): Promise<Agent> => {
    const response = await api.post('/agents', agent);
    return response.data;
  },

  // Update agent
  updateAgent: async (id: string, agent: Partial<Agent>): Promise<Agent> => {
    const response = await api.put(`/agents/${id}`, agent);
    return response.data;
  },

  // Delete agent
  deleteAgent: async (id: string): Promise<void> => {
    await api.delete(`/agents/${id}`);
  },

  // Get agent by assistantId
  getAgentByAssistantId: async (assistantId: string): Promise<Agent> => {
    const response = await api.get(`/agents/by-assistant/${assistantId}`);
    return response.data;
  },

  // Toggle agent status
  toggleAgentStatus: async (id: string): Promise<Agent> => {
    const response = await api.patch(`/agents/${id}/status`);
    return response.data;
  }
};