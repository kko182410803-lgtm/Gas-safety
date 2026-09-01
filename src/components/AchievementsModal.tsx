import React from 'react';
import { Achievement, UserStats } from '../types';
import { 
  Trophy, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Award, 
  Crown, 
  BookOpenCheck, 
  FlameKindling,
  X 
} from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  stats: UserStats;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
  stats,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const getIcon = (iconName: string, unlocked: boolean) => {
    const props = { className: `w-7 h-7 ${unlocked ? 'text-amber-400' : 'text-slate-500'}` };
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'BookOpenCheck': return <BookOpenCheck {...props} />;
      case 'FlameKindling': return <FlameKindling {...props} />;
      default: return <Trophy {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-300" />
            <div>
              <h2 className="text-xl font-black font-game">가스안전 명예의 전당 (도전과제)</h2>
              <p className="text-xs text-amber-100">
                달성 현황: <strong className="text-white font-bold">{unlockedCount} / {achievements.length}개</strong> 달성
              </p>
            </div>
          </div>
          <button
            id="btn-close-achievements"
            onClick={onClose}
            className="p-1.5 bg-black/30 hover:bg-black/50 rounded-xl transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* User Summary Stats Bar */}
        <div className="bg-slate-800/90 px-6 py-3 border-b border-slate-700 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400">일반 최고점</span>
            <div className="text-sm font-black text-emerald-400 font-game">{stats.normalHighScore.toLocaleString()}점</div>
          </div>
          <div>
            <span className="text-slate-400">하드 최고점</span>
            <div className="text-sm font-black text-red-400 font-game">{stats.hardHighScore.toLocaleString()}점</div>
          </div>
          <div>
            <span className="text-slate-400">프롤로그 클리어</span>
            <div className="text-sm font-black text-amber-400 font-game">{stats.prologueClearCount}회</div>
          </div>
        </div>

        {/* Achievements List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${
                ach.unlocked
                  ? 'bg-amber-950/30 border-amber-500/60 shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 opacity-85'
              }`}
            >
              {/* Icon / Badge */}
              <div className={`p-3 rounded-2xl shrink-0 border ${
                ach.unlocked 
                  ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10' 
                  : 'bg-slate-800 border-slate-700'
              }`}>
                {getIcon(ach.icon, ach.unlocked)}
              </div>

              {/* Details & Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-black text-base font-game flex items-center gap-1.5 ${
                    ach.unlocked ? 'text-amber-300' : 'text-slate-300'
                  }`}>
                    {ach.title}
                    {ach.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </h3>
                  {ach.unlocked && ach.unlockedAt && (
                    <span className="text-[10px] text-amber-400/80 font-semibold shrink-0">
                      {ach.unlockedAt} 달성
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {ach.description}
                </p>

                {/* Progress Bar for progressive goals */}
                {ach.maxProgress > 1 && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          ach.unlocked ? 'bg-amber-400' : 'bg-indigo-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 min-w-[50px] text-right">
                      {ach.progress.toLocaleString()} / {ach.maxProgress.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            id="btn-confirm-achievements"
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
