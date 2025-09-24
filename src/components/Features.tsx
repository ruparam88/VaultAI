import { Zap, Shield, Users, Sparkles } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Experience unprecedented speed with our optimized architecture and cutting-edge technology."
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Your data is protected with enterprise-grade security and privacy-first principles."
  },
  {
    icon: Users,
    title: "Built for Teams",
    description: "Seamless collaboration tools that bring teams together, no matter where they are."
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Intelligent features that learn from your usage and adapt to your workflow."
  }
];

const Features = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why You'll Love It
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're building something extraordinary. Here's what makes our app different.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;