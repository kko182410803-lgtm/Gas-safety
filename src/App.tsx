import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameMode, 
  GameStatus, 
  ActiveHazard, 
  HazardType, 
  Achievement, 
  UserStats 
} from './types';
import { KitchenScene } from './components/KitchenScene';
import { GameHUD } from './components/GameHUD';
import { PrologueModal } from './components/PrologueModal';
import { AchievementsModal } from './components/AchievementsModal';
import { GameOverModal } from './components/GameOverModal';
import { SafetyTipsModal } from './components/SafetyTipsModal';
import { storage } from './utils/storage';
import { soundManager } from './utils/audio';
import { 
  Flame, 
  Play, 
  BookOpen, 
  Trophy, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Maximize2, 
  Sparkles,
  Award,
  Lock,
  RotateCcw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

const TOTAL_GAME_TIME = 150; // 2분 30초 (150초)
const ALL_HAZARD_TYPES: HazardType[] = [
  'valve',
  'window',
  'flammables',
  'cleaning',
  'old_valve_call',
  'hose_kink',
];

export default function App() {
  // Game states
  const [mode, setMode] = useState<GameMode>('menu');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_GAME_TIME);
  const [combo, setCombo] = useState<number>(0);
  const [hazardsClearedCount, setHazardsClearedCount] = useState<number>(0);
  const [activeHazards, setActiveHazards] = useState<ActiveHazard[]>([]);
  
  // Storage & Modal states
  const [stats, setStats] = useState<UserStats>(storage.getStats());
  const [achievements, setAchievements] = useState<Achievement[]>(storage.getAchievements());
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // Modals
  const [isPrologueOpen, setIsPrologueOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isSafetyTipsOpen, setIsSafetyTipsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetToast, setResetToast] = useState(false);
  
  // Audio & Display
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [floatingScore, setFloatingScore] = useState<{ value: number; id: number } | null>(null);
  const [dishclothSelected, setDishclothSelected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const respawnCooldownTimer = useRef<number>(0);

  // Sync audio toggles
  useEffect(() => {
    soundManager.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    soundManager.voiceEnabled = voiceEnabled;
  }, [voiceEnabled]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Helper to spawn a new hazard
  const spawnHazard = useCallback((currentList: ActiveHazard[], selectedMode: GameMode): ActiveHazard[] => {
    if (currentList.length >= 3) return currentList; // Max 3 simultaneous hazards

    // Find unused hazard types
    const activeTypes = new Set(currentList.map(h => h.type));
    const availableTypes = ALL_HAZARD_TYPES.filter(t => !activeTypes.has(t));
    if (availableTypes.length === 0) return currentList;

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const timeLimit = selectedMode === 'hard' ? 5.0 : 10.0;

    soundManager.playHazardWarning();

    const newHazard: ActiveHazard = {
      id: `${randomType}-${Date.now()}-${Math.random()}`,
      type: randomType,
      timeLeft: timeLimit,
      totalTime: timeLimit,
      spawnedAt: Date.now(),
      flammablesCount: randomType === 'flammables' ? 4 : undefined,
      windowClickCount: randomType === 'window' ? 2 : undefined,
    };

    return [...currentList, newHazard];
  }, []);

  // Start a new game
  const startGame = useCallback((chosenMode: 'normal' | 'hard') => {
    setMode(chosenMode);
    setStatus('playing');
    setScore(0);
    setTimeLeft(TOTAL_GAME_TIME);
    setCombo(0);
    setHazardsClearedCount(0);
    setNewlyUnlocked([]);
    setDishclothSelected(false);
    respawnCooldownTimer.current = 0;

    // Spawn 2 initial hazards immediately (up to 3 max)
    let initialList = spawnHazard([], chosenMode);
    initialList = spawnHazard(initialList, chosenMode);
    if (chosenMode === 'hard') {
      initialList = spawnHazard(initialList, chosenMode);
    }
    setActiveHazards(initialList);
  }, [spawnHazard]);

  // End Game (Clear or Game Over)
  const handleEndGame = useCallback((finalStatus: 'victory' | 'gameover', currentScore: number, clearedHazards: number, currentMode: GameMode) => {
    setStatus(finalStatus);
    setActiveHazards([]);

    if (finalStatus === 'victory') {
      soundManager.playVictory();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } else {
      soundManager.playFailure();
    }

    if (currentMode === 'normal' || currentMode === 'hard') {
      const result = storage.checkGameAchievements(
        currentMode,
        currentScore,
        finalStatus === 'victory',
        clearedHazards
      );
      setStats(result.updatedStats);
      setAchievements(storage.getAchievements());
      if (result.newlyUnlocked.length > 0) {
        setNewlyUnlocked(result.newlyUnlocked);
        soundManager.playAchievement();
      }
    }
  }, []);

  // Main Tick Game Loop
  useEffect(() => {
    if (status !== 'playing') return;

    const interval = setInterval(() => {
      // 1. Decrement overall time left (2:30 countdown)
      setTimeLeft((prevTime) => {
        const nextTime = Math.max(0, prevTime - 0.1);
        if (nextTime <= 0) {
          handleEndGame('victory', score, hazardsClearedCount, mode);
        }
        return nextTime;
      });

      // 2. Process active hazards timers
      setActiveHazards((prevHazards) => {
        let scorePenalty = 0;
        let comboBroken = false;
        const updatedList: ActiveHazard[] = [];

        prevHazards.forEach((hazard) => {
          const nextHazardTime = hazard.timeLeft - 0.1;
          if (nextHazardTime <= 0) {
            // Hazard Timed Out! -100 points
            scorePenalty -= 100;
            comboBroken = true;
            soundManager.playFailure();
          } else {
            updatedList.push({
              ...hazard,
              timeLeft: nextHazardTime,
            });
          }
        });

        if (scorePenalty < 0) {
          setScore((s) => {
            const nextScore = s + scorePenalty;
            setFloatingScore({ value: scorePenalty, id: Date.now() });
            // Check Game Over Condition: -300 points or lower!
            if (nextScore <= -300) {
              setTimeout(() => {
                handleEndGame('gameover', nextScore, hazardsClearedCount, mode);
              }, 100);
            }
            return nextScore;
          });
        }

        if (comboBroken) {
          setCombo(0);
        }

        // 3. Hazard Spawner logic (faster respawn, max 3)
        const respawnInterval = mode === 'hard' ? 0.6 : 1.5;
        respawnCooldownTimer.current += 0.1;

        if (updatedList.length < 3 && respawnCooldownTimer.current >= respawnInterval) {
          respawnCooldownTimer.current = 0;
          return spawnHazard(updatedList, mode);
        }

        return updatedList;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [status, mode, score, hazardsClearedCount, spawnHazard, handleEndGame]);

  // Handle Hazard Interaction from Scene Click
  const handleHazardInteract = (hazardType: HazardType) => {
    if (status !== 'playing') return;

    const targetHazard = activeHazards.find(h => h.type === hazardType);
    if (!targetHazard) return;

    // Special sound cues by type
    if (hazardType === 'valve') soundManager.playValveTurn();
    else if (hazardType === 'window') soundManager.playWindowWhoosh();
    else if (hazardType === 'cleaning') soundManager.playWipe();
    else if (hazardType === 'old_valve_call') soundManager.playPhoneCall();
    else soundManager.playSuccess(combo + 1);

    // Reward points (+100)
    const pointsGained = 100;
    setScore(s => s + pointsGained);
    setFloatingScore({ value: pointsGained, id: Date.now() });
    setCombo(c => c + 1);
    setHazardsClearedCount(h => h + 1);
    setDishclothSelected(false);

    // Remove cleared hazard and immediately trigger fast replenishment
    setActiveHazards(prev => {
      const remaining = prev.filter(h => h.id !== targetHazard.id);
      return remaining;
    });

    // Immediate fast replenishment when one is cleared (even faster on hard mode)
    const instantRespawnDelay = mode === 'hard' ? 150 : 400;
    setTimeout(() => {
      setActiveHazards(currentList => {
        if (currentList.length < 3) {
          return spawnHazard(currentList, mode);
        }
        return currentList;
      });
    }, instantRespawnDelay);

    // Reset respawn timer
    respawnCooldownTimer.current = 0;
  };

  // Prologue completed callback
  const handlePrologueFinished = () => {
    const result = storage.incrementPrologueClear();
    setStats(storage.getStats());
    setAchievements(storage.getAchievements());
    if (result.newlyUnlocked.length > 0) {
      setNewlyUnlocked(result.newlyUnlocked);
      soundManager.playAchievement();
    }
  };

  // Reset entire game progress
  const handleConfirmReset = () => {
    const fresh = storage.resetAllGameData();
    setStats(fresh.stats);
    setAchievements(fresh.achievements);
    setScore(0);
    setCombo(0);
    setHazardsClearedCount(0);
    setActiveHazards([]);
    setStatus('idle');
    setMode('menu');
    setIsResetConfirmOpen(false);
    setResetToast(true);
    setTimeout(() => setResetToast(false), 3000);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none font-sans"
    >
      {/* 1080p Landscape Optimized Frame */}
      <main className="w-full max-w-[1500px] aspect-[16/9] min-h-[560px] max-h-[92vh] bg-slate-900 border-4 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-3 md:p-5 relative">
        
        {/* VIEW 1: MAIN MENU */}
        {mode === 'menu' && (
          <div className="w-full h-full flex flex-col justify-between items-center text-center relative overflow-hidden py-4 px-2">
            
            {/* Background Decorative Aura */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar Controls */}
            <div className="w-full flex items-center justify-between z-10 px-2">
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                가스안전 체험교실
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-sound-toggle"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title="효과음 켜기/끄기"
                  aria-label="효과음 켜기/끄기"
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition border border-slate-700"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>

                <button
                  id="btn-voice-toggle"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  title="음성 나레이션 켜기/끄기"
                  aria-label="음성 나레이션 켜기/끄기"
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition border border-slate-700"
                >
                  {voiceEnabled ? <Mic className="w-4 h-4 text-indigo-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
                </button>

                <button
                  id="btn-fullscreen-toggle"
                  onClick={toggleFullscreen}
                  title="전체화면 모드"
                  aria-label="전체화면 모드"
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition border border-slate-700"
                >
                  <Maximize2 className="w-4 h-4 text-amber-400" />
                </button>

                {/* 전체 초기화 버튼 */}
                <button
                  id="btn-reset-game-all"
                  onClick={() => setIsResetConfirmOpen(true)}
                  title="게임 전체 초기화"
                  aria-label="게임 전체 초기화"
                  className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>전체 초기화</span>
                </button>
              </div>
            </div>

            {/* Center Hero Title */}
            <div className="space-y-2 z-10 my-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="p-3 bg-gradient-to-tr from-amber-500 to-red-500 rounded-3xl shadow-xl">
                  <Flame className="w-10 h-10 md:w-12 md:h-12 text-white animate-pulse" />
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-game tracking-tight bg-gradient-to-r from-amber-300 via-orange-300 to-amber-100 bg-clip-text text-transparent">
                  가스안전 챌린지
                </h1>
              </motion.div>

              <p className="text-xs md:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                창문 환기, 가스 밸브 잠그기, 가연물 치우기 등 실생활 가스 안전 수칙을 지켜 집을 수호하세요!<br />
                <span className="text-amber-400 font-bold">플레이타임 2분 30초</span> 동안 안전 점수를 획득하고 도전과제를 달성해보세요.
              </p>
            </div>

            {/* Main Action Buttons Grid */}
            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 z-10">
              
              {/* Button 1: Prologue / Educational Mode */}
              <button
                id="btn-main-prologue"
                onClick={() => setIsPrologueOpen(true)}
                className="p-4 md:p-5 bg-gradient-to-b from-amber-700/80 to-amber-900/90 hover:from-amber-600 hover:to-amber-800 border-2 border-amber-500/80 rounded-2xl flex flex-col items-center justify-center gap-2 transition group shadow-xl hover:scale-[1.02]"
              >
                <BookOpen className="w-7 h-7 text-amber-300 group-hover:scale-110 transition" />
                <div className="text-left sm:text-center">
                  <div className="font-black text-base md:text-lg text-white font-game flex items-center justify-center gap-1.5">
                    프롤로그 체험
                    {stats.prologueClearCount > 0 && <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/50">완료</span>}
                  </div>
                  <div className="text-[11px] text-amber-200">안전 수칙과 이유를 직접 배워요 (누적 {stats.prologueClearCount}회)</div>
                </div>
              </button>

              {/* Button 2: Normal Game Mode (Unlocked after playing prologue at least once) */}
              {stats.prologueClearCount > 0 ? (
                <button
                  id="btn-main-start-normal"
                  onClick={() => startGame('normal')}
                  className="p-4 md:p-5 bg-gradient-to-b from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-700 border-2 border-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-xl hover:scale-105"
                >
                  <Play className="w-8 h-8 text-white fill-white animate-bounce" />
                  <div className="text-left sm:text-center">
                    <div className="font-black text-base md:text-lg text-white font-game flex items-center justify-center gap-1.5">
                      일반 모드 시작
                      {stats.normalCleared && <span className="text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/50">클리어</span>}
                    </div>
                    <div className="text-[11px] text-emerald-100">기본 가스안전 챌린지 플레이</div>
                  </div>
                </button>
              ) : (
                <button
                  id="btn-main-start-normal-locked"
                  onClick={() => setIsPrologueOpen(true)}
                  className="p-4 md:p-5 bg-slate-800/70 border-2 border-slate-700/80 rounded-2xl flex flex-col items-center justify-center gap-2 transition opacity-75 hover:opacity-90 group"
                  title="프롤로그를 먼저 플레이하여 잠금을 해제하세요"
                >
                  <Lock className="w-8 h-8 text-amber-400 group-hover:scale-110 transition" />
                  <div className="text-left sm:text-center">
                    <div className="font-black text-base md:text-lg text-slate-300 font-game">일반 모드 (잠김)</div>
                    <div className="text-[11px] text-amber-400 font-semibold">🔒 프롤로그를 먼저 플레이하세요</div>
                  </div>
                </button>
              )}

              {/* Button 3: Hard Game Mode (Unlocked after clearing normal mode) */}
              {stats.normalCleared ? (
                <button
                  id="btn-main-start-hard"
                  onClick={() => startGame('hard')}
                  className="p-4 md:p-5 bg-gradient-to-b from-red-600 to-amber-800 hover:from-red-500 hover:to-amber-700 border-2 border-red-400 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-xl hover:scale-[1.02]"
                >
                  <Flame className="w-8 h-8 text-white fill-white animate-pulse" />
                  <div className="text-left sm:text-center">
                    <div className="font-black text-base md:text-lg text-white font-game flex items-center justify-center gap-1.5">
                      하드 모드 도전
                      {stats.hardCleared && <span className="text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/50">마스터</span>}
                    </div>
                    <div className="text-[11px] text-red-100">고난이도 가스안전 챌린지 플레이</div>
                  </div>
                </button>
              ) : (
                <div
                  id="btn-main-start-hard-locked"
                  className="p-4 md:p-5 bg-slate-800/50 border-2 border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <Lock className="w-8 h-8 text-slate-400" />
                  <div className="text-left sm:text-center">
                    <div className="font-black text-base md:text-lg text-slate-400 font-game">하드 모드 (잠김)</div>
                    <div className="text-[11px] text-slate-400 font-medium">🔒 일반 모드를 클리어하면 열립니다</div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Secondary Links (Achievements, Safety Guide) */}
            <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-3 z-10 border-t border-slate-800">
              <button
                id="btn-menu-achievements"
                onClick={() => setIsAchievementsOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 transition"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                도전과제 ({achievements.filter(a => a.unlocked).length}/{achievements.length})
              </button>

              <button
                id="btn-menu-safety-guide"
                onClick={() => setIsSafetyTipsOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                6대 안전 수칙 가이드
              </button>
            </div>

          </div>
        )}

        {/* VIEW 2: ACTIVE GAMEPLAY (NORMAL & HARD MODES) */}
        {(mode === 'normal' || mode === 'hard') && (
          <div className="w-full h-full flex flex-col justify-between gap-2 md:gap-3">
            
            {/* Top HUD Bar */}
            <GameHUD
              score={score}
              timeLeft={timeLeft}
              totalTime={TOTAL_GAME_TIME}
              mode={mode}
              combo={combo}
              hazardsClearedCount={hazardsClearedCount}
              soundEnabled={soundEnabled}
              voiceEnabled={voiceEnabled}
              isFullscreen={isFullscreen}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
              onToggleFullscreen={toggleFullscreen}
              onOpenAchievements={() => setIsAchievementsOpen(true)}
              onOpenPrologue={() => setIsPrologueOpen(true)}
              onRestart={() => startGame(mode)}
              onQuitToMenu={() => {
                setStatus('idle');
                setMode('menu');
              }}
              floatingScore={floatingScore}
            />

            {/* Interactive Kitchen Sandbox Area */}
            <div className="flex-1 w-full relative min-h-0">
              <KitchenScene
                activeHazards={activeHazards}
                onInteract={handleHazardInteract}
                cleaningDishclothSelected={dishclothSelected}
                onToggleDishcloth={() => setDishclothSelected(!dishclothSelected)}
              />
            </div>

          </div>
        )}

      </main>

      {/* MODALS */}
      {/* 1. Prologue / Educational Tutorial Modal */}
      <PrologueModal
        isOpen={isPrologueOpen}
        onClose={() => setIsPrologueOpen(false)}
        onStartNormalMode={() => {
          setIsPrologueOpen(false);
          startGame('normal');
        }}
        onStartHardMode={() => {
          setIsPrologueOpen(false);
          startGame('hard');
        }}
        onPrologueCompleted={handlePrologueFinished}
        prologueClearCount={stats.prologueClearCount}
        normalCleared={stats.normalCleared}
      />

      {/* 2. Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={achievements}
        stats={stats}
      />

      {/* 3. Safety Tips Guidebook Modal */}
      <SafetyTipsModal
        isOpen={isSafetyTipsOpen}
        onClose={() => setIsSafetyTipsOpen(false)}
      />

      {/* 4. Game Over / Victory Modal */}
      {(status === 'gameover' || status === 'victory') && (
        <GameOverModal
          status={status}
          score={score}
          mode={mode}
          hazardsCleared={hazardsClearedCount}
          newlyUnlockedAchievements={newlyUnlocked}
          onRestart={() => startGame(mode === 'hard' ? 'hard' : 'normal')}
          onGoToMenu={() => {
            setStatus('idle');
            setMode('menu');
          }}
          onOpenPrologue={() => setIsPrologueOpen(true)}
        />
      )}

      {/* 5. Complete Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border-4 border-red-600/80 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black font-game text-white">
                게임을 전체 초기화할까요?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                프롤로그 완료 횟수, 일반/하드 모드 해제 상태, 달성한 도전과제 및 최고 점수 등 모든 데이터가 처음 상태로 초기화됩니다.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                id="btn-cancel-reset"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                취소
              </button>
              <button
                id="btn-confirm-reset"
                onClick={handleConfirmReset}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black shadow-lg transition"
              >
                초기화 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Success Toast notification */}
      {resetToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-4 py-2 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs">게임 데이터가 성공적으로 초기화되었습니다.</span>
        </div>
      )}

      {/* Real-time Achievement Toast notification */}
      {newlyUnlocked.length > 0 && status === 'playing' && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2 animate-bounce">
          <Award className="w-6 h-6 text-slate-950" />
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-950">도전과제 달성!</div>
            <div className="text-xs font-black">{newlyUnlocked[0].title}</div>
          </div>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}
