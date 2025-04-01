import { CONFIG_KEYS } from "@/lib/config-utils";

/**
 * Debug component that displays current configuration values
 * Only shown in development environment
 */
export function ConfigDebug() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  // Read current configuration state
  const urlParams = new URLSearchParams(window.location.search);
  const apiUrlParam = urlParams.get('apiUrl');
  const assistantIdParam = urlParams.get('assistantId');
  
  const apiUrlLocalStorage = localStorage.getItem(CONFIG_KEYS.API_URL);
  const assistantIdLocalStorage = localStorage.getItem(CONFIG_KEYS.ASSISTANT_ID);
  const apiKeyExists = !!localStorage.getItem(CONFIG_KEYS.API_KEY);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white text-xs rounded shadow-lg z-50">
      <h3 className="font-bold">Config Debug</h3>
      <div className="grid grid-cols-3 gap-1 mt-2">
        <div>Source</div>
        <div>URL Param</div>
        <div>localStorage</div>
        
        <div>apiUrl</div>
        <div>{apiUrlParam || '❌'}</div>
        <div>{apiUrlLocalStorage || '❌'}</div>
        
        <div>assistantId</div>
        <div>{assistantIdParam || '❌'}</div>
        <div>{assistantIdLocalStorage || '❌'}</div>
        
        <div>apiKey</div>
        <div>-</div>
        <div>{apiKeyExists ? '✅' : '❌'}</div>
      </div>
    </div>
  );
} 