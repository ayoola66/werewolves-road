import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatProps {
  gameState: any;
  isWerewolf: boolean;
  isNightPhase: boolean;
}

function scrambleText(text: string): string {
  return text
    .split('')
    .map(char => Math.random() > 0.5 ? '█' : char)
    .join('');
}

export default function Chat({ gameState, isWerewolf, isNightPhase }: ChatProps) {
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'public' | 'werewolf'>('public');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (gameState?.chatMessages) {
      setMessages(gameState.chatMessages);
    }
  }, [gameState?.chatMessages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const isWerewolfChat = channel === 'werewolf' && isWerewolf;
    const shouldScramble = !isWerewolfChat && isNightPhase;

    gameState.sendMessage({
      type: 'chat_message',
      message,
      channel,
      isScrambled: shouldScramble
    });

    setMessage('');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Chat</span>
          {isWerewolf && (
            <div className="space-x-2">
              <Button
                variant={channel === 'public' ? 'default' : 'outline'}
                onClick={() => setChannel('public')}
                size="sm"
              >
                Public
              </Button>
              <Button
                variant={channel === 'werewolf' ? 'default' : 'outline'}
                onClick={() => setChannel('werewolf')}
                size="sm"
                className="text-red-500"
              >
                Werewolf
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] overflow-y-auto space-y-2 mb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded ${
                msg.channel === 'werewolf' ? 'bg-red-900/20' : 'bg-gray-800/50'
              }`}
            >
              <span className="font-bold">{msg.playerName}: </span>
              <span>
                {msg.isScrambled ? scrambleText(msg.message) : msg.message}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}