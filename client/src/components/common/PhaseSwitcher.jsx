import React from 'react';
import { usePhase } from '../../context/PhaseContext';
import { Map, MapPinned, Layers } from 'lucide-react';

export default function PhaseSwitcher() {
  const { phase, setPhase } = usePhase();

  return (
    <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ml-1 sm:ml-4">
      <button 
        onClick={() => setPhase('1')}
        className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${phase === '1' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        title="Phase 1 (Read-only)"
      >
        <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Phase 1 (Read-only)</span>
        <span className="sm:hidden">P1</span>
      </button>
      <button 
        onClick={() => setPhase('2')}
        className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${phase === '2' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        title="Phase 2 (Active)"
      >
        <MapPinned className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Phase 2 (Active)</span>
        <span className="sm:hidden">P2</span>
      </button>
      <button 
        onClick={() => setPhase('all')}
        className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${phase === 'all' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        title="Both Phases"
      >
        <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Both Phases</span>
        <span className="sm:hidden">All</span>
      </button>
    </div>
  );
}
