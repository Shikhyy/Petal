import { useState, useEffect, useCallback } from 'react';
import { getAgentsStatus, getApiErrorMessage, AgentStatus, wsClient } from '../utils/api';

export function useAgents() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setError(null);
      const data = await getAgentsStatus();
      setAgents(data.agents);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load agents status.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    
    const unsubscribe = wsClient.onAgentStatus((updatedAgents) => {
      setError(null);
      setAgents(updatedAgents);
    });
    
    const interval = setInterval(fetchAgents, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents };
}
