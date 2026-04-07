import { useState, useEffect, useCallback } from 'react';
import { getAgentsStatus, AgentStatus, wsClient } from '../utils/api';

export function useAgents() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await getAgentsStatus();
      setAgents(data.agents);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    
    const unsubscribe = wsClient.onAgentStatus((updatedAgents) => {
      setAgents(updatedAgents);
    });
    
    const interval = setInterval(fetchAgents, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchAgents]);

  return { agents, refetch: fetchAgents };
}
