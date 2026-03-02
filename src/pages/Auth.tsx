import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BrandLogo from "@/components/BrandLogo";
import { Lock, Mail, Eye, EyeOff, UserPlus, LogIn, HelpCircle, X, Send } from "lucide-react";
import { z } from "zod";
import type { User, Session } from "@supabase/supabase-js";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const infoSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
});

const InfoRequestForm = () => {
  const [firstName, setFirstName] = useState("");
  const [infoEmail, setInfoEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const result = infoSchema.safeParse({ firstName, email: infoEmail });
    if (!result.success) {
      setFormError(result.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("info_requests").insert({
        first_name: result.data.firstName,
        email: result.data.email,
      });
      if (error) throw error;
      // Send email notification (fire-and-forget)
      supabase.functions.invoke("send-beta-notification", {
        body: { firstName: result.data.firstName, email: result.data.email },
      }).catch(console.error);
      setSubmitted(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-6 border-t border-border mt-6">
        <p className="text-sm text-primary font-medium">Thanks! We'll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleInfoSubmit} className="pt-6 border-t border-border mt-6 space-y-3">
      <p className="text-xs font-medium text-foreground">Interested? Leave your info.</p>
      <Input
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="h-9 text-sm"
        required
      />
      <Input
        type="email"
        placeholder="Email"
        value={infoEmail}
        onChange={(e) => setInfoEmail(e.target.value)}
        className="h-9 text-sm"
        required
      />
      {formError && <p className="text-xs text-destructive">{formError}</p>}
      <Button type="submit" size="sm" className="w-full" disabled={submitting}>
        <Send className="w-3.5 h-3.5 mr-1.5" />
        {submitting ? "Sending..." : "Send"}
      </Button>
    </form>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setCheckingAuth(false);
        if (session?.user) {
          navigate("/workspace");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setCheckingAuth(false);
      if (session?.user) {
        navigate("/workspace");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    try { emailSchema.parse(email); } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
    }
    try { passwordSchema.parse(password); } catch (e) {
      if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({ title: "Login failed", description: "Invalid email or password. Please try again.", variant: "destructive" });
          } else if (error.message.includes("Email not confirmed")) {
            toast({ title: "Email not verified", description: "Please check your email and verify your account before logging in.", variant: "destructive" });
          } else { throw error; }
          return;
        }
        toast({ title: "Welcome back!", description: "You have been logged in successfully." });
      } else {
        const redirectUrl = `${window.location.origin}/admin`;
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({ title: "Account exists", description: "An account with this email already exists. Please log in instead.", variant: "destructive" });
            setIsLogin(true);
          } else { throw error; }
          return;
        }
        toast({ title: "Account created!", description: "Please check your email to verify your account before logging in." });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <BrandLogo className="h-10 mx-auto mb-6 justify-center" />
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border border-border">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`pl-10 ${errors.email ? "border-destructive" : ""}`} required />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : isLogin ? (
                <><LogIn className="w-4 h-4 mr-2" />Sign In</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Create Account</>
              )}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              What is this?
            </button>
          </div>
        </div>
      </div>

      {/* Info Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${showInfo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowInfo(false)} />
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-out ${showInfo ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="w-8 h-8 bg-primary rounded" />
              <button onClick={() => setShowInfo(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-foreground leading-tight mb-4">
                Personalized landing pages.<br />
                At scale.<br />
                In minutes.
              </h2>

              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Create a unique landing page for every contact on your list. No manual work. No complex setup.
                </p>
                <p>
                  Choose a pre-built template or create one from scratch in a few clicks. Then upload your email list, and the app automatically generates a personalized landing page for each person. Every page is ready to drop into your existing sales or lead-generation campaigns.
                </p>
                <p className="font-medium text-foreground">
                  Launch a full personalized campaign in just a few clicks.
                </p>
              </div>

              <div className="mt-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Now in Beta
                </span>
              </div>
            </div>

            {/* Interest Form */}
            <InfoRequestForm />
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
