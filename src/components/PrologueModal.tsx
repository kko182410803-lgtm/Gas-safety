import React, { useState, useEffect } from 'react';
import { HazardType } from '../types';
import { PROLOGUE_STEPS, HAZARDS_DATA } from '../data/hazards';
import { KitchenScene } from './KitchenScene';
import { soundManager } from '../utils/audio';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Volume2, 
  Sparkles, 
  Play, 
  Flame, 
  RotateCcw,
  Lock,
  HelpCircle,
  MousePointerClick
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrologueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNormalMode: () => void;
  onStartHardMode: () => void;
  onPrologueCompleted: () => void;
  prologueClearCount: number;
  normalCleared: boolean;
}

export const PrologueModal: React.FC<PrologueModalProps> = ({
  isOpen,
  onClose,
  onStartNormalMode,
  onStartHardMode,
  onPrologueCompleted,
  prologueClearCount,
  normalCleared,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepCompleted, setStepCompleted] = useState<boolean[]>(new Array(6).fill(false));
  const [isFinished, setIsFinished] = useState(false);
  const [dishclothSelected, setDishclothSelected] = useState(false);

  const currentStep = PROLOGUE_STEPS[currentStepIndex];
  const currentHazardData = HAZARDS_DATA[currentStep?.hazardType || 'valve'];

  useEffect(() => {
    if (isOpen && currentStep && !isFinished) {
      soundManager.speak(currentStep.characterDialogue);
    }
    return () => {
      soundManager.stopVoice();
    };
  }, [isOpen, currentStepIndex, isFinished]);

  if (!isOpen) return null;

  const handleStepInteract = (hazardType: HazardType) => {
    if (hazardType === currentStep.hazardType) {
      soundManager.playSuccess(1);
      const updated = [...stepCompleted];
      updated[currentStepIndex] = true;
      setStepCompleted(updated);

      // Advance after a brief delay or complete
      setTimeout(() => {
        if (currentStepIndex < PROLOGUE_STEPS.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          setDishclothSelected(false);
        } else {
          setIsFinished(true);
          onPrologueCompleted();
          soundManager.playVictory();
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
        }
      }, 700);
    }
  };

  const handleRestartPrologue = () => {
    setCurrentStepIndex(0);
    setStepCompleted(new Array(6).fill(false));
    setIsFinished(false);
    setDishclothSelected(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border-4 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-4 sm:px-6 py-3 flex items-center justify-between text-white shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-black font-game flex items-center gap-2">
                가스안전 체험교실 프롤로그
                <span className="text-xs bg-amber-900/70 text-amber-200 px-2.5 py-0.5 rounded-full font-sans border border-amber-300/40">
                  누적 완료: {prologueClearCount}회 / 15회 목표
                </span>
              </h2>
              <p className="text-xs text-amber-100 opacity-90 hidden sm:block">
                가스 위험 상황 대처 수칙과 그 이유를 직접 조작하며 배우는 교육 모드입니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-prologue-tts"
              onClick={() => soundManager.speak(currentStep?.characterDialogue || '')}
              title="음성 다시 듣기"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition flex items-center gap-1 text-xs font-bold"
            >
              <Volume2 className="w-4 h-4" /> <span className="hidden sm:inline">음성 듣기</span>
            </button>
            <button
              id="btn-close-prologue"
              onClick={onClose}
              className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white rounded-xl text-xs font-bold transition"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!isFinished ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
            
            {/* Top Educational & Dialogue Card (Always prominent and highly visible) */}
            <div className="bg-slate-800/95 border-2 border-amber-500/50 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
              
              {/* Step indicator & header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/50">
                    STEP {currentStepIndex + 1} / 6
                  </span>
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-white font-game">
                    {currentStep.title}
                  </h3>
                </div>

                {/* Progress Dots */}
                <div className="flex items-center gap-1.5">
                  {PROLOGUE_STEPS.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setDishclothSelected(false);
                      }}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === currentStepIndex
                          ? 'bg-amber-400 w-7'
                          : stepCompleted[idx]
                          ? 'bg-emerald-400 w-2.5'
                          : 'bg-slate-700 w-2.5 hover:bg-slate-600'
                      }`}
                      title={`${idx + 1}단계: ${step.title}`}
                    />
                  ))}
                </div>
              </div>

              {/* 3-Column Educational Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                
                {/* 1. Character Speech */}
                <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
                  <div>
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>가스안전 도우미 가스봇:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                      "{currentStep.characterDialogue}"
                    </p>
                  </div>
                </div>

                {/* 2. Why do this? (Educational Reasoning) */}
                <div className="bg-red-500/15 border-2 border-red-500/40 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-red-400 flex items-center gap-1.5 mb-1.5">
                      <HelpCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>왜 이렇게 해야 하나요?</span>
                    </div>
                    <p className="text-xs sm:text-sm text-red-100 font-bold leading-relaxed">
                      👉 {currentHazardData.reason}
                    </p>
                  </div>
                </div>

                {/* 3. Practical Interaction Guide */}
                <div className="bg-emerald-500/15 border-2 border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      <MousePointerClick className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>아래 주방에서 직접 체험하기</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-100 font-bold leading-relaxed">
                      {currentStep.hazardType === 'cleaning'
                        ? '1. 싱크대의 항균 행주를 터치하여 들기 ➔ 2. 가스레인지 버너 기름때 터치!'
                        : currentStep.guideText}
                    </p>
                  </div>
                  {currentStep.hazardType === 'cleaning' && (
                    <div className="mt-2 text-[11px] font-extrabold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                      상태: {dishclothSelected ? '✅ 행주 선택됨 (버너를 터치하세요)' : '✋ 먼저 행주를 터치하세요'}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Interactive Kitchen Scene Sandbox */}
            <div className="w-full h-[360px] sm:h-[420px] relative rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner bg-slate-950">
              <KitchenScene
                activeHazards={[]}
                onInteract={handleStepInteract}
                isPrologue={true}
                highlightedHazard={currentStep.hazardType}
                cleaningDishclothSelected={dishclothSelected}
                onToggleDishcloth={() => setDishclothSelected(!dishclothSelected)}
              />
            </div>

            {/* Bottom Navigation Toolbar */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <button
                id="btn-prologue-prev"
                disabled={currentStepIndex === 0}
                onClick={() => {
                  if (currentStepIndex > 0) {
                    setCurrentStepIndex(prev => prev - 1);
                    setDishclothSelected(false);
                  }
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow"
              >
                <ChevronLeft className="w-4 h-4" /> 이전 단계
              </button>

              <div className="text-xs text-slate-300 font-medium text-center hidden sm:block">
                화면 속 반짝이는 주방 요소를 터치하거나 [실행 완료 & 다음] 버튼을 누르세요.
              </div>

              <button
                id="btn-prologue-next"
                onClick={() => handleStepInteract(currentStep.hazardType)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg transition"
              >
                실행 완료 & 다음 단계 <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        ) : (
          /* Finished Screen: Complete Review & Game Mode Choice */
          <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 border-4 border-emerald-400 rounded-full flex items-center justify-center text-emerald-400 shadow-xl animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2 max-w-xl">
              <h3 className="text-2xl md:text-3xl font-black font-game text-white">
                가스안전 프롤로그 수료 완료! 🎉
              </h3>
              <p className="text-sm md:text-base text-slate-300">
                가스 밸브 잠그기, 창문 환기, 가연물 치우기, 기름때 청소, 노후 부품 신고, 호스 관리까지
                6대 핵심 안전 수칙을 완벽하게 학습하셨습니다!
              </p>
              <div className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold">
                🏆 프롤로그 클리어 횟수: {prologueClearCount + 1}회 (15회 완료 시 도전과제 달성!)
              </div>
            </div>

            {/* Mode Selection Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl pt-2">
              
              {/* Option 1: Replay Prologue */}
              <button
                id="btn-replay-prologue"
                onClick={handleRestartPrologue}
                className="p-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-2 transition group shadow-lg"
              >
                <RotateCcw className="w-6 h-6 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-black text-sm text-slate-200">프롤로그 다시보기</span>
                <span className="text-[11px] text-slate-400">안전 수칙을 다시 복습해요</span>
              </button>

              {/* Option 2: Normal Game Mode (Unlocked!) */}
              <button
                id="btn-start-normal-from-prologue"
                onClick={() => {
                  onClose();
                  onStartNormalMode();
                }}
                className="p-4 bg-gradient-to-b from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border-2 border-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-xl scale-105"
              >
                <Play className="w-7 h-7 text-white fill-white" />
                <span className="font-black text-sm text-white">일반 모드 시작</span>
                <span className="text-[11px] text-emerald-100 font-bold">🔓 프롤로그 완료로 잠금 해제됨!</span>
              </button>

              {/* Option 3: Hard Game Mode (Unlocked only if Normal mode cleared) */}
              {normalCleared ? (
                <button
                  id="btn-start-hard-from-prologue"
                  onClick={() => {
                    onClose();
                    onStartHardMode();
                  }}
                  className="p-4 bg-gradient-to-b from-red-600 to-amber-700 hover:from-red-500 hover:to-amber-600 border-2 border-red-400 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-xl"
                >
                  <Flame className="w-7 h-7 text-white fill-white" />
                  <span className="font-black text-sm text-white">하드 모드 시작</span>
                  <span className="text-[11px] text-red-100 font-bold">🔓 일반 모드 클리어로 해제됨!</span>
                </button>
              ) : (
                <div className="p-4 bg-slate-800/60 border-2 border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-60 cursor-not-allowed">
                  <Lock className="w-7 h-7 text-slate-400" />
                  <span className="font-black text-sm text-slate-400">하드 모드 잠김</span>
                  <span className="text-[11px] text-slate-500 font-medium">🔒 일반 모드를 먼저 클리어하세요</span>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
