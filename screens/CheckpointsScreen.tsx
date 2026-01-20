
import React from 'react';
import { Book, Checkpoint } from '../types';

interface Props {
  book: Book;
  onBack: () => void;
  onStartReflection: () => void;
}

const CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    title: 'Checkpoint 1',
    chapters: 'Chapters 1-5',
    description: 'Setting the scene and introducing key character developments.',
    status: 'done'
  },
  {
    id: 2,
    title: 'Checkpoint 2',
    chapters: 'Chapters 6-10',
    description: 'The plot thickens. Key conflicts arise in this section.',
    status: 'active'
  },
  {
    id: 3,
    title: 'Checkpoint 3',
    chapters: 'Chapters 11-15',
    description: 'Deepening themes and character arcs.',
    status: 'locked'
  },
  {
    id: 4,
    title: 'Checkpoint 4',
    chapters: 'Chapters 16-20',
    description: 'Heading towards the climax of the narrative.',
    status: 'locked'
  }
];

const CheckpointsScreen: React.FC<Props> = ({ book, onBack, onStartReflection }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button onClick={onBack} className="text-text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="flex flex-col items-center max-w-[200px]">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Current Read</span>
            <h2 className="text-text-primary text-lg font-bold leading-tight tracking-tight truncate w-full text-center">{book.title}</h2>
          </div>
          <button className="text-text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4">
        <p className="text-text-secondary text-sm font-medium leading-relaxed text-center mb-6 px-4">
          Complete each checkpoint after reading the assigned section to unlock the next reflection.
        </p>

        {/* Progress Card */}
        <div className="mb-8 flex flex-col gap-2 bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
          <div className="flex gap-6 justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">Reading Progress</span>
              <span className="text-text-primary text-2xl font-black">{book.progress}% <span className="text-sm font-medium text-text-secondary">Complete</span></span>
            </div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            </div>
          </div>
          <div className="rounded-full bg-gray-100 h-3 overflow-hidden">
            <div className="h-full rounded-full bg-primary relative transition-all duration-1000" style={{ width: `${book.progress}%` }}>
              <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Checkpoints List */}
        <div className="flex flex-col gap-5 relative pb-10 px-2">
          <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-gray-100 rounded-full -z-10"></div>

          {CHECKPOINTS.map((cp) => (
            <div key={cp.id} className="group relative">
              <div className="flex gap-4 items-start">
                <div className="shrink-0 pt-3 relative z-10">
                  {cp.status === 'done' ? (
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center shadow-md ring-[6px] ring-background-light">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontWeight: 900 }}>check</span>
                    </div>
                  ) : cp.status === 'active' ? (
                    <div className="size-6 rounded-full bg-white border-[3px] border-primary flex items-center justify-center shadow-glow ring-[6px] ring-background-light">
                      <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center ring-[6px] ring-background-light">
                      <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '14px' }}>lock</span>
                    </div>
                  )}
                </div>

                <div className={`flex-1 p-6 rounded-[2rem] transition-all duration-300 ${
                  cp.status === 'active' 
                    ? 'bg-white shadow-float border border-primary/20 scale-[1.02]' 
                    : 'bg-white/60 border border-gray-100 opacity-80'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-text-primary text-lg font-black tracking-tight">{cp.title}</p>
                    {cp.status === 'done' && (
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">Done</span>
                    )}
                  </div>
                  <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-2 ${cp.status === 'active' ? 'text-primary' : 'text-text-secondary'}`}>
                    {cp.chapters}
                  </p>
                  <p className="text-text-secondary text-sm font-medium leading-relaxed mb-5">
                    {cp.description}
                  </p>
                  {cp.status === 'active' && (
                    <button 
                      onClick={onStartReflection}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-dark active:scale-[0.98] text-white py-4 px-4 text-sm font-bold shadow-lg shadow-primary/30 transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>play_circle</span>
                      Start AI Reflection
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Consistent Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-30">
        <div className="bg-surface-light/90 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl flex items-center justify-around p-1.5">
          <button 
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 px-4 shadow-md transition-all duration-300 transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: "'FILL' 1"}}>book_2</span>
            <span className="text-sm font-bold">Assignments</span>
          </button>
          <button 
            onClick={onBack} 
            className="flex-1 flex items-center justify-center gap-2 text-text-secondary hover:bg-gray-100 rounded-xl py-3 px-4 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[22px]">bar_chart</span>
            <span className="text-sm font-semibold">My Stats</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CheckpointsScreen;
