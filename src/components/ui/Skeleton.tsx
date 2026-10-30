import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-[3.6px]',
}) => {
  const style: React.CSSProperties = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      style={style}
      className={`skeleton-shimmer relative overflow-hidden bg-[#161616] border border-[#262626] ${rounded} ${className}`}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 3, className = '', lastLineWidth = '65%' }) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          className="opacity-80"
        />
      ))}
    </div>
  );
};

export const SkeletonBadge: React.FC<{ width?: string | number; className?: string }> = ({
  width = 90,
  className = '',
}) => {
  return (
    <Skeleton
      height={22}
      width={width}
      className={`rounded-[3.6px] border border-[#333333] ${className}`}
    />
  );
};

export const SkeletonButton: React.FC<{ width?: string | number; height?: number; className?: string }> = ({
  width = 160,
  height = 42,
  className = '',
}) => {
  return (
    <Skeleton
      width={width}
      height={height}
      className={`rounded-[3.6px] border border-[#3a3a3a] ${className}`}
    />
  );
};

export const SkeletonCard: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div
      className={`rounded-[3.6px] bg-[#121212] border border-[#2a2a2a] p-6 relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 skeleton-shimmer-ambient pointer-events-none" />
      {children}
    </div>
  );
};
