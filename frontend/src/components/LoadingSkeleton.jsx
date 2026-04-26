// src/components/LoadingSkeleton.jsx
// Pulsing placeholder boxes shown while data loads.

function LoadingSkeleton() {
  return (
    <div className="container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkeletonBox height={140} />
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <SkeletonBox height={140} flex={1} minWidth={200} />
          <SkeletonBox height={140} flex={2} minWidth={280} />
        </div>
        <SkeletonBox height={300} />
        <SkeletonBox height={250} />
      </div>

      {/* Inline keyframes — keeps it self-contained */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

function SkeletonBox({ height, flex, minWidth }) {
  return (
    <div
      style={{
        height,
        flex,
        minWidth,
        background: '#1a1a1d',
        border: '1px solid #2a2a2e',
        borderRadius: 12,
        animation: 'pulse 1.6s ease-in-out infinite',
      }}
    />
  );
}

export default LoadingSkeleton;