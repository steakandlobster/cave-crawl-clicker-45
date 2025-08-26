import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useSiweAuth } from "@/contexts/SiweAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isConnected } = useAccount();
  const { isAuthenticated, isLoading } = useSiweAuth();

  // Clear any conflicting Supabase sessions since we're using SIWE
  useEffect(() => {
    const clearConflictingSessions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !isAuthenticated) {
          // Only clear if SIWE is not authenticated to avoid conflicts
          await supabase.auth.signOut();
          console.log("Cleared conflicting Supabase session for SIWE auth");
        }
      } catch (error) {
        console.log("Session cleanup handled:", error);
      }
    };
    
    clearConflictingSessions();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Require both wallet connection and SIWE authentication
  if (!isConnected || !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}