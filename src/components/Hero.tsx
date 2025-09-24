import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupCount, setSignupCount] = useState<number>(0);
  const { toast } = useToast();

  // Fetch current signup count
  useEffect(() => {
    const fetchSignupCount = async () => {
      const { count, error } = await supabase
        .from('email_signups')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setSignupCount(count);
      }
    };
    
    fetchSignupCount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('email_signups')
        .insert([{ 
          email: email.toLowerCase().trim(),
          ip_address: null, // Could be populated with actual IP if needed
          user_agent: navigator.userAgent 
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already registered!",
            description: "This email is already on our waitlist.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        setSignupCount(prev => prev + 1);
        toast({
          title: "Thanks for joining!",
          description: "We'll notify you when we launch.",
        });
        setEmail("");
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-hero">
        <img 
          src={heroImage} 
          alt="Tech background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              The Future of
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Innovation</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Be the first to experience our revolutionary app that's changing how people connect, create, and collaborate.
            </p>
          </div>

          {/* Email signup form */}
          <div className="max-w-md mx-auto">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-background/80 backdrop-blur-sm border-border/50"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="h-12 px-8"
                  disabled={isLoading}
                >
                  {isLoading ? "Joining..." : "Get Early Access"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="text-lg font-medium">You're on the list!</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>{signupCount.toLocaleString()} early users</span>
            </div>
            <span>•</span>
            <span>Launching Q1 2025</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;