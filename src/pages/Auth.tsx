import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Film, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setNetworkError(false);
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName || email.split("@")[0],
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Welcome to Dragon AI!",
          description: "Your account has been created. Redirecting to dashboard...",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      let message = "An error occurred during authentication";
      const isNetworkIssue = error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError");
      
      if (isNetworkIssue) {
        message = "Unable to connect to the server. Please check your connection and try again.";
        setNetworkError(true);
      } else if (error.message?.includes("User already registered")) {
        message = "This email is already registered. Please sign in instead.";
      } else if (error.message?.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      } else if (error.message?.includes("Email not confirmed")) {
        message = "Please check your email and confirm your account before signing in.";
      } else if (error.message) {
        message = error.message;
      }
      toast({
        title: "Authentication Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 film-grain">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <Film className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-display text-gradient-gold tracking-wider">
                DRAGON AI
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">
                Filmmaking Companion
              </p>
            </div>
          </motion.div>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-cinematic rounded-xl p-8"
        >
          <h2 className="text-2xl font-semibold text-center mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin
              ? "Sign in to continue your filmmaking journey"
              : "Join the Knight's Vision ecosystem"}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-muted/50 border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="director@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted/50 border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>{isLogin ? "Sign In" : "Create Account"}</>
              )}
            </Button>

            {networkError && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAuth()}
                className="w-full mt-2 border-primary/50 text-primary hover:bg-primary/10"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Part of the Knight's Vision Ecosystem
        </p>
      </motion.div>
    </div>
  );
}
