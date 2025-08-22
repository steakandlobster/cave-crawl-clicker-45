import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WalletProvider } from "@/components/WalletProvider";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Exploration from "./pages/Exploration";
import GameOver from "./pages/GameOver";
import Victory from "./pages/Victory";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // For wallet-based auth, we'll use a simple connected check
    // In a real implementation, you might want to verify wallet signature
    const checkWalletConnection = () => {
      // Check if there's a connected wallet (this is a simple implementation)
      // You could enhance this to check for signed messages, etc.
      const hasWallet = window.ethereum;
      setIsAuthed(!!hasWallet);
      setLoading(false);
    };

    checkWalletConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthed) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/game" element={<RequireAuth><Game /></RequireAuth>} />
            <Route path="/exploration" element={<RequireAuth><Exploration /></RequireAuth>} />
            <Route path="/game-over" element={<RequireAuth><GameOver /></RequireAuth>} />
            <Route path="/victory" element={<RequireAuth><Victory /></RequireAuth>} />
            <Route path="/wallet" element={<RequireAuth><Wallet /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
