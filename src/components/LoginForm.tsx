import { useState, useEffect } from "react";
import { useAuth } from "@/providers/Auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useNavigate, useLocation } from "react-router-dom";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page they were trying to access
  const from = location.state?.from?.pathname || "/config";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      await login(username, password);
      // Login successful, but let the useEffect handle redirection
      setIsRedirecting(true);
    } catch (err) {
      setError("Invalid username or password");
    }
  };
  
  // Handle redirection after successful login 
  useEffect(() => {
    if (user && !isLoading) {
      setTimeout(() => {
        if (from !== "/" && from !== "/config") {
          // Honor the original destination if it's not the login or config page
          navigate(from, { replace: true });
        } else if (user.role === "admin") {
          navigate("/config", { replace: true });
        } else {
          navigate("/chat", { replace: true });
        }
      }, 100); // Small delay to ensure auth state is properly updated
    }
  }, [user, isLoading, navigate, from]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full min-w-[300px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full min-w-[300px]"
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}