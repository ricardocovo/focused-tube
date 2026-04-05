import React from 'react';

interface Tab {
  label: string;
  value: string | undefined;
}

const TABS: Tab[] = [
  { label: 'All', value: undefined },
  { label: 'Subscriptions', value: 'subscriptions' },
  { label: 'Search', value: 'search' },
];

interface FeedSourceTabsProps {
  activeSource: string | undefined;
  onSourceChange: (source?: string) => void;
}

const FeedSourceTabs: React.FC<FeedSourceTabsProps> = ({ activeSource, onSourceChange }) => {
  return (
    <div className="feed-tabs">
      {TABS.map((tab) => {
        const isActive = activeSource === tab.value;
        return (
          <button
            key={tab.label}
            onClick={() => onSourceChange(tab.value)}
            className={`feed-tab${isActive ? ' feed-tab-active' : ''}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default FeedSourceTabs;
