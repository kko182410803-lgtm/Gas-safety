import { Achievement, GameScoreRecord, UserStats } from '../types';

const STATS_KEY = 'gas_safety_user_stats_v1';
const ACHIEVEMENTS_KEY = 'gas_safety_achievements_v1';
const LEADERBOARD_KEY = 'gas_safety_leaderboard_v1';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'survivor',
    title: '오늘의 가스 안전 지킴이!',
    description: '끝까지 포기하지 않고 안전하게 생존 클리어하기',
    icon: 'ShieldCheck',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'expert_normal',
    title: '가스안전 전문가',
    description: '일반 모드에서 5,000점 이상 고득점 달성하기',
    icon: 'Award',
    unlocked: false,
    progress: 0,
    maxProgress: 5000,
  },
  {
    id: 'master_hard',
    title: '가스안전 마스터',
    description: '하드 모드에서 16,000점 이상 고득점 달성하기',
    icon: 'Crown',
    unlocked: false,
    progress: 0,
    maxProgress: 16000,
  },
  {
    id: 'prologue_15',
    title: '안전 수칙을 꼼꼼하게!',
    description: '가스안전 프롤로그를 총 15회 완벽하게 클리어하기',
    icon: 'BookOpenCheck',
    unlocked: false,
    progress: 0,
    maxProgress: 15,
  },
  {
    id: 'hard_clear',
    title: '가스 안전은 나에게 맡겨!',
    description: '긴박한 하드 모드를 멋지게 클리어하기',
    icon: 'FlameKindling',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
];

export const INITIAL_STATS: UserStats = {
  prologueClearCount: 0,
  normalHighScore: 0,
  hardHighScore: 0,
  normalCleared: false,
  hardCleared: false,
  totalHazardsResolved: 0,
  totalGamesPlayed: 0,
};

export const storage = {
  resetAllGameData(): { stats: UserStats; achievements: Achievement[] } {
    try {
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(ACHIEVEMENTS_KEY);
      localStorage.removeItem(LEADERBOARD_KEY);
    } catch {
      // ignore
    }
    return {
      stats: { ...INITIAL_STATS },
      achievements: INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, progress: 0, unlockedAt: undefined })),
    };
  },

  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      return data ? { ...INITIAL_STATS, ...JSON.parse(data) } : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  },

  saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage errors
    }
  },

  getAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (!data) return INITIAL_ACHIEVEMENTS;
      const saved: Achievement[] = JSON.parse(data);
      // Merge with latest schema in case of new achievements
      return INITIAL_ACHIEVEMENTS.map(initial => {
        const found = saved.find(s => s.id === initial.id);
        return found ? { ...initial, ...found } : initial;
      });
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  },

  saveAchievements(achievements: Achievement[]): void {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch {
      // Ignore storage errors
    }
  },

  getLeaderboard(): GameScoreRecord[] {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (data) return JSON.parse(data);
      // Default sample records for experience classroom inspiration
      const defaults: GameScoreRecord[] = [
        {
          id: 'def-1',
          playerName: '안전지킴이 김민수',
          score: 14500,
          mode: 'normal',
          cleared: true,
          hazardsCleared: 28,
          date: '2026-08-25',
        },
        {
          id: 'def-2',
          playerName: '가스박사 이서연',
          score: 22400,
          mode: 'hard',
          cleared: true,
          hazardsCleared: 42,
          date: '2026-08-26',
        },
        {
          id: 'def-3',
          playerName: '소방꿈나무 박도현',
          score: 11200,
          mode: 'normal',
          cleared: true,
          hazardsCleared: 22,
          date: '2026-08-24',
        },
      ];
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return [];
    }
  },

  addScoreRecord(record: Omit<GameScoreRecord, 'id' | 'date'>): GameScoreRecord[] {
    const list = this.getLeaderboard();
    const newRecord: GameScoreRecord = {
      ...record,
      id: 'rec-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [...list, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Keep top 20
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  },

  incrementPrologueClear(): { newCount: number; newlyUnlocked: Achievement[] } {
    const stats = this.getStats();
    stats.prologueClearCount += 1;
    this.saveStats(stats);

    const achievements = this.getAchievements();
    const newlyUnlocked: Achievement[] = [];

    const target = achievements.find(a => a.id === 'prologue_15');
    if (target) {
      target.progress = stats.prologueClearCount;
      if (stats.prologueClearCount >= 15 && !target.unlocked) {
        target.unlocked = true;
        target.unlockedAt = new Date().toLocaleDateString('ko-KR');
        newlyUnlocked.push(target);
      }
    }

    this.saveAchievements(achievements);
    return { newCount: stats.prologueClearCount, newlyUnlocked };
  },

  checkGameAchievements(
    mode: 'normal' | 'hard',
    score: number,
    cleared: boolean,
    hazardsCleared: number
  ): { newlyUnlocked: Achievement[]; updatedStats: UserStats } {
    const stats = this.getStats();
    stats.totalGamesPlayed += 1;
    stats.totalHazardsResolved += hazardsCleared;

    if (mode === 'normal') {
      stats.normalHighScore = Math.max(stats.normalHighScore, score);
      if (cleared) stats.normalCleared = true;
    } else {
      stats.hardHighScore = Math.max(stats.hardHighScore, score);
      if (cleared) stats.hardCleared = true;
    }
    this.saveStats(stats);

    const achievements = this.getAchievements();
    const newlyUnlocked: Achievement[] = [];

    // 1. 오늘의 가스 안전 지킴이! (제한 시간 살아남을 시)
    const survivorAch = achievements.find(a => a.id === 'survivor');
    if (survivorAch && cleared && !survivorAch.unlocked) {
      survivorAch.unlocked = true;
      survivorAch.progress = 1;
      survivorAch.unlockedAt = new Date().toLocaleDateString('ko-KR');
      newlyUnlocked.push(survivorAch);
    }

    // 2. 가스안전 전문가 (일반 모드 5,000점 이상 달성)
    const expertAch = achievements.find(a => a.id === 'expert_normal');
    if (expertAch) {
      expertAch.progress = Math.max(expertAch.progress, stats.normalHighScore);
      if (mode === 'normal' && score >= 5000 && !expertAch.unlocked) {
        expertAch.unlocked = true;
        expertAch.unlockedAt = new Date().toLocaleDateString('ko-KR');
        newlyUnlocked.push(expertAch);
      }
    }

    // 3. 가스안전 마스터 (하드 모드 16,000점 이상 달성)
    const masterAch = achievements.find(a => a.id === 'master_hard');
    if (masterAch) {
      masterAch.progress = Math.max(masterAch.progress, stats.hardHighScore);
      if (mode === 'hard' && score >= 16000 && !masterAch.unlocked) {
        masterAch.unlocked = true;
        masterAch.unlockedAt = new Date().toLocaleDateString('ko-KR');
        newlyUnlocked.push(masterAch);
      }
    }

    // 5. 가스 안전은 나에게 맡겨! (하드모드 클리어)
    const hardClearAch = achievements.find(a => a.id === 'hard_clear');
    if (hardClearAch && mode === 'hard' && cleared && !hardClearAch.unlocked) {
      hardClearAch.unlocked = true;
      hardClearAch.progress = 1;
      hardClearAch.unlockedAt = new Date().toLocaleDateString('ko-KR');
      newlyUnlocked.push(hardClearAch);
    }

    this.saveAchievements(achievements);
    return { newlyUnlocked, updatedStats: stats };
  },
};
