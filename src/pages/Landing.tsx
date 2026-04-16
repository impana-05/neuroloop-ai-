import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Brain, Zap, Target, BarChart3, ArrowRight, Sparkles, AlertCircle, X, Loader2 } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

export default function Landing() {
  const { signIn, isSigningIn, authError, clearError } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-text overflow-hidden relative">
      {/* Auth Error Toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-start gap-3 shadow-2xl shadow-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-500 mb-1">Authentication Error</p>
                <p className="text-xs text-text-muted leading-relaxed">{authError}</p>
              </div>
              <button onClick={clearError} className="text-text-muted hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-accent to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">NeuroLoop AI</span>
        </div>
        <button 
          onClick={signIn}
          disabled={isSigningIn}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-border rounded-full text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSigningIn ? "Signing In..." : "Sign In"}
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-bold mb-6">
            <Sparkles className="w-3 h-3" />
            Next-Gen Adaptive Learning
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
            Master Any Subject <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-accent to-purple-400">
              Through Neural Loops
            </span>
          </h1>
          <p className="text-xl text-text-muted mb-10 max-w-lg leading-relaxed">
            Transform static content into an intelligent, evolving learning experience that adapts to your cognitive profile in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={signIn}
              disabled={isSigningIn}
              className="px-8 py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              {isSigningIn ? "Initializing..." : "Start Learning Loop"}
            </button>
            <button 
              onClick={signIn}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-border text-text font-bold rounded-2xl transition-all"
            >
              Explore Neural Library
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="glass-panel p-8 relative z-10 glow-accent">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Neural Sync</p>
                  <p className="text-sm font-bold">Cognitive Profile Active</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            
            <div className="space-y-6">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="h-full bg-accent"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-white/5 rounded-xl border border-border" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24 border-t border-border">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-yellow-400" />}
            title="Adaptive Difficulty"
            description="AI continuously monitors your retention and adjusts complexity to keep you in the flow state."
          />
          <FeatureCard 
            icon={<Brain className="w-6 h-6 text-accent" />}
            title="Neural Mapping"
            description="Visualize your knowledge graph and identify cognitive gaps before they become blockers."
          />
          <FeatureCard 
            icon={<Target className="w-6 h-6 text-success" />}
            title="Spaced Repetition"
            description="Optimized review cycles based on behavioral learning science for maximum long-term mastery."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-8 hover:bg-white/5 transition-all group">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-text-muted leading-relaxed text-sm">{description}</p>
    </div>
  );
}
