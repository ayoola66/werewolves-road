import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";

interface ChatProps {
  gameState: any;
}

export default function Chat({ gameState }: ChatProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (gameState?.gameState?.chatMessages) {
      setMessages(gameState.gameState.chatMessages);
      setTimeout(scrollToBottom, 100);
    }
  }, [gameState?.gameState?.chatMessages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Check if player can chat
    if (!gameState.canChat()) {
      return;
    }

    gameState.sendChatMessage(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentPlayer = gameState.getCurrentPlayer();
  const canChat = gameState.canChat();
  const game = gameState.gameState;
  const currentPhase =
    game?.game?.currentPhase || game?.game?.phase || game?.phase;
  
  const playerRole = gameState.getPlayerRole();
  const isWerewolf = playerRole === 'werewolf' || playerRole === 'minion';
  const isNightPhase = currentPhase === 'night';
  
  // Determine chat label
  let chatLabel = "Village Chat";
  let chatSubtitle = "";
  
  if (isNightPhase) {
    if (isWerewolf) {
      chatLabel = "🐺 Werewolf Chat";
      chatSubtitle = "Private communication";
    } else {
      chatLabel = "🌙 Village Chat";
      chatSubtitle = "Messages scrambled for disguise";
    }
  } else if (currentPhase === 'day' || currentPhase === 'voting') {
    chatLabel = "☀️ Village Chat";
  }

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
