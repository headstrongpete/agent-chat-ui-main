import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LangGraphLogoSVG, BearHeartIcon } from "@/components/icons/langgraph";
import { Label } from "@/components/ui/label";
import { ArrowRight, LogOut, Plus, Eye, EyeOff } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { useNavigate } from "react-router-dom";
import { useQueryParam, StringParam } from "use-query-params";
import { useAuth } from "@/providers/Auth";
import { toast } from "sonner";
import { AgentManager } from "./agents/AgentManager";
import { AssistantSelector } from "./agents/AssistantSelector";
import { CONFIG_KEYS, setConfig, getApiKey, DEFAULT_CONFIG } from "@/lib/config-utils";
import { agentApi } from "@/lib/agent-api";

export function ConfigPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [apiUrl, setApiUrl] = useQueryParam("apiUrl", StringParam);
  const [assistantId, setAssistantId] = useQueryParam("assistantId", StringParam);
  const [apiKey, _setApiKey] = useState(() => {
    return getApiKey();
  });

  // Load initial values from localStorage if not in URL params
  useEffect(() => {
    if (!apiUrl) {
      const savedApiUrl = localStorage.getItem(CONFIG_KEYS.API_URL);
      if (savedApiUrl) setApiUrl(savedApiUrl);
    }
    if (!assistantId) {
      const savedAssistantId = localStorage.getItem(CONFIG_KEYS.ASSISTANT_ID);
      if (savedAssistantId) setAssistantId(savedAssistantId);
    }
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem(CONFIG_KEYS.API_KEY, key);
    _setApiKey(key);
  };

  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, shouldNavigate = true) => {
    e.preventDefault();
    if (!apiUrl || !assistantId) {
      toast.error("Please complete all required fields");
      return;
    }

    console.log('ConfigPage: Submitting form with assistantId:', assistantId);
    
    // 1. Save all config values in one place
    setConfig({
      apiUrl,
      assistantId,
      apiKey: apiKey || undefined
    });
    
    // 2. Log what we're doing
    console.log('ConfigPage: Configuration saved:', {
      apiUrl,
      assistantId,
      apiKey: apiKey ? '[PRESENT]' : '[MISSING]'
    });

    // 3. Save user-specific config
    if (user?.id) {
      localStorage.setItem(`user_config_${user.id}`, JSON.stringify({
        apiUrl,
        assistantId
      }));
    }
    
    // Also explicitly save to localStorage
    localStorage.setItem(CONFIG_KEYS.API_URL, apiUrl);
    localStorage.setItem(CONFIG_KEYS.ASSISTANT_ID, assistantId);
    
    // 4. For admins staying on config page (agent form submissions)
    if (isAdmin && !shouldNavigate) {
      // Update URL parameters without page navigation
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('apiUrl', apiUrl);
      currentParams.set('assistantId', assistantId);
      
      window.history.replaceState(
        {},
        '',
        `/config?${currentParams.toString()}`
      );
      
      // Show success message
      toast.success("Configuration saved successfully");
    } else {
      // Navigate to chat page (for Continue button or non-admins)
      // First, try to get the agent's display name
      try {
        let displayName = "Agent Chat";
        // Try to get the agent information to use its display name
        const agents = await agentApi.getAllAgents(1, 100);
        const selectedAgent = agents.agents.find(agent => agent.assistantId === assistantId);
        if (selectedAgent) {
          displayName = selectedAgent.displayName;
        }
        
        // Navigate with the agent name included
        navigate(`/chat?apiUrl=${encodeURIComponent(apiUrl)}&assistantId=${encodeURIComponent(assistantId)}&agentName=${encodeURIComponent(displayName)}`);
      } catch (error) {
        console.error("Failed to get agent name:", error);
        // Fall back to navigation without agent name
        navigate(`/chat?apiUrl=${encodeURIComponent(apiUrl)}&assistantId=${encodeURIComponent(assistantId)}`);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Successfully logged out");
    localStorage.removeItem(CONFIG_KEYS.API_URL);
    localStorage.removeItem(CONFIG_KEYS.ASSISTANT_ID);
    localStorage.removeItem(CONFIG_KEYS.API_KEY);
    navigate("/");
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <BearHeartIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold tracking-tight">Agent Chat</h1>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="flex flex-col gap-6 p-6 bg-muted/50">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deploymentUrl">
                  Deployment URL<span className="text-rose-500">*</span>
                </Label>
                <p className="text-muted-foreground text-sm">
                  This is the URL of your LangGraph deployment. Can be a local, or
                  production deployment.
                </p>
                <Input
                  id="deploymentUrl"
                  placeholder="Enter your deployment URL"
                  value={apiUrl || ""}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistantId">Assistant</Label>
                <AssistantSelector
                  value={assistantId || ""}
                  onChange={(value) => {
                    console.log('ConfigPage: AssistantSelector onChange called with value:', value);
                    if (value) {
                      // Explicitly set the URL param and update localStorage
                      setAssistantId(value);
                      localStorage.setItem(CONFIG_KEYS.ASSISTANT_ID, value);
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="langsmithApiKey">LangSmith API Key</Label>
                <p className="text-muted-foreground text-sm">
                  This is <strong>NOT</strong> required if using a local LangGraph
                  server. This value is stored in your browser's local storage and
                  is only used to authenticate requests sent to your LangGraph
                  server.
                </p>
                <div className="relative">
                  <Input
                    id="langsmithApiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your LangSmith API key"
                    value={apiKey || ""}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pr-10"
                    disabled={!isAdmin}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Only administrators can modify the API key.
                  </p>
                )}
              </div>

              {isAdmin && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Admin Controls</h3>
                  </div>
                  <AgentManager 
                    apiUrl={apiUrl || DEFAULT_CONFIG[CONFIG_KEYS.API_URL]} 
                  />
                </div>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!apiUrl || !assistantId}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any, true); // Force navigation to chat
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}