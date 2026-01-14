import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Zap, AlertTriangle } from "lucide-react";

interface ChatProps {
  gameState: any;
  channel?: string; // "player" | "werewolf"
}

// Anti-AFK typing rule constants
const TYPING_INTERVAL_MS = 5000; // 5 seconds
const MIN_WORDS_REQUIRED = 3;
const WARNING_THRESHOLD_MS = 2000; // Show warning at 2 seconds left

export default function Chat({ gameState, channel = "player" }: ChatProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Anti-AFK typing tracker
  const [wordsSentInWindow, setWordsSentInWindow] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(TYPING_INTERVAL_MS / 1000);
  const [showWarning, setShowWarning] = useState(false);
  const lastResetTimeRef = useRef<number>(Date.now());
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get current phase to determine if anti-AFK rule applies
  const game = gameState?.gameState;
  const currentPhase = game?.game?.currentPhase || game?.game?.phase || game?.phase;
  const isNightPhase = currentPhase === "night";
  const currentPlayer = gameState?.getCurrentPlayer?.();
  const isAlive = currentPlayer?.isAlive;

  // Count words in a string
  const countWords = useCallback((text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Handle lightning strike
  const triggerLightningStrike = useCallback(async () => {
    if (!gameState?.triggerLightningStrike) {
      console.error("Lightning strike function not available");
      return;
    }
    
    try {
      await gameState.triggerLightningStrike();
    } catch (error) {
      console.error("Failed to trigger lightning strike:", error);
    }
  }, [gameState]);

  // Reset word counter every 5 seconds and check for violations
  useEffect(() => {
    // Only apply anti-AFK rule during night phase for alive players chatting in village channel
    if (!isNightPhase || !isAlive || channel !== "player") {
      // Clear any existing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setShowWarning(false);
      return;
    }

    // Start the typing check interval
    lastResetTimeRef.current = Date.now();
    setWordsSentInWindow(0);
    setTimeRemaining(TYPING_INTERVAL_MS / 1000);

    typingIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastResetTimeRef.current;
      const remaining = Math.max(0, TYPING_INTERVAL_MS - elapsed);
      
      setTimeRemaining(Math.ceil(remaining / 1000));
      
      // Show warning when time is running low
      if (remaining <= WARNING_THRESHOLD_MS && wordsSentInWindow < MIN_WORDS_REQUIRED) {
        setShowWarning(true);
      }

      // Check if interval has passed
      if (elapsed >= TYPING_INTERVAL_MS) {
        if (wordsSentInWindow < MIN_WORDS_REQUIRED) {
          // LIGHTNING STRIKE! Player failed to type enough
          console.log("⚡ LIGHTNING STRIKE! Failed to type minimum words");
          triggerLightningStrike();
        }
        
        // Reset for next window
        lastResetTimeRef.current = now;
        setWordsSentInWindow(0);
        setShowWarning(false);
      }
    }, 100); // Check every 100ms for smooth countdown

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [isNightPhase, isAlive, channel, wordsSentInWindow, triggerLightningStrike]);

  useEffect(() => {
    const chatMessages = gameState?.gameState?.chatMessages;
    if (chatMessages && Array.isArray(chatMessages)) {
      // Filter messages by channel
      const filteredMessages = chatMessages.filter(
        (msg: any) => msg.type === channel
      );
      setMessages(filteredMessages);
      setTimeout(scrollToBottom, 100);
    }
  }, [gameState?.gameState?.chatMessages, channel]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Check if player can chat
    const canChatResult = gameState.canChat ? gameState.canChat() : true;
    if (!canChatResult) {
      return;
    }

    // Count words and add to counter for anti-AFK tracking
    const words = countWords(message);
    setWordsSentInWindow(prev => prev + words);
    
    // Reset warning if we've met the requirement
    if (wordsSentInWindow + words >= MIN_WORDS_REQUIRED) {
      setShowWarning(false);
    }

    gameState.sendChatMessage(message, channel);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentPlayer = gameState.getCurrentPlayer();
  const canChat = gameState.canChat ? gameState.canChat() : (currentPlayer?.isAlive || false);
  const game = gameState.gameState;
  const currentPhase =
    game?.game?.currentPhase || game?.game?.phase || game?.phase;

  const playerRole = gameState.getPlayerRole();
  const isWerewolf = playerRole === "werewolf" || playerRole === "minion";
  const isNightPhase = currentPhase === "night";

  // Determine chat label based on phase and channel
  let chatLabel = "Village Chat";
  let chatSubtitle = "";

  if (isNightPhase) {
    if (channel === "werewolf" && isWerewolf) {
      chatLabel = "🐺 Werewolf Chat";
      chatSubtitle = "Private - only werewolves can read this";
    } else {
      chatLabel = "🌙 Village Chat";
      chatSubtitle = "Messages scrambled - type to blend in!";
    }
  } else if (currentPhase === "day") {
    chatLabel = "☀️ Verbal Discussion";
    chatSubtitle = "Chat disabled - discuss with other players verbally";
  } else if (currentPhase === "voting" || currentPhase === "voting_results") {
    chatLabel = "⚖️ Voting Phase";
    chatSubtitle = "Chat disabled during voting";
  }

  // Show anti-AFK warning during night phase
  const showTypingRequirement = isNightPhase && isAlive && channel === "player";
  const wordsNeeded = MIN_WORDS_REQUIRED - wordsSentInWindow;

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 border-2 border-amber-900/20">
      <CardHeader className="pb-3 border-b border-amber-900/20">
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-cinzel">
          <MessageCircle className="w-5 h-5" />
          <div className="flex flex-col flex-1">
            <span>{chatLabel}</span>
            {chatSubtitle && (
              <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                {chatSubtitle}
              </span>
            )}
          </div>
          {!canChat && (
            <span className="ml-auto text-sm font-normal text-red-600 dark:text-red-400">
              💀 Deceased
            </span>
          )}
        </CardTitle>
        
        {/* Anti-AFK Typing Requirement Warning */}
        {showTypingRequirement && (
          <div className={`mt-2 p-2 rounded-lg transition-all ${
            showWarning 
              ? 'bg-red-600 animate-pulse' 
              : wordsNeeded <= 0 
                ? 'bg-green-600/80' 
                : 'bg-amber-600/80'
          }`}>
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-1">
                {showWarning ? (
                  <>
                    <Zap className="w-4 h-4 animate-bounce" />
                    <span className="font-bold">⚡ LIGHTNING WARNING!</span>
                  </>
                ) : wordsNeeded <= 0 ? (
                  <>
                    <span>✓ Safe!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>Grand Wizard's Law</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">
                  {wordsNeeded > 0 ? `${wordsNeeded} words needed` : 'OK'}
                </span>
                <span className="font-mono bg-black/30 px-2 py-0.5 rounded">
                  {timeRemaining}s
                </span>
              </div>
            </div>
            {showWarning && (
              <div className="text-white text-xs mt-1 text-center font-bold">
                TYPE NOW or face the Grand Wizard's wrath! ⚡
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        <ScrollArea className="flex-1 h-[350px] pr-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isCurrentPlayer = msg.playerId === gameState.playerId;
                return (
                  <div
                    key={`${msg.id || i}-${msg.createdAt}`}
                    className={`flex ${
                      isCurrentPlayer ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isCurrentPlayer
                          ? "bg-amber-600 text-white"
                          : "bg-white dark:bg-gray-700 border border-amber-900/20"
                      }`}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className={`font-bold text-sm ${
                            isCurrentPlayer
                              ? "text-amber-100"
                              : "text-amber-900 dark:text-amber-100"
                          }`}
                        >
                          {msg.playerName}
                        </span>
                        <span
                          className={`text-xs opacity-70 ${
                            isCurrentPlayer
                              ? "text-amber-200"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p
                        className={`text-sm break-words ${
                          isCurrentPlayer
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              canChat ? "Type your message..." : "You cannot speak now..."
            }
            disabled={!canChat}
            className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 border-amber-900/20 focus:border-amber-600 disabled:opacity-50"
            maxLength={200}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!canChat || !message.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {!canChat && currentPlayer && !currentPlayer.isAlive && (
          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            The dead tell no tales...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
