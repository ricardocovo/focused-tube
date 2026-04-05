import api from './api';
import type { SubscriptionChannel } from '../types/youtube';

export async function fetchSubscriptions(): Promise<SubscriptionChannel[]> {
  const { data } = await api.get<SubscriptionChannel[]>('/api/subscriptions');
  return data;
}
