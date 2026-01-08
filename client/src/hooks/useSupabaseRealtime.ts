import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, subscribeToGame, subscribeToPlayers, subscribeToChatMessages, subscribeToVotes, subscribeToNightActions, unsubscribeAll } from '@/lib/supabase';

export function useSupabaseRealtime(gameId: number | null) {
  const [isConnected, setIsConnected] = useState(false);
  const channels = useRef<RealtimeChannel[]>([]);
  const messageHandlers = useRef<Map<string, (message: any) => void>>(new Map());

  useEffect(() => {
    if (!gameId) return;

    setIsConnected(true);

    // Subscribe to all game-related changes
    const gameChannel = subscribeToGame(gameId, (payload) => {
      console.log('Game update:', payload);
      const handler = messageHandlers.current.get('game_state_update');
      if (handler) handler({ type: 'game_state_update', payload });
    });

    const playersChannel = subscribeToPlayers(gameId, (payload) => {
      console.log('Players update:', payload);
      const handler = messageHandlers.current.get('game_state_update');
      if (handler) handler({ type: 'game_state_update', payload });
    });

    const chatChannel = subscribeToChatMessages(gameId, (payload) => {
      console.log('Chat message:', payload);
      const handler = messageHandlers.current.get('game_state_update');
      if (handler) handler({ type: 'game_state_update', payload });
    });

    const votesChannel = subscribeToVotes(gameId, (payload) => {
      console.log('Vote update:', payload);
      const handler = messageHandlers.current.get('game_state_update');
      if (handler) handler({ type: 'game_state_update', payload });
    });

    const nightActionsChannel = subscribeToNightActions(gameId, (payload) => {
      console.log('Night action update:', payload);
      const handler = messageHandlers.current.get('game_state_update');
      if (handler) handler({ type: 'game_state_update', payload });
    });

    channels.current = [gameChannel, playersChannel, chatChannel, votesChannel, nightActionsChannel];

    return () => {
      unsubscribeAll();
      channels.current = [];
      setIsConnected(false);
    };
  }, [gameId]);

  const onMessage = useCallback((type: string, handler: (message: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  // Dummy sendMessage for compatibility - actual API calls happen directly
  const sendMessage = useCallback((type: string, data: any) => {
    console.log('SendMessage called (using direct API):', type, data);
  }, []);

  return {
    isConnected,
    onMessage,
    sendMessage
  };
}
