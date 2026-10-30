import React, { createContext, useContext, useState } from 'react';

interface SkeletonContextType {
  isSkeleton: boolean;
  setIsSkeleton: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleSkeleton: () => void;
  simulateLoading: (durationMs?: number) => void;
  isSimulating: boolean;
}

const SkeletonContext = createContext<SkeletonContextType | undefined>(undefined);

export const SkeletonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSkeleton, setIsSkeleton] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const toggleSkeleton = () => {
    setIsSkeleton((prev) => !prev);
  };

  const simulateLoading = (durationMs = 2000) => {
    setIsSimulating(true);
    setIsSkeleton(true);
    setTimeout(() => {
      setIsSkeleton(false);
      setIsSimulating(false);
    }, durationMs);
  };

  return (
    <SkeletonContext.Provider
      value={{
        isSkeleton,
        setIsSkeleton,
        toggleSkeleton,
        simulateLoading,
        isSimulating,
      }}
    >
      {children}
    </SkeletonContext.Provider>
  );
};

export const useSkeleton = (): SkeletonContextType => {
  const context = useContext(SkeletonContext);
  if (!context) {
    throw new Error('useSkeleton must be used within a SkeletonProvider');
  }
  return context;
};
