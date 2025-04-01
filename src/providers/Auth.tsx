import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: string;
  username: string;
  name?: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:4000/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get token from localStorage
        const storedToken = localStorage.getItem("auth_token");
        
        if (storedToken) {
          // Validate token by fetching user info
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setToken(storedToken);
            setUser(data.user);
          } else {
            // Token is invalid or expired, remove it
            localStorage.removeItem("auth_token");
          }
        }
      } catch (error) {
        console.error("Failed to initialize authentication:", error);
        localStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      
      // Store token in localStorage
      localStorage.setItem("auth_token", data.token);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // Call logout endpoint
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear user data and token
      setToken(null);
      setUser(null);
      localStorage.removeItem("auth_token");
    }
  };

  // Setup fetch interceptor for authentication
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (input, init) => {
      // Only add auth header for API requests
      if (token && typeof input === "string" && input.startsWith(API_URL)) {
        init = init || {};
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${token}`
        };
      }
      
      try {
        const response = await originalFetch(input, init);
        
        // Handle 401 Unauthorized responses
        if (response.status === 401) {
          // If it's an auth endpoint, let the caller handle it
          if (typeof input === "string" && !input.includes("/auth/")) {
            logout();
          }
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};