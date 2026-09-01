import React from 'react';
import { GameMode } from '../types';
import { 
  Trophy, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Maximize2, 
  Minimize2, 
  AlertCircle, 
  BookOpen, 
  Flame, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameHUDProps {
  score: number;
  timeLeft: number; // in seconds (out of 150)
  totalTime: number; // 150
  mode: GameMode;
  combo: number;
  hazardsClearedCount: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  isFullscreen: boolean;
  onToggleSound: () => void;
  onToggleVoice: () => void;
  onToggleFullscreen: () => void;
  onOpenAchievements: () => void;
  onOpenPrologue: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  floatingScore?: { value: number; id: number } | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  timeLeft,
  totalTime,
  mode,
  combo,
  hazardsClearedCount,
  soundEnabled,
  voiceEnabled,
  isFullscreen,
  onToggleSound,
  onToggleVoice,
  onToggleFullscreen,
  onOpenAchievements,
  onOpenPrologue,
  onRestart,
  onQuitToMenu,
  floatingScore,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Danger calculation: -300 is game over threshold
  // Danger meter percentage from 0% (at score >= 0) to 100% (at score <= -300)
  const dangerPercent = score < 0 ? Math.min(100, (Math.abs(score) / 300) * 100) : 0;
  const isDangerous = score <= -150;

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Upper Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700 shadow-xl">
        
        {/* Left: Mode Badge & Quick Menu Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-quit-menu"
            onClick={onQuitToMenu}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            ← 메인메뉴
          </button>

          <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase shadow-sm flex items-center gap-1 ${
            mode === 'hard'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white animate-pulse'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
          }`}>
            <Flame className="w-3.5 h-3.5" />
            {mode === 'hard' ? '하드 모드' : '일반 모드'}
          </span>

          <button
            id="btn-hud-prologue"
            onClick={onOpenPrologue}
            className="hidden sm:flex px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-xs font-bold items-center gap-1 transition"
          >
            <BookOpen className="w-3.5 h-3.5" /> 프롤로그 학습
          </button>
        </div>

        {/* Center: Live Timer & Progress Ring */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-1.5 rounded-xl border border-slate-700 shadow-inner">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">남은 플레이타임</div>
            <div className={`text-xl md:text-2xl font-black font-game tracking-wider ${
              timeLeft <= 30 ? 'text-red-400 animate-ping' : 'text-amber-400'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Time Bar */}
          <div className="w-24 md:w-36 h-2.5 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div 
              className={`h-full transition-all duration-300 ${
                timeLeft <= 30 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-emerald-400'
              }`}
              style={{ width: `${(timeLeft / totalTime) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Live Score & Danger Meter & Controls */}
        <div className="flex items-center gap-3">
          {/* Score Counter */}
          <div className="relative text-right bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-700 min-w-[110px]">
            <div className="text-[10px] text-slate-400 font-bold">안전 획득 점수</div>
            <div className={`text-xl font-black font-game ${
              score < 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {score >= 0 ? `+${score}` : score} <span className="text-xs">점</span>
            </div>

            {/* Floating Points Animation (+100 / -100) */}
            <AnimatePresence>
              {floatingScore && (
                <motion.div
                  key={floatingScore.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -25, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className={`absolute -top-6 right-2 font-black text-sm px-2 py-0.5 rounded-full shadow-lg ${
                    floatingScore.value > 0 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {floatingScore.value > 0 ? `+${floatingScore.value}` : floatingScore.value}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Danger Warning Gauge (-300 is Game Over) */}
          <div className="flex flex-col items-center bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-700">
            <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              <AlertCircle className={`w-3 h-3 ${isDangerous ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
              위험도 {score < 0 ? `${Math.round(dangerPercent)}%` : '0%'}
            </div>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-slate-700">
              <div 
                className={`h-full transition-all duration-200 ${
                  dangerPercent > 66 ? 'bg-red-600 animate-pulse' : dangerPercent > 33 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${dangerPercent}%` }}
              />
            </div>
            <span className="text-[8px] text-slate-500">-300점 시 종료</span>
          </div>

          {/* Quick HUD Tool Buttons */}
          <div className="flex items-center gap-1">
            <button
              id="btn-hud-achievements"
              onClick={onOpenAchievements}
              title="도전과제 보기"
              aria-label="도전과제 보기"
              className="p-2 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-xl transition shadow-sm"
            >
              <Trophy className="w-4 h-4" />
            </button>

            <button
              id="btn-hud-sound"
              onClick={onToggleSound}
              title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
              aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition shadow-sm"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="btn-hud-voice"
              onClick={onToggleVoice}
              title={voiceEnabled ? '음성 나레이션 끄기' : '음성 나레이션 켜기'}
              aria-label={voiceEnabled ? '음성 나레이션 끄기' : '음성 나레이션 켜기'}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition shadow-sm"
            >
              {voiceEnabled ? <Mic className="w-4 h-4 text-indigo-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="btn-hud-fullscreen"
              onClick={onToggleFullscreen}
              title="전체화면 전환 (체험관 TV/태블릿용)"
              aria-label="전체화면 전환 (체험관 TV/태블릿용)"
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition shadow-sm"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              id="btn-hud-restart"
              onClick={onRestart}
              title="게임 다시시작"
              aria-label="게임 다시시작"
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Sub HUD: Combo Multiplier and Solved Counter */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          {combo > 1 && (
            <motion.span 
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.2, 1] }}
              className="bg-amber-500/20 border border-amber-500 text-amber-300 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {combo} 연속 안전 성공!
            </motion.span>
          )}
          <span className="text-slate-400">
            해결한 위험 요소: <strong className="text-slate-200">{hazardsClearedCount}</strong>회
          </span>
        </div>

        <div className="text-slate-400 text-[11px]">
          💡 힌트: 화면에서 붉게 깜빡이는 위험 요소를 터치하세요!
        </div>
      </div>
    </div>
  );
};
