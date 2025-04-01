import { Thread } from "@/components/thread";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQueryParam, StringParam } from "use-query-params";
import { useAuth } from "@/providers/Auth";
import { Button } from "@/components/ui/button";
import { CONFIG_KEYS, DEFAULT_CONFIG, getConfig } from "@/lib/config-utils";
import { agentApi } from "@/lib/agent-api";

export function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useQueryParam("apiUrl", StringParam);
  const [assistantId, setAssistantId] = useQueryParam("assistantId", StringParam);
  const [agentName, setAgentName] = useQueryParam("agentName", StringParam);
  const [isConfigValid, setIsConfigValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load config when component mounts
  useEffect(() => {
    async function loadConfig() {
      console.log("ChatPage - Loading config with user role:", user?.role);
      console.log("ChatPage - Current apiUrl:", apiUrl);
      console.log("ChatPage - Current assistantId:", assistantId);
      console.log("ChatPage - Current agentName:", agentName);
      
      try {
        // If we already have URL parameters for API and assistant, proceed
        if (apiUrl && assistantId) {
          console.log("Using existing URL parameters");
          
          // If the agent name is missing, try to fetch it
          if (!agentName && assistantId) {
            try {
              console.log("Fetching agent name for assistant ID:", assistantId);
              const agents = await agentApi.getAllAgents(1, 100);
              const selectedAgent = agents.agents.find(agent => agent.assistantId === assistantId);
              
              if (selectedAgent) {
                console.log("Found agent, setting name:", selectedAgent.displayName);
                setAgentName(selectedAgent.displayName);
                
                // Update URL with the agent name
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set("agentName", selectedAgent.displayName);
                window.history.replaceState({}, "", currentUrl.toString());
              }
            } catch (error) {
              console.error("Error fetching agent name:", error);
              // Continue anyway, it's not critical
            }
          }
          
          setIsConfigValid(true);
          setIsLoading(false);
          return;
        }
        
        // For non-admins who don't have params, use default config
        if (user?.role !== "admin") {
          console.log("Using default configuration for regular user");
          
          // First try to load user's saved config from localStorage
          const savedConfig = localStorage.getItem(`user_config_${user?.id}`);
          
          if (savedConfig) {
            console.log("Loading saved user config from localStorage");
            const config = JSON.parse(savedConfig);
            // Set URL parameters directly
            window.history.replaceState(
              {},
              "",
              `/chat?apiUrl=${encodeURIComponent(config.apiUrl)}&assistantId=${encodeURIComponent(config.assistantId)}`
            );
            // Update state
            setApiUrl(config.apiUrl);
            setAssistantId(config.assistantId);
          } else {
            console.log("Setting default configuration");
            const defaultConfig = getConfig();
            // Set URL parameters directly
            window.history.replaceState(
              {},
              "",
              `/chat?apiUrl=${encodeURIComponent(defaultConfig.apiUrl)}&assistantId=${encodeURIComponent(defaultConfig.assistantId)}`
            );
            // Update state
            setApiUrl(defaultConfig.apiUrl);
            setAssistantId(defaultConfig.assistantId);
            
            // Save this default config for future use
            localStorage.setItem(`user_config_${user?.id}`, JSON.stringify({
              apiUrl: defaultConfig.apiUrl,
              assistantId: defaultConfig.assistantId
            }));
          }
          
          setIsConfigValid(true);
          setIsLoading(false);
          return;
        } else {
          // Admins without config params go to config page
          console.log("Admin user with no config, redirecting to config page");
          navigate("/config");
          return;
        }
      } catch (error) {
        console.error("Failed to load or set config:", error);
        setError("Failed to set up configuration. Please try again or contact support.");
        setIsLoading(false);
      }
    }
    
    loadConfig();
  }, [user, apiUrl, assistantId, agentName, navigate, setApiUrl, setAssistantId, setAgentName]);

  if (!isConfigValid) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary mb-4"></div>
              <p>Loading configuration...</p>
            </div>
          ) : error ? (
            <div>
              <p className="text-red-500 mb-4">{error}</p>
              <Button 
                onClick={() => navigate("/config")}
              >
                Go to Configuration
              </Button>
            </div>
          ) : (
            <p>Redirecting to configuration page...</p>
          )}
        </div>
      </div>
    );
  }
  
  return <Thread />;
}