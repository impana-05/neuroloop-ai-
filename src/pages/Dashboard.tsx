import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Brain, Zap, Target, Clock, TrendingUp, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useAuth } from "../lib/AuthContext";
import { cn } from "@/src/lib/utils";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Link } from "react-router-dom";
import { aiService } from "../lib/ai";
import { Send } from "lucide-react";

const data = [
  { name: 'Mon', score: 40 },
  { name: 'Tue', score: 30 },
  { name: 'Wed', score: 65 },
  { name: 'Thu', score: 45 },
  { name: 'Fri', score: 80 },
  { name: 'Sat', score: 70 },
  { name: 'Sun', score: 90 },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setIsAsking(true);
    setAiResponse("");
    try {
      const response = await aiService.askGemini(aiQuestion);
      setAiResponse(response);
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Sorry, I'm having trouble connecting to my neural network.");
    } finally {
      setIsAsking(false);
    }
  };

  useEffect(() => {
    const fetchContents = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "contents"), 
          where("userId", "==", user.uid),
          where("deleted", "==", false)
        );
        const querySnapshot = await getDocs(q);
        const fetchedContents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setContents(fetchedContents);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "contents");
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [user]);

  const handleDelete = async (contentId: string) => {
    try {
      const contentRef = doc(db, "contents", contentId);
      await updateDoc(contentRef, { deleted: true });
      setContents(contents.filter(c => c.id !== contentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contents/${contentId}`);
    }
  };

  const accuracy = profile?.stats.totalQuizzes 
    ? Math.round((profile.stats.correctAnswers / (profile.stats.totalQuizzes * 5)) * 100) 
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back, {profile?.displayName?.split(' ')[0] || "Architect"}</h1>
          <p className="text-text-muted text-sm">Your neural model synchronized 12m ago.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full text-success text-xs font-bold">
          <div className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          Adaptive Engine Active
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Zap className="w-5 h-5 text-yellow-400" />} label="XP Earned" value={profile?.xp.toLocaleString() || "0"} trend="+12%" />
        <StatCard icon={<Target className="w-5 h-5 text-accent" />} label="Accuracy" value={`${accuracy}%`} trend="+5%" />
        <StatCard icon={<Clock className="w-5 h-5 text-blue-400" />} label="Study Time" value={`${profile?.stats.timeSpent || 0}h`} trend="+2h" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-success" />} label="Mastery" value="68%" trend="+8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Learning Loop */}
        <div className="lg:col-span-2 glass-panel p-8 relative overflow-hidden">
          <div className="pulse-ring" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6">Current Learning Loop</h2>
          
          <div className="space-y-4 mb-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
            ) : contents.length > 0 ? (
              contents.map((content) => (
                <TopicCard 
                  key={content.id}
                  id={content.id}
                  title={content.title} 
                  subtitle={`${content.concepts?.length || 0} Concepts Identified`} 
                  mastery={Math.floor(Math.random() * 60) + 30} // Mock mastery for now
                  onDelete={() => handleDelete(content.id)}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-white/3 border border-dashed border-border rounded-xl">
                <p className="text-text-muted text-sm mb-4">No active neural paths detected.</p>
                <Link to="/upload" className="text-accent font-bold hover:underline text-sm">Initialize New Path</Link>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6">Performance Trend</h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D0D10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Neural Assistant</h2>
            <form onSubmit={handleAskGemini} className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask about NeuroLoop..." 
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors pr-10"
                />
                <button 
                  type="submit"
                  disabled={isAsking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-accent hover:text-accent/80 disabled:text-text-muted transition-colors"
                >
                  {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {aiResponse && (
                <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl text-xs leading-relaxed text-text-muted animate-in fade-in slide-in-from-top-2">
                  {aiResponse}
                </div>
              )}
            </form>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Cognitive Load</h2>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-light tracking-tighter">4.2</span>
              <span className="text-sm text-text-muted">Optimal</span>
            </div>
            <p className="text-xs text-text-muted">Retention peak predicted at 16:30</p>
          </div>

          <div className="glass-panel p-6 bg-linear-to-br from-accent/5 to-transparent">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Spaced Repetition</h2>
            <p className="text-xl font-medium mb-1">12 Concepts Due</p>
            <p className="text-xs text-text-muted">Priority: Advanced Concurrency Patterns, JWT Security</p>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Neural Weak Points</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-red-400">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Garbage Collection Tuning
              </li>
              <li className="flex items-center gap-2 text-sm text-red-400">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                B-Tree Indexing
              </li>
              <li className="flex items-center gap-2 text-sm text-red-400">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                OAuth2 Flow
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-lg">{trend}</span>
      </div>
      <p className="text-text-muted text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  );
}

const TopicCard: React.FC<{ id: string, title: string, subtitle: string, mastery: number, onDelete: () => void | Promise<void> }> = ({ id, title, subtitle, mastery, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white/3 border border-border rounded-xl group hover:bg-white/5 transition-all">
      <div className="flex items-center gap-4">
        <button 
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <Link to={`/quiz?id=${id}`} className="block">
          <h3 className="text-sm font-bold mb-0.5 group-hover:text-accent transition-colors">{title}</h3>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </Link>
      </div>
      <div className="text-right">
        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
          <div 
            className="h-full bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            style={{ width: `${mastery}%` }} 
          />
        </div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{mastery}% Mastery</p>
      </div>
    </div>
  );
};
