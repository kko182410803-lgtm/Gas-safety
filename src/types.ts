export type GameMode = 'menu' | 'prologue' | 'normal' | 'hard';

export type GameStatus = 'idle' | 'playing' | 'gameover' | 'victory';

export type HazardType = 
  | 'valve'          // 1. 가스 밸브 잠그기 ("가스가 새면 위험하기 때문")
  | 'window'         // 2. 창문 열기 ("가스 때문에 환기를 시켜야하기 때문")
  | 'flammables'     // 3. 가스레인지 주변 가연물 치우기 ("가연성 물품을 불 근처에 두는건 위험해")
  | 'cleaning'       // 4. 가스레인지 주변 청소하기 ("주변이 더러우면 불이 붙을 수도 있어")
  | 'old_valve_call' // 5. 노후 가스 밸브 전문가에게 전화하기 ("오래된 것은 방심하면 큰 불이 일어날 수 있어")
  | 'hose_kink';     // 6. 눌린 가스 호스 펴주기 ("누르거나 꺾이지 않게 하자")

export interface ActiveHazard {
  id: string;
  type: HazardType;
  timeLeft: number;      // remaining time in seconds
  totalTime: number;     // initial time limit (10s normal / 5s hard)
  spawnedAt: number;     // timestamp
  flammablesCount?: number; // for flammables: 4 items to clear
  windowClickCount?: number; // for window: 2 clicks to fully open
  phoneCallPending?: boolean; // phone call in progress
  cleaningToolSelected?: boolean; // for cleaning: dishcloth selected
}

export interface HazardConfig {
  type: HazardType;
  title: string;
  actionInstruction: string;
  reason: string;
  locationDescription: string;
  educationalTip: string;
  iconName: string;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface GameScoreRecord {
  id: string;
  playerName: string;
  score: number;
  mode: 'normal' | 'hard';
  cleared: boolean;
  hazardsCleared: number;
  date: string;
}

export interface UserStats {
  prologueClearCount: number;
  normalHighScore: number;
  hardHighScore: number;
  normalCleared: boolean;
  hardCleared: boolean;
  totalHazardsResolved: number;
  totalGamesPlayed: number;
}
