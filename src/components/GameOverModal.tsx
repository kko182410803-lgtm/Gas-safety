import React from 'react';
import { Achievement, GameMode, GameStatus } from '../types';
import { 
  RotateCcw, 
  Flame, 
  BookOpen, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles
} from 'lucide-react';

interface GameOverModalProps {
  status: GameStatus; // 'gameover' | 'victory'
  score: number;
  mode: GameMode;
  hazardsCleared: number;
  newlyUnlockedAchievements: Achievement[];
  onRestart: () => void;
  onGoToMenu: () => void;
  onOpenPrologue: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  score,
  mode,
  hazardsCleared,
  newlyUnlockedAchievements,
  onRestart,
  onGoToMenu,
  onOpenPrologue,
}) => {
  const isVictory = status === 'victory';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className={`p-6 text-center text-white relative ${
          isVictory 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700' 
            : 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mb-2 shadow-lg">
            {isVictory ? (
              <CheckCircle className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-white animate-pulse" />
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-black font-game">
            {isVictory ? '가스안전 수호 성공! 🏆' : '가스 경보 발생 (게임오버) ⚠️'}
          </h2>
          <p className="text-xs md:text-sm text-white/90 mt-1 font-medium">
            {isVictory 
              ? '2분 30초 동안 모든 가스 위험 요소를 안전하게 대처하여 집을 지켜냈습니다!' 
              : '안전 점수가 -300점에 도달하여 가스 위험 경보가 작동했습니다. 다시 도전해볼까요?'}
          </p>
        </div>

        {/* Score & Stats Breakdown */}
        <div className="p-6 space-y-4">
          
          {/* Main Score Display */}
          <div className="bg-slate-800/90 border-2 border-slate-700 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">최종 획득 점수</span>
            <div className={`text-3xl md:text-4xl font-black font-game mt-0.5 ${
              score >= 10000 ? 'text-amber-400' : score > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {score.toLocaleString()} <span className="text-base font-sans">점</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-4">
              <span>난이도: <strong className="text-slate-200">{mode === 'hard' ? '하드 모드' : '일반 모드'}</strong></span>
              <span>해결한 위험: <strong className="text-slate-200">{hazardsCleared}개</strong></span>
            </div>
          </div>

          {/* Newly Unlocked Achievements Toast */}
          {newlyUnlockedAchievements.length > 0 && (
            <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 space-y-2">
              <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                새로운 도전과제 달성!
              </div>
              <div className="space-y-1">
                {newlyUnlockedAchievements.map(ach => (
                  <div key={ach.id} className="flex items-center gap-2 text-xs font-bold text-slate-100 bg-slate-900/60 p-2 rounded-xl">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{ach.title}</span>
                    <span className="text-[10px] text-amber-300 font-normal ml-auto">달성 완료!</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            <button
              id="btn-gameover-restart"
              onClick={onRestart}
              className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              <RotateCcw className="w-5 h-5" /> 다시 도전
            </button>

            <button
              id="btn-gameover-menu"
              onClick={onGoToMenu}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-slate-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-5 h-5 text-amber-400" /> 돌아가기
            </button>

            <button
              id="btn-gameover-prologue"
              onClick={onOpenPrologue}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-slate-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <BookOpen className="w-5 h-5 text-sky-400" /> 프롤로그 복습
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
