import React from 'react';
import { HAZARDS_DATA } from '../data/hazards';
import { HazardType } from '../types';
import { ShieldCheck, X, Sparkles, Flame, Wind, Trash2, PhoneCall, Zap } from 'lucide-react';

interface SafetyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyTipsModal: React.FC<SafetyTipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hazardKeys: HazardType[] = ['valve', 'window', 'flammables', 'cleaning', 'old_valve_call', 'hose_kink'];

  const getIcon = (type: HazardType) => {
    switch (type) {
      case 'valve': return <Flame className="w-5 h-5 text-red-400" />;
      case 'window': return <Wind className="w-5 h-5 text-sky-400" />;
      case 'flammables': return <Trash2 className="w-5 h-5 text-orange-400" />;
      case 'cleaning': return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case 'old_valve_call': return <PhoneCall className="w-5 h-5 text-indigo-400" />;
      case 'hose_kink': return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-300" />
            <div>
              <h2 className="text-xl font-black font-game">가스안전 핵심 수칙 가이드북</h2>
              <p className="text-xs text-emerald-100">위급 상황 시 꼭 기억해야 할 6대 행동요령</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/30 hover:bg-black/50 rounded-xl transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Rules Grid */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {hazardKeys.map((key, idx) => {
            const data = HAZARDS_DATA[key];
            return (
              <div
                key={key}
                className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-700">
                    {getIcon(key)}
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-amber-400">수칙 #{idx + 1}</span>
                    <h4 className="text-sm font-black text-slate-100 font-game">{data.title}</h4>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="text-red-300 font-semibold">
                    <span className="font-bold text-red-400">왜 위험한가요?</span> {data.reason}
                  </div>
                  <div className="text-emerald-300 font-semibold">
                    <span className="font-bold text-emerald-400">행동 요령:</span> {data.actionInstruction}
                  </div>
                  <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                    💡 <strong className="text-slate-300">전문가 팁:</strong> {data.educationalTip}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
