import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { GameSettings as GameSettingsType } from '@/lib/gameTypes';
import { ArrowLeft, Shield, Eye, Heart, Skull, Ghost, Target, Sparkles, Users, Crown } from 'lucide-react';

interface GameSettingsProps {
  gameState: any;
}

const roleIcons: Record<string, React.ReactNode> = {
  seer: <Eye className="w-5 h-5 text-blue-400" />,
  doctor: <Heart className="w-5 h-5 text-green-400" />,
  shield: <Shield className="w-5 h-5 text-cyan-400" />,
  minion: <Skull className="w-5 h-5 text-blood" />,
  jester: <Ghost className="w-5 h-5 text-orange-400" />,
  hunter: <Target className="w-5 h-5 text-ember" />,
  witch: <Sparkles className="w-5 h-5 text-purple-400" />,
  bodyguard: <Shield className="w-5 h-5 text-teal-400" />,
  sheriff: <Crown className="w-5 h-5 text-ember" />,
};

export default function GameSettings({ gameState }: GameSettingsProps) {
  const [settings, setSettings] = useState<GameSettingsType>({
    werewolves: 1,
    seer: true,
    doctor: true,
    shield: true,
    minion: false,
    jester: false,
    hunter: false,
    witch: false,
    bodyguard: false,
    sheriff: false,
    seerInvestigations: undefined
  });

  const handleCreateLobby = () => {
    gameState.createGame(gameState.playerName, settings);
  };

  const settingsConfig = [
    {
      key: 'seer',
      title: 'Include Seer',
      description: 'Can investigate a player\'s true nature each night.',
      type: 'switch'
    },
    {
      key: 'doctor',
      title: 'Include Doctor', 
      description: 'Protects one player each night, including themselves.',
      type: 'switch'
    },
    {
      key: 'shield',
      title: 'Universal Shield',
      description: 'One-time night protection for all villagers.',
      type: 'switch'
    },
    {
      key: 'minion',
      title: 'Include Minion',
      description: 'A villager who serves the wolves.',
      type: 'switch'
    },
    {
      key: 'jester',
      title: 'Include Jester',
      description: 'Wins if voted out by the village.',
      type: 'switch'
    },
    {
      key: 'hunter',
      title: 'Include Hunter',
      description: 'When slain, takes an enemy down with them.',
      type: 'switch'
    },
    {
      key: 'witch',
      title: 'Include Witch',
      description: 'Possesses one poison and one save potion.',
      type: 'switch'
    },
    {
      key: 'bodyguard',
      title: 'Include Bodyguard',
      description: 'Shields a player, but falls if they are attacked.',
      type: 'switch'
    },
    {
      key: 'sheriff',
      title: 'Enable Sheriff',
      description: 'One villager becomes Sheriff. Their vote counts double.',
      type: 'switch'
    }
  ];

  return (
    <Card className="panel-stone rounded shadow-2xl max-w-4xl mx-auto">
      <CardHeader className="text-center border-b border-iron-gray/50 pb-6">
        {/* Small logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="/assets/Werewolves-Village-t1-logo-sq-nobg.png" 
            alt="Werewolves Village" 
            className="h-14 w-auto moon-glow"
          />
        </div>
        
        <CardTitle className="font-cinzel text-3xl md:text-4xl font-bold text-chiselled">
          FORGE YOUR GAME
        </CardTitle>
        <p className="text-parchment/60 mt-2">Configure the roles and rules for your hunt</p>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Werewolf Count - Special styling */}
          <div className="bg-blood/20 border border-blood/40 p-4 rounded flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-blood mt-1" />
              <div>
                <h3 className="font-bold text-lg text-parchment">Werewolves</h3>
                <p className="text-sm text-parchment/60 mt-1">Default: ~30% of players.</p>
              </div>
            </div>
            <Input
              type="number"
              value={settings.werewolves}
              onChange={(e) => setSettings(prev => ({ ...prev, werewolves: Math.max(1, parseInt(e.target.value) || 1) }))}
              min={1}
              className="w-24 mt-3 text-center self-end"
            />
          </div>

          {/* Seer Investigations - Special styling */}
          <div className="bg-blue-900/20 border border-blue-600/30 p-4 rounded flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <Eye className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-parchment">Seer Investigations</h3>
                <p className="text-sm text-parchment/60 mt-1">Default: 30% of werewolves (min 3).</p>
              </div>
            </div>
            <Input
              type="number"
              value={settings.seerInvestigations || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSettings(prev => ({ 
                  ...prev, 
                  seerInvestigations: value === '' ? undefined : Math.max(1, Math.min(20, parseInt(value) || 1))
                }));
              }}
              min={1}
              max={20}
              placeholder="Auto"
              className="w-24 mt-3 text-center self-end"
            />
          </div>

          {/* Other Settings */}
          {settingsConfig.map((config) => (
            <div 
              key={config.key} 
              className={`p-4 rounded flex justify-between items-start transition-all ${
                settings[config.key as keyof GameSettingsType] 
                  ? 'bg-iron-gray/40 border border-ember/30' 
                  : 'bg-iron-gray/20 border border-iron-gray/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {roleIcons[config.key]}
                <div>
                  <h3 className="font-bold text-parchment">{config.title}</h3>
                  <p className="text-sm text-parchment/50 mt-1">{config.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[config.key as keyof GameSettingsType] as boolean}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, [config.key]: checked }))
                }
                className="flex-shrink-0 ml-4"
              />
            </div>
          ))}
        </div>

        {/* Medieval Divider */}
        <div className="divider-medieval w-full my-8"></div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            onClick={() => gameState.setCurrentScreen('initial')}
            className="btn-iron py-3 px-6 rounded font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleCreateLobby}
            className="btn-ember py-3 px-8 rounded font-bold"
          >
            Create Lobby
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
