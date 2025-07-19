import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trophy,
  Star,
  Target,
  Award,
  Zap,
  TrendingUp,
  Users,
  Medal,
  Crown,
  Flame,
} from "lucide-react";

interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  level_name: string;
  achievements: any[] | null;
  streaks: any;
  created_at: string;
  updated_at: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface Ranking {
  position: number;
  user_name: string;
  total_points: number;
  level_name: string;
  achievements_count: number;
}

const ACHIEVEMENTS_CATALOG: Achievement[] = [
  {
    id: 'first_registration',
    name: 'Primeiro Registro',
    description: 'Registrou seu primeiro reagente no sistema',
    icon: '🏆',
    points: 50,
    unlocked: false,
  },
  {
    id: 'accuracy_master',
    name: 'Mestre da Precisão',
    description: 'Registrou 10 consumos sem erros',
    icon: '🎯',
    points: 100,
    unlocked: false,
  },
  {
    id: 'sustainability_hero',
    name: 'Herói da Sustentabilidade',
    description: 'Evitou 5 descartes por vencimento',
    icon: '🌱',
    points: 150,
    unlocked: false,
  },
  {
    id: 'speed_demon',
    name: 'Demônio da Velocidade',
    description: 'Processou 20 registros em um dia',
    icon: '⚡',
    points: 200,
    unlocked: false,
  },
  {
    id: 'quality_guardian',
    name: 'Guardião da Qualidade',
    description: 'Realizou 25 controles de qualidade',
    icon: '🛡️',
    points: 250,
    unlocked: false,
  },
  {
    id: 'streak_champion',
    name: 'Campeão da Sequência',
    description: 'Manteve uma sequência de 30 dias ativos',
    icon: '🔥',
    points: 300,
    unlocked: false,
  },
];

const LEVEL_THRESHOLDS = [
  { level: 'Iniciante', min: 0, max: 99 },
  { level: 'Aprendiz', min: 100, max: 299 },
  { level: 'Competente', min: 300, max: 599 },
  { level: 'Proficiente', min: 600, max: 999 },
  { level: 'Especialista', min: 1000, max: 1999 },
  { level: 'Mestre', min: 2000, max: 4999 },
  { level: 'Lenda', min: 5000, max: Infinity },
];

export default function Gamification() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [userGamification, setUserGamification] = useState<UserGamification | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_CATALOG);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
    loadRanking();
  }, [profile]);

  const loadGamificationData = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserGamification({
          ...data,
          achievements: Array.isArray(data.achievements) ? data.achievements : []
        });
        
        // Processar achievements
        const achievementsArray = Array.isArray(data.achievements) ? data.achievements : [];
        setAchievements(prev => 
          prev.map(achievement => ({
            ...achievement,
            unlocked: achievementsArray.some((ua: any) => ua.id === achievement.id),
            unlockedAt: undefined,
          }))
        );
      } else {
        // Criar registro inicial se não existir
        const { error: insertError } = await supabase
          .from('user_gamification')
          .insert({
            user_id: profile.id,
            total_points: 0,
            level_name: 'Iniciante',
            achievements: [],
            streaks: { daily: 0, weekly: 0, monthly: 0 },
          });

        if (insertError) throw insertError;
        
        loadGamificationData(); // Recarregar após criação
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar seus dados de gamificação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRanking = async () => {
    try {
      // Mock data - implementar quando tiver mais usuários
      const mockRanking: Ranking[] = [
        {
          position: 1,
          user_name: 'Ana Silva',
          total_points: 2500,
          level_name: 'Mestre',
          achievements_count: 8,
        },
        {
          position: 2,
          user_name: profile?.full_name || 'Você',
          total_points: userGamification?.total_points || 150,
          level_name: userGamification?.level_name || 'Iniciante',
          achievements_count: achievements.filter(a => a.unlocked).length,
        },
        {
          position: 3,
          user_name: 'Carlos Santos',
          total_points: 800,
          level_name: 'Proficiente',
          achievements_count: 5,
        },
        {
          position: 4,
          user_name: 'Maria Oliveira',
          total_points: 650,
          level_name: 'Proficiente',
          achievements_count: 4,
        },
        {
          position: 5,
          user_name: 'João Costa',
          total_points: 400,
          level_name: 'Competente',
          achievements_count: 3,
        },
      ];

      setRanking(mockRanking);
    } catch (error) {
      console.error('Error loading ranking:', error);
    }
  };

  const getCurrentLevel = () => {
    const points = userGamification?.total_points || 0;
    return LEVEL_THRESHOLDS.find(level => points >= level.min && points <= level.max) || LEVEL_THRESHOLDS[0];
  };

  const getNextLevel = () => {
    const currentLevel = getCurrentLevel();
    const currentIndex = LEVEL_THRESHOLDS.findIndex(level => level.level === currentLevel.level);
    return LEVEL_THRESHOLDS[currentIndex + 1] || null;
  };

  const getLevelProgress = () => {
    const points = userGamification?.total_points || 0;
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    
    if (!nextLevel) return 100; // Já é o nível máximo
    
    const progress = ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progress = getLevelProgress();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          Sistema de Gamificação
        </h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e conquiste achievements</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status do Usuário */}
        <div className="lg:col-span-2 space-y-6">
          {/* Nível e Progresso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Nível Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{currentLevel.level}</h3>
                  <p className="text-muted-foreground">
                    {userGamification?.total_points || 0} pontos totais
                  </p>
                </div>
                <div className="text-right">
                  {nextLevel ? (
                    <>
                      <p className="text-sm text-muted-foreground">Próximo nível:</p>
                      <p className="font-semibold">{nextLevel.level}</p>
                      <p className="text-xs text-muted-foreground">
                        {nextLevel.min - (userGamification?.total_points || 0)} pontos restantes
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-yellow-600">Nível Máximo!</p>
                  )}
                </div>
              </div>
              
              {nextLevel && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentLevel.min}</span>
                    <span>{Math.round(progress)}%</span>
                    <span>{nextLevel.min}</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Conquistas
              </CardTitle>
              <CardDescription>
                {achievements.filter(a => a.unlocked).length} de {achievements.length} desbloqueadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      achievement.unlocked 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{achievement.name}</h4>
                          <Badge variant={achievement.unlocked ? "default" : "secondary"} className="text-xs">
                            {achievement.points} pts
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Ranking e Estatísticas */}
        <div className="space-y-6">
          {/* Ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Ranking
              </CardTitle>
              <CardDescription>Top 5 do laboratório</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.map((user) => (
                  <div
                    key={user.position}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      user.user_name === profile?.full_name 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getRankingIcon(user.position)}
                      <span className="font-semibold text-sm">#{user.position}</span>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.user_name}
                        {user.user_name === profile?.full_name && " (Você)"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{user.total_points} pts</span>
                        <span>•</span>
                        <span>{user.level_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sequência atual</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">
                      {userGamification?.streaks?.daily || 0} dias
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Achievements</span>
                  <span className="font-semibold">
                    {achievements.filter(a => a.unlocked).length}/{achievements.length}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posição no ranking</span>
                  <span className="font-semibold">
                    #{ranking.find(r => r.user_name === profile?.full_name)?.position || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Membro desde</span>
                  <span className="font-semibold text-xs">
                    {userGamification?.created_at 
                      ? new Date(userGamification.created_at).toLocaleDateString('pt-BR')
                      : 'Hoje'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Dicas para Pontuar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Registre reagentes corretamente: +15 pts</p>
                <p>• Faça controles de qualidade: +20 pts</p>
                <p>• Transfira reagentes críticos: +12 pts</p>
                <p>• Mantenha sequência diária: +5 pts/dia</p>
                <p>• Complete achievements: até +300 pts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}