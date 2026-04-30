import type { CSSProperties } from 'react';

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ width, height = 16, radius = 4, className = '', style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonText({ lines = 3, widths = ['100%', '85%', '65%'] }: { lines?: number; widths?: Array<string | number> }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={12}
          width={widths[index] ?? widths[widths.length - 1] ?? '100%'}
          radius={999}
        />
      ))}
    </div>
  );
}
