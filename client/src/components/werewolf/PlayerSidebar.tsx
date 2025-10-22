import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface Player {
  playerId: string;
  name: string;
  isAlive: boolean;
  isHost: boolean;
  isSheriff: boolean;
  role?: string;
}

interface PlayerSidebarProps {
  alivePlayers: Player[];
  deadPlayers: Player[];
  currentPlayerId?: string;
}

export default function PlayerSidebar({
  alivePlayers,
  deadPlayers,
  currentPlayerId,
}: PlayerSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Burger Menu Button - Fixed Position */}
      <Button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg shadow-lg md:hidden"
        size="sm"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative
          top-0 left-0
          h-full
          bg-gradient-to-b from-amber-900/95 to-orange-900/95
          border-r-2 border-amber-600
          transition-transform duration-300 ease-in-out
          z-40
          overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          w-64 sm:w-72 md:w-80
        `}
      >
        <Card className="h-full bg-transparent border-0 shadow-none">
          <CardHeader className="p-3 sm:p-4 border-b border-amber-700">
            <CardTitle className="font-cinzel text-lg sm:text-xl text-amber-100 flex items-center justify-between">
              <span>👥 PLAYERS</span>
              <div className="flex gap-2 text-sm">
                <span className="text-green-400">
                  {alivePlayers.length} ALIVE
                </span>
                <span className="text-red-400">{deadPlayers.length} DEAD</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            {/* Alive Players */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-green-400 mb-2 px-2">
                Alive Players
              </h3>
              <div className="space-y-2">
                {alivePlayers.map((player) => (
                  <div
                    key={player.playerId}
                    className={`
                      p-3 rounded-lg border-2 border-green-600
                      bg-gray-800/60 backdrop-blur-sm
                      transition-all
                      ${
                        player.playerId === currentPlayerId
                          ? "ring-2 ring-yellow-400 border-yellow-400"
                          : ""
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm sm:text-base truncate">
                          {player.name}
                          {player.playerId === currentPlayerId && " (You)"}
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {player.isHost && (
                            <Badge className="text-xs bg-yellow-600 hover:bg-yellow-700">
                              👑 HOST
                            </Badge>
                          )}
                          {player.isSheriff && (
                            <Badge className="text-xs bg-blue-600 hover:bg-blue-700">
                              ⭐ SHERIFF
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="ml-2">
                        <Badge className="text-xs bg-green-600 hover:bg-green-700">
                          ✓ Alive
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dead Players */}
            {deadPlayers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2 px-2">
                  Dead Players
                </h3>
                <div className="space-y-2">
                  {deadPlayers.map((player) => (
                    <div
                      key={player.playerId}
                      className="p-3 rounded-lg border-2 border-red-600 bg-gray-900/60 backdrop-blur-sm opacity-75"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-300 text-sm sm:text-base truncate line-through">
                            {player.name}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {player.isHost && (
                              <Badge className="text-xs bg-gray-600">
                                👑 HOST
                              </Badge>
                            )}
                            {player.isSheriff && (
                              <Badge className="text-xs bg-gray-600">
                                ⭐ SHERIFF
                              </Badge>
                            )}
                            {player.role && (
                              <Badge className="text-xs bg-gray-700 uppercase">
                                {player.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="ml-2">
                          <Badge className="text-xs bg-red-600">✗ Dead</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
