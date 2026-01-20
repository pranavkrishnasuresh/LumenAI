
import React, { useState } from 'react';
import AssignmentsScreen from './screens/AssignmentsScreen';
import CheckpointsScreen from './screens/CheckpointsScreen';
import ReflectionScreen from './screens/ReflectionScreen';
import StatsScreen from './screens/StatsScreen';
import { Screen, Book } from './types';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('assignments');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const navigateToBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentScreen('checkpoints');
  };

  const startReflection = () => {
    setCurrentScreen('reflection');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'assignments':
        return <AssignmentsScreen onSelectBook={navigateToBook} onNavigateStats={() => setCurrentScreen('stats')} />;
      case 'checkpoints':
        return <CheckpointsScreen book={selectedBook!} onBack={() => setCurrentScreen('assignments')} onStartReflection={startReflection} />;
      case 'reflection':
        return <ReflectionScreen book={selectedBook!} onEnd={() => setCurrentScreen('checkpoints')} />;
      case 'stats':
        return <StatsScreen onBack={() => setCurrentScreen('assignments')} />;
      default:
        return <AssignmentsScreen onSelectBook={navigateToBook} onNavigateStats={() => setCurrentScreen('stats')} />;
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
      <div className="relative w-full max-w-md h-screen md:h-[850px] overflow-hidden bg-background-light dark:bg-background-dark shadow-2xl md:rounded-[32px] md:border-[8px] md:border-gray-800">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;
