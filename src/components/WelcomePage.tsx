import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LangGraphLogoSVG, BearHeartIcon } from "@/components/icons/langgraph";
import { LoginForm } from "@/components/LoginForm";
import { useAuth } from "@/providers/Auth";
import { Navigate } from "react-router-dom";

export function WelcomePage() {
  const { isAuthenticated, user } = useAuth();
  
  // If already logged in, redirect based on role
  if (isAuthenticated) {
    if (user?.role === "admin") {
      return <Navigate to="/config" replace />;
    } else {
      return <Navigate to="/chat" replace />;
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="max-w-lg p-8">
        <div className="flex flex-col items-center justify-center gap-4 p-6 bg-white rounded-lg shadow-md text-center">
          <BearHeartIcon width={64} height={64} />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Agent Chat</h1>
          <p className="mb-6 text-muted-foreground text-center">
            Interact with HCM AI assistants through an intuitive interface. 
          </p>
          
          <div className="mb-8 border-t pt-6">
            <h2 className="text-xl font-medium mb-4 text-center">Log in to continue</h2>
            <LoginForm />
          </div>
        </div>
      </Card>
    </div>
  );
}