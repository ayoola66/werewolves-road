import { useState, useCallback, useEffect } from "react";
import { GameState, GameSettings, Player } from "@/lib/gameTypes";
import { useToast } from "./use-toast";
import { supabase } from "@/lib/supabase";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [currentScreen, setCurrentScreen] = useState<
    "initial" | "settings" | "lobby" | "game"
  >("initial");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [showVoteOverlay, setShowVoteOverlay] = useState(false);
  const [showNightActionOverlay, setShowNightActionOverlay] = useState(false);
  const [showGameOverOverlay, setShowGameOverOverlay] = useState(false);
  const [hasPerformedNightAction, setHasPerformedNightAction] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!gameState?.game?.gameCode) return;

    const channel = supabase
      .channel(`game:${gameState.game.gameCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `game_code=eq.${gameState.game.gameCode}`,
        },
        async (
          e
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_code=eq.${gameState.game.gameCode}`,
        },
        async () => {
          await fetchGameState(gameState.game.gameCode);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameState?.game?.gameCode]);

  const fetchGameState = async (gameCode: string) => {
    try {
      const { data: game } = await supabase
        .from("games")
        .select("*")
        .eq("game_code", gameCode)
        .single();

      const { data: players } = await supabase
        .from("players")
        .select("*")
        .eq("game_code", gameCode);

      if (game && players) {
        const alivePlayers = players.filter((p) => p.is_alive);
        const deadPlayers = players.filter((p) => !p.is_alive);

        setGameState({
          game: {
            gameCode: game.game_code,
            hostId: game.host_id,
            status: game.status,
            phase: game.phase,
            dayCount: game.day_count,
            nightCount: game.night_count,
            winner: game.winner,
            settings: game.settings,
          },
          players: players.map((p) => ({
            playerId: p.player_id,
            playerName: p.player_name,
            role: p.role,
            isAlive: p.is_alive,
            isHost: p.player_id === game.host_id,
          })),
          alivePlayers: alivePlayers.map((p) => ({
            playerId: p.player_id,
            playerName: p.player_name,
            role: p.role,
            isAlive: true,
            isHost: p.player_id === game.host_id,
          })),
          deadPlayers: deadPlayers.map((p) => ({
            playerId: p.player_id,
            playerName: p.player_name,
            role: p.role,
            isAlive: false,
            isHost: p.player_id === game.host_id,
          })),
          votes: [],
          vhes: [],     phase: game.phase,
    _    lih A)s[]
      ch}M ([]
      rs:epGa C:l am.ph r,,
    ifc   p mnvTim : 0, method: "POST",
      hs  n gh CCuotntgami.aut
    Con : gcta. ay_teuso,son();
    wwelfCatpe:rIl;vePly .filtarspp.role === "werew  f")iteatth
      v llh (rCour::aliPaytriltepp.r cr !trctwvrewolf).lng,
 }srIvsgsLf0
  const jch(
ASE_URL}/functions/v1/join-game`,
         metdCt-Type": "a
    as        if (data.error) throw new
      ld}layerId);
     S}
   c tch ile: "" description: "Welcome to the game!",
      conso)e.;rror( f tah(rgogn{{a: error);
        title: "Error",
         description: error.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const startGame = useCallback(async () => {
    if (!gameState) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ gameCode: gameState.game.gameCode }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCurrentScreen("game");
      setShowRoleReveal(true);

      toast({
        title: "Game Started",
        description: "The game has begun!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [gameState, toast]);

  const sendChatMessage = useCallback(
    async (message: string, channel?: string) => {
      if (!gameState || !playerId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              gameCode: gameState.game.gameCode,
              playerId,
              message,
              channel: channel || "all",
            }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [gameState, playerId, toast]
  );

  const vote = useCallback(
    async (targetId: string) => {
      if (!gameState || !playerId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-vote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              gameCode: gameState.game.gameCode,
              playerId,
              targetId,
            }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setShowVoteOverlay(false);
        setSelectedPlayer(null);

        toast({
          title: "Vote Recorded",
          description: "Your vote has been recorded",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [gameState, playerId, toast]
  );

  const performNightAction = useCallback(
    async (targetId: string, action: string) => {
      if (!gameState || !playerId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-night-action`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              gameCode: gameState.game.gameCode,
              playerId,
              targetId,
              action,
            }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setShowNightActionOverlay(false);
        setSelectedPlayer(null);
        setHasPerformedNightAction(true);

        toast({
          title: "Action Recorded",
          description: "Your night action has been recorded",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [gameState, playerId, toast]
  );

  const hasNightAction = (role: string) => {
    return ["werewolf", "seer", "doctor"].includes(role);
  };

  return {
    gameState,
    playerId,
    playerName,
    currentScreen,
    selectedPlayer,
    showRoleReveal,
    showVoteOverlay,
    showNightActionOverlay,
    showGameOverOverlay,
    hasPerformedNightAction,
    isConnected: true,
    createGame,
    joinGame,
    startGame,
    sendChatMessage,
    vote,
    performNightAction,
    setSelectedPlayer,
    setShowRoleReveal,
    setShowVoteOverlay,
    setShowNightActionOverlay,
    setShowGameOverOverlay,
  seatnc(gtIdrf(!St||!rId) tur;
try{sponwiftch`${iprt.nvVITE_SUPABASE_URL/fuci/v1/t-it-co`,th"POT"edrs:{"Co-Typ":"ppio/json",Authorizion`Brr${ipor.nv.VTE_SUPABASE_ANON_KEY}`oyJSON.yplyerIdtrId,cion,}) }  
dtwrspo.json);if(rrrhrwwEod.rr
    lctdPernul    rutst(tit:AinRere,dscripio"Youhcohs brco", };
}ach(o: a {a{
i:"Er",
dsripti:o.mssg,vari"dsrciv",
  )}},
[gmStt,Id,ta]hsNighAcor: strig)["wrwolf", "er",octor].nclude(ro:rue,Sn