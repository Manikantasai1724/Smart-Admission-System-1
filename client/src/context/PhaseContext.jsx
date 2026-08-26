import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const PhaseContext = createContext();

export const PhaseProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPhase = searchParams.get('phase') || '2';
  
  const [phase, setPhaseState] = useState(initialPhase);

  useEffect(() => {
    const currentPhase = searchParams.get('phase');
    if (currentPhase && currentPhase !== phase) {
      setPhaseState(currentPhase);
    } else if (!currentPhase) {
      // Enforce phase in URL if missing
      setSearchParams(params => {
        params.set('phase', phase);
        return params;
      }, { replace: true });
    }
  }, [searchParams, phase, setSearchParams]);

  const setPhase = (newPhase) => {
    setPhaseState(newPhase);
    setSearchParams(params => {
      params.set('phase', newPhase);
      return params;
    });
  };

  const isReadOnly = phase === '1' || phase === 'all';

  return (
    <PhaseContext.Provider value={{ phase, setPhase, isReadOnly }}>
      {children}
    </PhaseContext.Provider>
  );
};

export const usePhase = () => useContext(PhaseContext);
