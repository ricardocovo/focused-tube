import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedSourceTabs from './FeedSourceTabs';

describe('FeedSourceTabs', () => {
  it('renders a labeled tablist with tab roles and selected state', () => {
    render(<FeedSourceTabs activeSource={undefined} onSourceChange={vi.fn()} />);

    expect(screen.getByRole('tablist', { name: 'Feed source' })).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Subscriptions' })).toHaveAttribute('aria-selected', 'false');
  });

  it('changes source when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onSourceChange = vi.fn();

    render(<FeedSourceTabs activeSource={undefined} onSourceChange={onSourceChange} />);

    await user.click(screen.getByRole('tab', { name: 'Subscriptions' }));
    await user.click(screen.getByRole('tab', { name: 'All' }));

    expect(onSourceChange).toHaveBeenNthCalledWith(1, 'subscriptions');
    expect(onSourceChange).toHaveBeenNthCalledWith(2, undefined);
  });

  it('moves keyboard focus with arrow keys', async () => {
    const user = userEvent.setup();
    render(<FeedSourceTabs activeSource={undefined} onSourceChange={vi.fn()} />);

    const allTab = screen.getByRole('tab', { name: 'All' });
    const subscriptionsTab = screen.getByRole('tab', { name: 'Subscriptions' });

    allTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(subscriptionsTab).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(allTab).toHaveFocus();
  });
});
