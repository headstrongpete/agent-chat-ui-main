const Agent = require('../models/agent');
const axios = require('axios');

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let agentCache = null;
let lastFetchTime = 0;

// Validation helper
const validateAgentData = (data) => {
  const errors = [];
  if (!data.displayName?.trim()) {
    errors.push('Display name is required');
  }
  if (!data.graphName?.trim()) {
    errors.push('Graph name is required');
  }
  if (!data.category?.trim()) {
    errors.push('Category is required');
  }
  if (!data.assistantId?.trim()) {
    errors.push('Assistant ID is required');
  }
  return errors;
};

// Fetch available agents from LangGraph endpoint
exports.fetchAvailableAgents = async (req, res) => {
  try {
    const { apiUrl, apiKey } = req.body;
    
    console.log('Fetching available agents from LangGraph:', {
      apiUrl,
      hasApiKey: !!apiKey
    });
    
    if (!apiUrl) {
      return res.status(400).json({ message: 'API URL is required' });
    }
    
    const requestConfig = {
      url: `${apiUrl}/assistants/search`,
      method: 'POST',
      data: {
        metadata: {},
        graph_id: "",
        limit: 50,
        offset: 0
      },
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-Api-Key': apiKey })
      }
    };
    
    console.log('Making request to LangGraph:', {
      url: requestConfig.url,
      method: requestConfig.method,
      headers: {
        ...requestConfig.headers,
        'X-Api-Key': apiKey ? '***' : undefined
      }
    });
    
    const response = await axios(requestConfig);
    
    console.log('Received response from LangGraph:', {
      status: response.status,
      data: response.data
    });
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching agents from LangGraph:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      requestUrl: error.config?.url,
      requestMethod: error.config?.method,
      requestHeaders: {
        ...error.config?.headers,
        'X-Api-Key': error.config?.headers?.['X-Api-Key'] ? '***' : undefined
      },
      stack: error.stack
    });
    
    return res.status(500).json({ 
      message: 'Failed to fetch agents from LangGraph', 
      error: error.message,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      }
    });
  }
};

// Get all agents with pagination
exports.getAllAgents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // If user is not admin, only return active agents
    const filter = req.user.role === 'admin' ? {} : { active: true };
    
    console.log(`Getting agents with filter: ${JSON.stringify(filter)}, user role: ${req.user.role}`);
    
    const [agents, total] = await Promise.all([
      Agent.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Agent.countDocuments(filter)
    ]);
    
    console.log(`Found ${agents.length} agents`);
    
    return res.status(200).json({
      agents,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving agents:', error);
    return res.status(500).json({ 
      message: 'Error retrieving agents', 
      error: error.message 
    });
  }
};

// Get agent by ID
exports.getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const agent = await Agent.findById(id);
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    return res.status(200).json(agent);
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving agent', 
      error: error.message 
    });
  }
};

// Get agent by assistantId
exports.getAgentByAssistantId = async (req, res) => {
  try {
    const { assistantId } = req.params;
    
    if (!assistantId) {
      return res.status(400).json({ message: 'Assistant ID is required' });
    }
    
    const agent = await Agent.findOne({ assistantId });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    return res.status(200).json(agent);
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving agent', 
      error: error.message 
    });
  }
};

// Create new agent
exports.createAgent = async (req, res) => {
  try {
    const validationErrors = validateAgentData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const { displayName, graphName, category, description, assistantId, starterQuestions } = req.body;
    
    const newAgent = new Agent({
      displayName,
      graphName,
      category,
      description,
      assistantId,
      starterQuestions: starterQuestions || [],
      active: true
    });
    
    await newAgent.save();
    return res.status(201).json(newAgent);
  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ 
        message: 'An agent with this display name already exists' 
      });
    }
    return res.status(500).json({ 
      message: 'Error creating agent', 
      error: error.message 
    });
  }
};

// Update agent
exports.updateAgent = async (req, res) => {
  try {
    const validationErrors = validateAgentData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const { id } = req.params;
    const { displayName, graphName, category, description, assistantId, active, starterQuestions } = req.body;
    
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      {
        displayName,
        graphName,
        category,
        description,
        assistantId,
        active,
        starterQuestions: starterQuestions || []
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedAgent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    return res.status(200).json(updatedAgent);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'An agent with this display name already exists' 
      });
    }
    return res.status(500).json({ 
      message: 'Error updating agent', 
      error: error.message 
    });
  }
};

// Delete agent
exports.deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAgent = await Agent.findByIdAndDelete(id);
    
    if (!deletedAgent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    return res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error deleting agent', 
      error: error.message 
    });
  }
};

// Toggle agent active status
exports.toggleAgentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id);
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    agent.active = !agent.active;
    await agent.save();
    
    return res.status(200).json(agent);
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error toggling agent status', 
      error: error.message 
    });
  }
};