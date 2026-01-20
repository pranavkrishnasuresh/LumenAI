
import React from 'react';
import { Book } from '../types';

interface Props {
  onSelectBook: (book: Book) => void;
  onNavigateStats: () => void;
}

const BOOKS: Book[] = [
  {
    id: 'hp2',
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling',
    category: 'Fiction',
    lexile: '940L',
    progress: 60,
    currentCheckpoint: 3,
    totalCheckpoints: 5,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9-_ng-wk33UByKE-ZacnkQ0PwcuMtZXuPd0pqY0TxYVEFJNDhQpjORhs-Q2zkLSsxBSb9jmggnsZ1ycggR48hSkh7P7LDjvTYOnEXLFa4Hr4U-IaHel5PNwvsZmRxARWeKBUqbm7iRC3vfBg_qSYgZNFlG6wMXBAKK4Kg-BfkKsHS6mkDyzBhlh10mBMKMjdura4VhZ-_xxdouocxp_scfJ47DSYZIvm04VGVvjvSsf6oFZwHfFJDJZ_UNhyAqzTFr6V7zh9N6Kls',
    status: 'in-progress'
  },
  {
    id: 'human-element',
    title: 'The Human Element',
    author: 'Lorne Holyoak',
    category: 'Science',
    lexile: '1020L',
    progress: 0,
    currentCheckpoint: 0,
    totalCheckpoints: 4,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWbeQTkMwn668DwdXdNTtn0CloeuX02aAH36_AdCkOAXNevFthFbzkoal1V1ZWv5CUc-kgQJB4wVPd3gETaK8GMvR3f6L6wzUT3012OM3EIBYk4qZls3pn37-0Au9TpB77uQu3kxtyh3KsRf_QsxHGOhZhe7-GAdRIsk8BQy68qOQaJ5Xu8N3SMGRqN8LAaHwJUY46SuFsMtGgVtZ7uNr3SKCJFrLZToFe_iu3K2equO1f_uK9xCgTDPtsVypvQVD6JGk687uaiap1',
    status: 'not-started'
  },
  {
    id: 'mockingbird',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Classic',
    lexile: '870L',
    progress: 100,
    currentCheckpoint: 10,
    totalCheckpoints: 10,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9TL84D__r5PrJl_Zmnau_W3L7sw6eBTFgJy7QT1octugcBw2-dL1WWeSNHGoZvHaom4pKL-YvnH0L_2jETrO2T8R6iRnSF7QcWmSc--Tt3jOIdzVlj5R5WwC9J93HIFmSMNhEwwKl2ChtTLh4k59WrG-cfAJQEQ2N_PzTqEqzOfpE9vEQKjmXezMZ8RIvxRpgi4vpxV5OpfQ7XGkLrYr22QEjjYuad7waEgtwFGEMCbpmSjDvSn6U2VhPCth3n-d4LtGAQL1pjEu_',
    status: 'completed',
    score: 92
  }
];

const AssignmentsScreen: React.FC<Props> = ({ onSelectBook, onNavigateStats }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background-light/80 backdrop-blur-md px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Lumen AI</h1>
          </div>
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7W-ajemhCsYvu7C6esswyTZomZZwhZsa5dmatLpBj3l3StOMOr2MnZVPc9PXG7Y08AJsC2bjTd7-t41rZGnBK0Za0U2VPwvJc3z8NVkBewJmpNlYMtmy5y9bo6fLjUWks9WP26mvfvJ9qlMBFdakd-t8XLiXJCqYzDYxygYAXna9nv-kcZvAU0dvlEampGMzgr1PT0M-uWXeTDIubcwDNz-i-B06z6ghH7TjxrcelDp1lL4wbG70VnyXOsGtGXrO_3g6tRX8Mmnh9" 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-4 pb-2">
        <h2 className="text-[32px] leading-[1.1] font-bold text-text-primary tracking-tight mb-2">Assignments</h2>
        <p className="text-text-secondary text-lg font-medium leading-relaxed">
          Keep up the great reading, Alex! You're on a roll this week.
        </p>
      </section>

      {/* Book Cards */}
      <section className="flex flex-col gap-5 px-6 pt-6">
        {BOOKS.map((book) => (
          <article 
            key={book.id} 
            onClick={() => onSelectBook(book)}
            className={`group relative flex flex-col bg-surface-light rounded-2xl p-5 shadow-soft hover:shadow-float transition-all duration-300 border border-transparent cursor-pointer active:scale-[0.98] ${book.status === 'completed' ? 'opacity-80' : ''}`}
          >
            <div className="flex gap-5">
              <div className={`relative shrink-0 w-[90px] aspect-[2/3] rounded-lg overflow-hidden shadow-md ${book.status === 'completed' ? 'grayscale' : ''}`}>
                <img src={book.coverImage} className="h-full w-full object-cover" alt={book.title} />
                {book.status === 'completed' && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">check_circle</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 justify-between py-1">
                <div>
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${book.status === 'not-started' ? 'bg-gray-100 text-text-secondary' : 'bg-primary/10 text-primary'}`}>
                      {book.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary">
                      <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>local_library</span>
                      {book.lexile}
                    </span>
                  </div>
                  <h3 className={`mt-2 text-lg font-bold text-text-primary leading-tight line-clamp-2 ${book.status === 'completed' ? 'line-through decoration-primary/50' : ''}`}>
                    {book.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-text-secondary">
                    {book.author}
                  </p>
                </div>
                {book.status === 'not-started' && (
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                      <span className="text-xs font-medium">0 of {book.totalCheckpoints} checkpoints</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </div>
                  </div>
                )}
                {book.status === 'completed' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                      COMPLETED
                    </span>
                    <span className="text-xs text-text-secondary">Score: {book.score}%</span>
                  </div>
                )}
              </div>
            </div>

            {book.status === 'in-progress' && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-end justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">In Progress</span>
                    <span className="text-sm font-medium text-text-primary">Checkpoint {book.currentCheckpoint} of {book.totalCheckpoints}</span>
                  </div>
                  <span className="text-2xl font-bold text-text-primary tabular-nums tracking-tight">{book.progress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full relative" style={{ width: `${book.progress}%` }}>
                    <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-30">
        <div className="bg-surface-light/90 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl flex items-center justify-around p-1.5">
          <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 px-4 shadow-md transition-all duration-300 transform active:scale-95">
            <span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: "'FILL' 1"}}>book_2</span>
            <span className="text-sm font-bold">Assignments</span>
          </button>
          <button 
            onClick={onNavigateStats}
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

export default AssignmentsScreen;
