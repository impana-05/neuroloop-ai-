import React from "react";
import { motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Brain, Target, Clock, Zap, Award, BookOpen } from "lucide-react";

const radarData = [
  { subject: 'Memory', A: 120, fullMark: 150 },
  { subject: 'Logic', A: 98, fullMark: 150 },
  { subject: 'Speed', A: 86, fullMark: 150 },
  { subject: 'Focus', A: 99, fullMark: 150 },
  { subject: 'Retention', A: 85, fullMark: 150 },
  { subject: 'Application', A: 65, fullMark: 150 },
];

const pieData = [
  { name: 'Mastered', value: 400 },
  { name: 'Learning', value: 300 },
  { name: 'Weak', value: 150 },
];

const COLORS = ['#6366F1', '#8b5cf6', '#ef4444'];

export default function Analytics() {
  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold mb-2">Cognitive Analytics</h1>
        <p className="text-text-muted">Deep insights into your neural performance and mastery distribution.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cognitive Profile */}
        <div className="glass-panel p-8 relative overflow-hidden">
          <div className="pulse-ring" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-8 flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            Neural Profile
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.4)" fontSize={10} fontWeight="bold" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="none" tick={false} />
                <Radar
                  name="User"
                  dataKey="A"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mastery Distribution */}
        <div className="glass-panel p-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-8 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-400" />
            Mastery Distribution
          </h3>
          <div className="h-[350px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-6 pr-8">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.name}</p>
                    <p className="text-lg font-bold">{item.value} Nodes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-panel p-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-8 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          Neural Milestones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AchievementCard 
            title="Fast Learner" 
            description="Completed 5 modules with 90%+ accuracy in one cycle."
            date="Oct 12, 2023"
            icon={<Zap className="w-5 h-5 text-yellow-400" />}
          />
          <AchievementCard 
            title="Deep Diver" 
            description="Spent over 10 hours mastering a single complex neural node."
            date="Oct 15, 2023"
            icon={<BookOpen className="w-5 h-5 text-accent" />}
          />
          <AchievementCard 
            title="Consistency King" 
            description="Maintained a 14-day neural synchronization streak."
            date="Active"
            icon={<Clock className="w-5 h-5 text-success" />}
          />
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ title, description, date, icon }: { title: string, description: string, date: string, icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-white/3 border border-border rounded-2xl flex gap-4 hover:bg-white/5 transition-all">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-border">
        {icon}
      </div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-xs text-text-muted mb-3 leading-relaxed">{description}</p>
        <span className="text-[9px] uppercase tracking-widest font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">{date}</span>
      </div>
    </div>
  );
}
