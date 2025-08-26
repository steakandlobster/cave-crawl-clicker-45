import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "@/components/WalletProvider";
import { SiweAuthProvider } from "@/contexts/SiweAuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Exploration from "./pages/Exploration";
import GameOver from "./pages/GameOver";
import Victory from "./pages/Victory";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <SiweAuthProvider>
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
      </SiweAuthProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
