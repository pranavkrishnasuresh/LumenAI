
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, 
  ScatterChart, Scatter, ZAxis, Cell, Line, ComposedChart, BarChart, Bar, CartesianGrid
} from 'recharts';
import { Book } from '../types';

interface Props {
  onBack: () => void;
}

// Data for Monthly Growth - Jan 24 to Jan 25
const GROWTH_DATA = [
  { name: 'Jan 24', value: 820 },
  { name: 'Feb', value: 835 },
  { name: 'Mar', value: 850 },
  { name: 'Apr', value: 845 },
  { name: 'May', value: 870 },
  { name: 'Jun', value: 890 },
  { name: 'Jul', value: 905 },
  { name: 'Aug', value: 915 },
  { name: 'Sep', value: 930 },
  { name: 'Oct', value: 945 },
  { name: 'Nov', value: 955 },
  { name: 'Dec', value: 960 },
  { name: 'Jan 25', value: 965 },
];

// Data for Lexile vs Error Rate (Correlation)
const CORRELATION_DATA = [
  { name: 'To Kill a Mockingbird', lexile: 870, errorRate: 8, fill: '#10b981' },
  { name: 'Harry Potter & Chamber of Secrets', lexile: 940, errorRate: 15, fill: '#17a1cf' },
  { name: 'The Human Element', lexile: 1020, errorRate: 24, fill: '#f59e0b' },
];

// Mock Line of Best Fit for Lexile vs Error
const REGRESSION_LINE = [
  { lexile: 850, errorRate: 6 },
  { lexile: 1050, errorRate: 28 },
];

// Accuracy Data per Book
const ACCURACY_DATA_MAP: Record<string, { checkpoint: string, score: number }[]> = {
  'hp2': [
    { checkpoint: 'Cp 1', score: 88 },
    { checkpoint: 'Cp 2', score: 72 },
    { checkpoint: 'Cp 3', score: 92 },
  ],
  'human-element': [
    { checkpoint: 'Cp 1', score: 65 },
    { checkpoint: 'Cp 2', score: 78 },
    { checkpoint: 'Cp 3', score: 94 },
    { checkpoint: 'Cp 4', score: 81 },
  ],
  'mockingbird': [
    { checkpoint: 'Cp 1', score: 95 },
    { checkpoint: 'Cp 2', score: 92 },
    { checkpoint: 'Cp 3', score: 88 },
    { checkpoint: 'Cp 4', score: 94 },
    { checkpoint: 'Cp 5', score: 91 },
    { checkpoint: 'Cp 6', score: 68 },
    { checkpoint: 'Cp 7', score: 89 },
    { checkpoint: 'Cp 8', score: 96 },
    { checkpoint: 'Cp 9', score: 92 },
    { checkpoint: 'Cp 10', score: 95 },
  ],
};

const BOOKS_LIST = [
  { id: 'hp2', title: 'Chamber of Secrets' },
  { id: 'human-element', title: 'The Human Element' },
  { id: 'mockingbird', title: 'To Kill a Mockingbird' },
];

const StatsScreen: React.FC<Props> = ({ onBack }) => {
  const [selectedBookId, setSelectedBookId] = useState('hp2');

  const selectedAccuracyData = useMemo(() => {
    return ACCURACY_DATA_MAP[selectedBookId] || [];
  }, [selectedBookId]);

  const getBarColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="flex flex-col h-full bg-background-light overflow-y-auto no-scrollbar pb-32">
      {/* Header */}
      <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background-light/90 backdrop-blur-sm">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5">
          <span className="material-symbols-outlined text-text-primary">arrow_back</span>
        </button>
        <h2 className="text-text-primary text-lg font-bold tracking-tight">Reading Journey</h2>
        <div className="flex h-10 px-3 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 gap-2">
          <span className="material-symbols-outlined text-primary" style={{fontSize: '20px', fontVariationSettings: "'FILL' 1"}}>stars</span>
          <span className="text-xs font-bold text-text-primary">Monthly Insight</span>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-6 pt-2">
        {/* Lexile Hero */}
        <section className="w-full">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-primary-dark shadow-float p-8 text-white">
            <div className="absolute right-[-5%] top-[-10%] h-40 w-40 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
            <div className="flex flex-col gap-1 relative z-10">
              <div className="flex justify-between items-start">
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">Current Proficiency</span>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                  <span className="material-symbols-outlined text-white" style={{fontSize: '14px', fontVariationSettings: "'FILL' 1"}}>keyboard_arrow_up</span>
                  <span className="text-[10px] font-bold">+145 Lexile (YoY)</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h1 className="text-6xl font-black tracking-tighter">965L</h1>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full shadow-[0_0_10px_white]" style={{ width: '75%' }}></div>
                </div>
                <p className="text-white/90 text-xs font-semibold">75% of goal reached for Term 1</p>
              </div>
            </div>
          </div>
        </section>

        {/* Growth Chart - Jan 24 to Jan 25 */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Lexile® Monthly Growth</h3>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10">Jan 24 - Jan 25</span>
          </div>
          <div className="bg-white rounded-[2rem] shadow-soft p-6 border border-gray-100 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_DATA} margin={{ left: -30, right: 10 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#17a1cf" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#17a1cf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 8, fill: '#637f88', fontWeight: 700}} 
                  interval={0}
                />
                <YAxis hide domain={[800, 1000]} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#17a1cf" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorGrowth)"
                  dot={{ r: 3, fill: '#17a1cf', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Lexile Level vs Error Rate Chart */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Complexity Analysis</h3>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Lexile vs Error Rate</span>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] shadow-soft p-6 border border-gray-100 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="lexile" 
                  name="Lexile" 
                  unit="L" 
                  domain={[800, 1100]} 
                  axisLine={false}
                  tickLine={false}
                  tick={{fontSize: 10, fill: '#637f88'}}
                  label={{ value: 'Lexile Level', position: 'bottom', offset: -10, fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="errorRate" 
                  name="Error Rate" 
                  unit="%" 
                  domain={[0, 40]}
                  axisLine={false}
                  tickLine={false}
                  tick={{fontSize: 10, fill: '#637f88'}}
                  label={{ value: 'Error Rate %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                />
                <Scatter name="Books" data={CORRELATION_DATA}>
                  {CORRELATION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
                <Line 
                  data={REGRESSION_LINE} 
                  type="monotone" 
                  dataKey="errorRate" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  dot={false} 
                  activeDot={false} 
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 px-1">
            {CORRELATION_DATA.map(book => (
              <div key={book.name} className="flex items-center gap-1.5">
                <div className="size-2 rounded-full" style={{ backgroundColor: book.fill }}></div>
                <span className="text-[10px] font-bold text-text-secondary truncate max-w-[120px]">{book.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Checkpoint Accuracy with Selector */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Checkpoint Accuracy</h3>
            <select 
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 border-none rounded-lg focus:ring-0 cursor-pointer"
            >
              {BOOKS_LIST.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-[2rem] shadow-soft p-6 border border-gray-100 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedAccuracyData} margin={{ top: 10, bottom: 0, left: -20 }}>
                <XAxis 
                  dataKey="checkpoint" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#637f88', fontWeight: 700}} 
                />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#637f88'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar 
                  dataKey="score" 
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                >
                   {selectedAccuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {selectedAccuracyData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-[2rem]">
                <p className="text-sm font-bold text-text-secondary">No data yet</p>
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-4 px-2">
            <div className="flex items-center gap-1.5">
               <div className="size-2 rounded-full bg-[#10b981]"></div>
               <span className="text-[9px] font-bold text-text-secondary uppercase">Mastered (90+)</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="size-2 rounded-full bg-[#f59e0b]"></div>
               <span className="text-[9px] font-bold text-text-secondary uppercase">On Track (70+)</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="size-2 rounded-full bg-[#ef4444]"></div>
               <span className="text-[9px] font-bold text-text-secondary uppercase">Needs Focus</span>
            </div>
          </div>
        </section>

        {/* Simplified Key Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[2rem] shadow-soft p-6 border border-gray-100 flex flex-col justify-between">
            <div className="size-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
              <span className="material-symbols-outlined" style={{fontSize: '26px', fontVariationSettings: "'FILL' 1"}}>local_fire_department</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-black text-text-primary tabular-nums">8</p>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Day Streak</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-soft p-6 border border-gray-100 flex flex-col justify-between">
            <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <span className="material-symbols-outlined" style={{fontSize: '26px', fontVariationSettings: "'FILL' 1"}}>quiz</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-black text-text-primary tabular-nums">92%</p>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Avg Accuracy</p>
            </div>
          </div>
        </section>

        {/* AI Skill Analysis */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-bold text-text-primary tracking-tight">AI Skill Analysis</h3>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">Lumen Insights</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Character Analysis', score: 94, icon: 'face', color: 'bg-primary', text: 'Mastered' },
              { label: 'Synthesizing Text', score: 65, icon: 'hub', color: 'bg-primary/50', text: 'Developing' }
            ].map((skill) => (
              <div key={skill.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 hover:border-primary/20 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors" style={{fontSize: '18px'}}>{skill.icon}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{skill.label}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${skill.score > 80 ? 'text-primary' : 'text-text-secondary'}`}>{skill.text}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${skill.color} rounded-full`} style={{ width: `${skill.score}%` }}></div>
                  </div>
                  <span className="text-xs font-black text-text-secondary w-10 text-right">{skill.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Standardized 2-Tab Floating Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-30">
        <div className="bg-surface-light/90 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl flex items-center justify-around p-1.5">
          <button 
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 text-text-secondary hover:bg-gray-100 rounded-xl py-3 px-4 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[22px]">book_2</span>
            <span className="text-sm font-semibold">Assignments</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 px-4 shadow-md transition-all duration-300 transform active:scale-95">
            <span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: "'FILL' 1"}}>bar_chart</span>
            <span className="text-sm font-bold">My Stats</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default StatsScreen;
