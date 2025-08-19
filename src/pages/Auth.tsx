import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameHeader } from "@/components/GameHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authSub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/", { replace: true });
    });
    return () => authSub.subscription.unsubscribe();
  }, [navigate]);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { username },
        },
      });
      if (error) throw error;
      toast({ title: "Check your email", description: "Confirm the sign up to continue." });
    } catch (e: any) {
      toast({ title: "Sign up failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Update last login
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
      }
      navigate("/", { replace: true });
    } catch (e: any) {
      toast({ title: "Sign in failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cave-background">
      <div className="relative z-10">
        <GameHeader />
        <div className="container mx-auto px-4 pt-24 pb-16 relative z-10 ml-96">
          <div className="max-w-md mx-auto">
            <Card className="p-6">
              <h1 className="text-2xl font-bold mb-4">{mode === "signin" ? "Sign In" : "Create Account"}</h1>
              {mode === "signup" && (
                <div className="mb-4">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Explorer123" />
                </div>
              )}
              <div className="mb-4">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="mb-6">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button className="w-full" variant="treasure" disabled={loading} onClick={mode === "signin" ? handleSignin : handleSignup}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
              </Button>
              <div className="text-sm text-center mt-4">
                {mode === "signin" ? (
                  <button className="underline" onClick={() => setMode("signup")}>Need an account? Sign up</button>
                ) : (
                  <button className="underline" onClick={() => setMode("signin")}>Have an account? Sign in</button>
                )}
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">
                After signing in you'll be redirected to start your game.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
