import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryParam, StringParam } from "use-query-params";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { CONFIG_KEYS, DEFAULT_CONFIG, getConfig } from "@/lib/config-utils";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const { getThreads, setThreads } = useThreads();
  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    onCustomEvent: (event, options) => {
      options.mutate((prev) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui };
      });
    },
    onThreadId: (id) => {
      setThreadId(id);
      // Refetch threads list when thread ID changes.
      // Wait for some seconds before fetching so we're able to get the new thread that was created.
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code> and
              your API key is correctly set (if connecting to a deployed graph).
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 1. Access URL parameters
  const [urlApiUrl, setUrlApiUrl] = useQueryParam("apiUrl", StringParam);
  const [urlAssistantId, setUrlAssistantId] = useQueryParam("assistantId", StringParam);
  
  const [apiKey, _setApiKey] = useState(() => {
    const config = getConfig();
    return config.apiKey;
  });

  const setApiKey = (key: string) => {
    window.localStorage.setItem(CONFIG_KEYS.API_KEY, key);
    _setApiKey(key);
  };
  
  // Store resolved values in state so we don't recalculate on every render
  const [resolvedConfig, setResolvedConfig] = useState({
    apiUrl: "",
    assistantId: "",
  });
  
  // Effect to resolve configuration once on mount and when URL params change
  useEffect(() => {
    // Get from URL first
    let resolvedApiUrl = urlApiUrl;
    let resolvedAssistantId = urlAssistantId;
    
    // If not in URL, try localStorage
    if (!resolvedApiUrl) {
      resolvedApiUrl = localStorage.getItem(CONFIG_KEYS.API_URL);
      // If we find it in localStorage but not in URL, update URL (in a separate effect)
      if (resolvedApiUrl && !urlApiUrl) {
        setUrlApiUrl(resolvedApiUrl);
      }
    }
    
    if (!resolvedAssistantId) {
      resolvedAssistantId = localStorage.getItem(CONFIG_KEYS.ASSISTANT_ID);
      if (resolvedAssistantId && !urlAssistantId) {
        setUrlAssistantId(resolvedAssistantId);
      }
    }
    
    // Fall back to defaults as last resort
    if (!resolvedApiUrl) {
      resolvedApiUrl = DEFAULT_CONFIG[CONFIG_KEYS.API_URL];
      localStorage.setItem(CONFIG_KEYS.API_URL, resolvedApiUrl);
      
      // Only update URL if we had to use default (separate effect will handle this)
      if (!urlApiUrl) {
        setUrlApiUrl(resolvedApiUrl);
      }
    }
    
    if (!resolvedAssistantId) {
      resolvedAssistantId = DEFAULT_CONFIG[CONFIG_KEYS.ASSISTANT_ID];
      localStorage.setItem(CONFIG_KEYS.ASSISTANT_ID, resolvedAssistantId);
      
      // Only update URL if we had to use default (separate effect will handle this)
      if (!urlAssistantId) {
        setUrlAssistantId(resolvedAssistantId);
      }
    }
    
    // Store resolved values in state
    setResolvedConfig({
      apiUrl: resolvedApiUrl,
      assistantId: resolvedAssistantId,
    });
    
    console.log("StreamProvider - Resolved configuration:", {
      resolvedApiUrl,
      resolvedAssistantId
    });
    
    // Log API key status (present/missing)
    console.log("StreamProvider - API key status:", apiKey ? "present" : "missing");
    
    // Log the values to help debug
    console.log("StreamProvider - URL apiUrl:", urlApiUrl);
    console.log("StreamProvider - URL assistantId:", urlAssistantId);
    console.log("StreamProvider - Resolved apiUrl:", resolvedApiUrl);
    console.log("StreamProvider - Resolved assistantId:", resolvedAssistantId);
  }, [urlApiUrl, urlAssistantId, setUrlApiUrl, setUrlAssistantId, apiKey]);

  if (!resolvedConfig.apiUrl || !resolvedConfig.assistantId) {
    // This should almost never happen now with our fallback mechanism
    console.log("StreamProvider - Missing configuration despite fallbacks, returning children");
    return <>{children}</>;
  }

  return (
    <StreamSession apiKey={apiKey} apiUrl={resolvedConfig.apiUrl} assistantId={resolvedConfig.assistantId}>
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
