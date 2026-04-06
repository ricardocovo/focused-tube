import React from 'react';

const VideoCardSkeleton: React.FC = React.memo(function VideoCardSkeleton() {
  return (
    <div className="video-card" style={{ cursor: 'default' }}>
      {/* Thumbnail placeholder */}
      <div
        className="skeleton-shimmer"
        style={{ width: '100%', paddingTop: '56.25%' }}
      />

      {/* Info placeholder */}
      <div style={{ padding: 12 }}>
        {/* Title line 1 */}
        <div
          className="skeleton-shimmer"
          style={{ height: 14, borderRadius: 4, marginBottom: 8, width: '90%' }}
        />
        {/* Title line 2 */}
        <div
          className="skeleton-shimmer"
          style={{ height: 14, borderRadius: 4, marginBottom: 10, width: '65%' }}
        />
        {/* Channel name */}
        <div
          className="skeleton-shimmer"
          style={{ height: 12, borderRadius: 4, marginBottom: 10, width: '50%' }}
        />
        {/* Date + badge row */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div
            className="skeleton-shimmer"
            style={{ height: 12, borderRadius: 4, width: '30%' }}
          />
          <div
            className="skeleton-shimmer"
            style={{ height: 18, borderRadius: 12, width: 70 }}
          />
        </div>
      </div>
    </div>
  );
});

export default VideoCardSkeleton;
