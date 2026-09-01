import React, { useState } from 'react';
import { ActiveHazard, HazardType } from '../types';
import { HAZARDS_DATA } from '../data/hazards';
import { 
  Flame, 
  Wind, 
  PhoneCall, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KitchenSceneProps {
  activeHazards: ActiveHazard[];
  onInteract: (hazardType: HazardType, extraData?: any) => void;
  isPrologue?: boolean;
  highlightedHazard?: HazardType | null;
  cleaningDishclothSelected?: boolean;
  onToggleDishcloth?: () => void;
}

export const KitchenScene: React.FC<KitchenSceneProps> = ({
  activeHazards,
  onInteract,
  isPrologue = false,
  highlightedHazard = null,
  cleaningDishclothSelected = false,
  onToggleDishcloth,
}) => {
  // Local state for visual feedbacks
  const [phoneDialing, setPhoneDialing] = useState(false);
  const [wipingSpot, setWipingSpot] = useState(false);

  const [dishclothNeedPrompt, setDishclothNeedPrompt] = useState(false);

  const getHazard = (type: HazardType) => activeHazards.find(h => h.type === type);

  const valveHazard = getHazard('valve');
  const windowHazard = getHazard('window');
  const flammablesHazard = getHazard('flammables');
  const cleaningHazard = getHazard('cleaning');
  const oldValveHazard = getHazard('old_valve_call');
  const hoseHazard = getHazard('hose_kink');

  // Check if an item is currently targeted or highlighted in prologue
  const isTargeted = (type: HazardType) => {
    if (isPrologue) return highlightedHazard === type;
    return !!getHazard(type);
  };

  const handlePhoneClick = () => {
    if (isTargeted('old_valve_call')) {
      setPhoneDialing(true);
      setTimeout(() => setPhoneDialing(false), 1200);
      onInteract('old_valve_call');
    }
  };

  const handleCleaningClick = () => {
    if (cleaningDishclothSelected) {
      setWipingSpot(true);
      setTimeout(() => setWipingSpot(false), 800);
      onInteract('cleaning');
    } else {
      // Strictly do NOT auto-select the dishcloth.
      // Flash a prompt to notify the user to pick up the dishcloth first.
      setDishclothNeedPrompt(true);
      setTimeout(() => setDishclothNeedPrompt(false), 1500);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-amber-50 to-slate-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/30 select-none">
      
      {/* 1. ROOM BACKGROUND: Wallpaper & Tiles & Floor */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Upper Wall - Warm Pastel Ivory */}
        <div className="h-[58%] w-full bg-gradient-to-b from-amber-100/90 via-orange-50/70 to-amber-50 relative">
          {/* Subtle Grid Tile Pattern */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px), radial-gradient(#d97706 1px, #fef3c7 1px)',
              backgroundSize: '32px 32px',
              backgroundPosition: '0 0, 16px 16px',
            }}
          />
          {/* Kitchen Wall Clock */}
          <div className="absolute top-4 right-1/4 w-14 h-14 rounded-full bg-white border-2 border-slate-400 shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full z-10" />
            <div className="absolute w-0.5 h-4 bg-slate-700 -top-1 origin-bottom rotate-45" />
            <div className="absolute w-0.5 h-5 bg-slate-600 -top-2 origin-bottom -rotate-45" />
          </div>
          {/* Gas Safety Awareness Poster on Wall */}
          <div className="absolute top-6 left-10 bg-white/90 border-2 border-amber-500/60 rounded-lg p-2 shadow-md flex items-center gap-2 max-w-[200px]">
            <Flame className="w-6 h-6 text-amber-600 shrink-0 animate-bounce" />
            <div className="text-[11px] font-bold text-slate-800 leading-tight">
              <span className="text-amber-700">한국가스안전공사</span><br />
              사용전 환기 · 사용후 밸브잠금!
            </div>
          </div>
        </div>

        {/* Countertops and Kitchen Cabinets (Lower half) */}
        <div className="h-[42%] w-full bg-gradient-to-b from-slate-200 to-slate-300 border-t-8 border-amber-800/80 relative">
          {/* Tile backsplash */}
          <div className="absolute -top-16 inset-x-0 h-16 bg-slate-100/95 border-b-2 border-slate-300 grid grid-cols-12 gap-1 p-1 opacity-70">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="border border-slate-300/60 rounded-sm bg-white/60" />
            ))}
          </div>
          {/* Cabinet Doors and Handles */}
          <div className="w-full h-full grid grid-cols-4 gap-4 p-4">
            <div className="bg-amber-900/15 border-2 border-amber-900/30 rounded-xl flex items-center justify-end pr-3">
              <div className="w-2 h-12 bg-slate-400 rounded-full shadow" />
            </div>
            <div className="bg-amber-900/15 border-2 border-amber-900/30 rounded-xl flex items-center justify-start pl-3">
              <div className="w-2 h-12 bg-slate-400 rounded-full shadow" />
            </div>
            <div className="bg-amber-900/15 border-2 border-amber-900/30 rounded-xl flex items-center justify-end pr-3">
              <div className="w-2 h-12 bg-slate-400 rounded-full shadow" />
            </div>
            <div className="bg-amber-900/15 border-2 border-amber-900/30 rounded-xl flex items-center justify-start pl-3">
              <div className="w-2 h-12 bg-slate-400 rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SINK AREA (LEFT-CENTER) & WINDOW (TOP-LEFT) */}
      
      {/* 2-A. WINDOW (HAZARD #2: 창문 열기) */}
      <div 
        id="hazard-window-area"
        onClick={() => (isTargeted('window') || isPrologue) && onInteract('window')}
        className={`absolute top-3 left-[18%] w-[28%] h-[40%] rounded-2xl border-4 transition-all duration-300 cursor-pointer overflow-hidden group shadow-lg ${
          windowHazard || (isPrologue && highlightedHazard === 'window')
            ? 'border-red-500 bg-red-500/10 ring-4 ring-red-400 ring-offset-2 animate-pulse scale-[1.02]'
            : 'border-sky-800/60 bg-sky-100 hover:border-sky-500'
        }`}
      >
        {/* Window Frame Header */}
        <div className="absolute top-0 inset-x-0 h-4 bg-amber-800/80 z-20 flex items-center justify-center">
          <span className="text-[10px] text-amber-100 font-bold tracking-wider">환기용 환풍창</span>
        </div>

        {/* Window Background / Outdoor Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200 flex items-end">
          {/* Outdoor clouds and tree top */}
          <div className="w-16 h-8 bg-white/80 rounded-full absolute top-6 left-4 blur-[1px]" />
          <div className="w-20 h-10 bg-white/70 rounded-full absolute top-8 right-6 blur-[1px]" />
          <div className="w-full h-12 bg-emerald-600/40 rounded-t-full" />
        </div>

        {/* Window Glass Sashes (Sliding visual) */}
        <div className="absolute inset-0 flex p-1 pt-4 gap-1">
          {/* Left Glass Pane */}
          <div className={`w-1/2 h-full bg-white/30 backdrop-blur-xs border-2 border-slate-400 rounded flex flex-col justify-between p-1 transition-transform duration-500 ${
            !windowHazard && !isPrologue ? 'translate-x-3' : ''
          }`}>
            <div className="w-full h-0.5 bg-white/60" />
            <div className="self-end w-1.5 h-6 bg-slate-500 rounded" />
          </div>

          {/* Right Glass Pane */}
          <div className={`w-1/2 h-full bg-white/40 backdrop-blur-xs border-2 border-slate-400 rounded flex flex-col justify-between p-1 transition-transform duration-500 ${
            !windowHazard && !isPrologue ? '-translate-x-3' : ''
          }`}>
            <div className="w-full h-0.5 bg-white/60" />
            <div className="self-start w-1.5 h-6 bg-slate-500 rounded" />
          </div>
        </div>

        {/* Wind Breeze Animation when open/safe */}
        {(!windowHazard || (isPrologue && highlightedHazard !== 'window')) && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-breeze">
            <Wind className="w-12 h-12 text-sky-500/60" />
            <span className="text-xs font-bold text-sky-700 bg-white/80 px-2 py-0.5 rounded-full shadow-sm ml-2">
              상쾌한 환기 중
            </span>
          </div>
        )}

        {/* Warning Indicator when Closed & Hazard active */}
        {isTargeted('window') && (
          <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center z-30">
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="bg-red-600 text-white p-2 rounded-full shadow-xl mb-1"
            >
              <Wind className="w-8 h-8" />
            </motion.div>
            <div className="bg-red-700 text-white text-xs md:text-sm font-black px-3 py-1 rounded-full shadow-lg border border-white">
              창문 터치하여 열기!
            </div>
            {windowHazard && (
              <div className="mt-1 text-[11px] bg-white/95 text-red-700 font-bold px-2 py-0.5 rounded shadow">
                남은시간: {windowHazard.timeLeft.toFixed(1)}초
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2-B. SINK COUNTERTOP & BASIN (LEFT) */}
      <div className="absolute top-[45%] left-[10%] w-[38%] h-[35%] bg-slate-300 rounded-t-2xl border-4 border-slate-400 shadow-xl flex flex-col">
        {/* Sink Basin */}
        <div className="m-3 h-[60%] bg-gradient-to-b from-slate-400 to-slate-200 rounded-xl border-2 border-slate-500 shadow-inner flex items-center justify-center relative">
          {/* Faucet */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-3 h-8 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 rounded-t-full shadow" />
            <div className="w-6 h-2 bg-slate-400 rounded-full" />
          </div>
          {/* Drain */}
          <div className="w-8 h-8 rounded-full border-2 border-slate-500 bg-slate-600/30 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Sink Top Accessories Bar (Phone + Dishcloth) */}
        <div className="flex-1 px-4 flex items-center justify-between">
          
          {/* 2-C. SMARTPHONE / PHONE CALL (HAZARD #5: 노후 밸브 교체 전화) */}
          <div
            id="hazard-phone-area"
            onClick={handlePhoneClick}
            className={`relative flex items-center gap-1.5 p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              isTargeted('old_valve_call')
                ? 'bg-red-500 text-white border-white ring-4 ring-red-400 animate-bounce shadow-xl scale-110'
                : 'bg-white/90 text-slate-800 border-slate-300 hover:bg-amber-50 hover:border-amber-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isTargeted('old_valve_call') ? 'bg-white text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-black leading-tight">가스전문가</div>
              <div className="text-[9px] font-semibold opacity-90">1544-4500</div>
            </div>

            {/* Calling alert pulse */}
            {isTargeted('old_valve_call') && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg animate-pulse border border-white">
                노후부품 교체전화!
              </div>
            )}
          </div>

          {/* 2-D. DISHCLOTH (행주) for HAZARD #4: 청소 도구 */}
          <div
            id="hazard-dishcloth-area"
            onClick={() => onToggleDishcloth && onToggleDishcloth()}
            className={`relative flex items-center gap-1.5 p-2 rounded-xl border-2 cursor-pointer transition-all ${
              cleaningDishclothSelected
                ? 'bg-emerald-600 text-white border-white ring-4 ring-emerald-400 scale-110 shadow-lg'
                : dishclothNeedPrompt
                ? 'bg-red-500 text-white border-white ring-4 ring-red-400 scale-110 shadow-2xl animate-bounce'
                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <div className="text-[10px] font-bold">항균 행주</div>
              <div className="text-[9px] text-amber-800">
                {cleaningDishclothSelected ? '선택됨 (가스레인지 터치)' : '터치하여 들기'}
              </div>
            </div>
            {(cleaningHazard || dishclothNeedPrompt || (isPrologue && highlightedHazard === 'cleaning')) && !cleaningDishclothSelected && (
              <div className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap animate-bounce ${
                dishclothNeedPrompt ? 'bg-red-600 text-white ring-2 ring-white' : 'bg-amber-600 text-white'
              }`}>
                {dishclothNeedPrompt ? '⚠️ 행주 먼저 터치!' : '행주 먼저 선택!'}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. GAS PIPING & MAIN GAS VALVE (HAZARD #1: 가스 밸브 잠그기) */}
      <div className="absolute top-[8%] right-[42%] w-[12%] h-[40%] flex flex-col items-center">
        {/* Vertical Yellow/Silver Gas Pipe */}
        <div className="w-5 h-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 border-2 border-amber-600 rounded-sm shadow-md relative">
          <div className="absolute top-1/4 inset-x-0 h-1 bg-amber-600/60" />
          <div className="absolute top-3/4 inset-x-0 h-1 bg-amber-600/60" />
        </div>

        {/* Interactive Gas Valve (퓨즈콕) */}
        <div 
          id="hazard-valve-area"
          onClick={() => (isTargeted('valve') || isPrologue) && onInteract('valve')}
          className={`absolute top-[40%] cursor-pointer p-3 rounded-2xl border-4 transition-all duration-300 shadow-2xl flex flex-col items-center ${
            valveHazard || (isPrologue && highlightedHazard === 'valve')
              ? 'bg-red-600 border-white ring-4 ring-red-400 animate-pulse scale-125 z-40'
              : 'bg-slate-800 border-slate-600 hover:scale-105'
          }`}
        >
          {/* Valve Lever Knob (Rotates 90 deg when locked) */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Valve Base */}
            <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-amber-700 shadow flex items-center justify-center">
              <Wrench className="w-4 h-4 text-amber-900" />
            </div>

            {/* Turning Handle Bar */}
            <motion.div 
              animate={{ rotate: isTargeted('valve') ? 0 : 90 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`absolute w-14 h-3.5 rounded-full shadow-md border border-slate-900 flex items-center justify-between px-1 ${
                isTargeted('valve') ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <div className="text-[9px] font-black text-white">
                {isTargeted('valve') ? '열림' : '잠김'}
              </div>
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </motion.div>
          </div>

          {/* Gas Leak Steam Effect when Valve is Open & Dangerous */}
          {isTargeted('valve') && (
            <>
              <div className="absolute -top-8 -left-4 animate-smoke pointer-events-none">
                <div className="w-6 h-6 bg-slate-300/80 rounded-full blur-xs" />
              </div>
              <div className="absolute -top-12 left-6 animate-smoke pointer-events-none delay-150">
                <div className="w-8 h-8 bg-slate-200/70 rounded-full blur-xs" />
              </div>
              <div className="mt-1 bg-white text-red-700 text-[11px] font-black px-2 py-0.5 rounded shadow whitespace-nowrap">
                밸브 닫기! (터치)
              </div>
              {valveHazard && (
                <div className="text-[10px] text-white font-bold">
                  {valveHazard.timeLeft.toFixed(1)}초
                </div>
              )}
            </>
          )}

          {/* Safe status badge */}
          {!isTargeted('valve') && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <CheckCircle2 className="w-3 h-3" /> 안전잠금
            </div>
          )}
        </div>
      </div>

      {/* 4. GAS STOVE & COOKTOP AREA (RIGHT SIDE) */}
      <div className="absolute top-[38%] right-[6%] w-[42%] h-[42%] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-3xl border-4 border-slate-600 shadow-2xl p-4 flex flex-col justify-between">
        
        {/* Cooktop Glass Surface with 2 Burners */}
        <div className="w-full h-full relative rounded-2xl bg-slate-800/90 border-2 border-slate-700 p-2 flex items-center justify-around">
          
          {/* 4-A. LEFT BURNER & FLAMMABLES (HAZARD #3: 가연물 치우기) */}
          <div className="relative w-28 h-28 rounded-full border-4 border-slate-600 bg-slate-900 flex items-center justify-center">
            {/* Burner Grate (삼발이) */}
            <div className="w-20 h-20 border-2 border-slate-500 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-700/60 border-2 border-amber-500/40 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-500/80" />
              </div>
            </div>

            {/* FLAMMABLES OBJECTS (Tissue / Spray / Box) */}
            {isTargeted('flammables') && (
              <div 
                id="hazard-flammables-area"
                onClick={() => (isTargeted('flammables') || isPrologue) && onInteract('flammables')}
                className="absolute inset-0 flex items-center justify-center cursor-pointer z-30"
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1], y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="bg-orange-500/95 border-2 border-white rounded-2xl p-2 shadow-2xl flex flex-col items-center ring-4 ring-orange-400"
                >
                  <div className="flex items-center gap-1">
                    {/* Tissue Box */}
                    <div className="w-7 h-6 bg-pink-300 rounded border border-pink-500 flex flex-col items-center justify-center shadow-sm">
                      <div className="w-3 h-2 bg-white rounded-xs -mt-1" />
                      <span className="text-[7px] text-pink-900 font-bold">휴지</span>
                    </div>
                    {/* Spray Can */}
                    <div className="w-5 h-8 bg-sky-400 rounded-t-lg rounded-b border border-sky-600 flex flex-col items-center justify-between p-0.5 shadow-sm">
                      <div className="w-2 h-1 bg-red-500 rounded-xs" />
                      <span className="text-[6px] text-white font-black">스프레이</span>
                    </div>
                  </div>
                  <div className="mt-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                    가연물 치우기! (터치)
                  </div>
                  {flammablesHazard && (
                    <span className="text-[9px] text-white font-bold">
                      {flammablesHazard.timeLeft.toFixed(1)}초
                    </span>
                  )}
                </motion.div>
              </div>
            )}
          </div>

          {/* 4-B. RIGHT BURNER & CLEANING (HAZARD #4: 기름때 청소하기) */}
          <div 
            id="hazard-cleaning-area"
            onClick={handleCleaningClick}
            className={`relative w-28 h-28 rounded-full border-4 cursor-pointer transition-all flex items-center justify-center ${
              isTargeted('cleaning')
                ? 'border-amber-500 bg-amber-950/70 ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse'
                : 'border-slate-600 bg-slate-900'
            }`}
          >
            {/* Burner Grate */}
            <div className="w-20 h-20 border-2 border-slate-500 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-700/60 border-2 border-amber-500/40" />
            </div>

            {/* Dirty Oil Splatters on Stove */}
            {isTargeted('cleaning') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-1 z-30">
                {/* Grease Stains visual */}
                <div className="absolute top-2 left-3 w-4 h-4 bg-amber-600/90 rounded-full blur-[1px]" />
                <div className="absolute bottom-3 right-4 w-5 h-4 bg-amber-700/90 rounded-full blur-[1px]" />
                <div className="absolute top-4 right-3 w-3 h-3 bg-yellow-600/90 rounded-full blur-[1px]" />

                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                  className="bg-amber-600 text-white text-[10px] font-black px-2 py-1 rounded-xl shadow-xl border border-white text-center"
                >
                  기름때 청소!
                  <div className="text-[8px] text-amber-100">
                    {cleaningDishclothSelected ? '여기를 터치해 닦기' : '행주 선택 후 터치'}
                  </div>
                </motion.div>
                {cleaningHazard && (
                  <div className="text-[9px] text-amber-200 font-bold mt-0.5">
                    {cleaningHazard.timeLeft.toFixed(1)}초
                  </div>
                )}
              </div>
            )}

            {/* Shiny Sparkle on Clean State */}
            {!isTargeted('cleaning') && !isPrologue && (
              <div className="absolute top-2 right-2">
                <Sparkles className="w-4 h-4 text-emerald-400/80 animate-spin" />
              </div>
            )}
          </div>

        </div>

        {/* Stove Knobs Control Bar */}
        <div className="h-7 w-full flex items-center justify-around px-6 bg-slate-950/80 rounded-xl border border-slate-700">
          <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-200 shadow" />
          <span className="text-[10px] text-slate-400 font-bold tracking-widest">ECO GAS RANGE</span>
          <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-200 shadow" />
        </div>
      </div>

      {/* 5. GAS HOSE UNDER COUNTER (HAZARD #6: 눌린 호스 펴주기) */}
      <div 
        id="hazard-hose-area"
        onClick={() => (isTargeted('hose_kink') || isPrologue) && onInteract('hose_kink')}
        className={`absolute bottom-3 right-[15%] w-[32%] h-[16%] rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between px-3 ${
          isTargeted('hose_kink')
            ? 'bg-red-600/30 border-red-500 ring-4 ring-red-400 animate-pulse shadow-xl'
            : 'bg-slate-900/30 border-slate-700/50 hover:bg-slate-900/50'
        }`}
      >
        {/* Gas Hose Tube Graphic */}
        <div className="flex-1 h-6 relative flex items-center">
          {/* Orange Gas Hose Line */}
          <div className={`w-full h-3 rounded-full border border-orange-700 shadow-md ${
            isTargeted('hose_kink') ? 'bg-orange-500' : 'bg-orange-400'
          }`} />

          {/* Kink / Heavy Pot Pressing (Hazard state) */}
          {isTargeted('hose_kink') ? (
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 -top-4 flex flex-col items-center z-30"
            >
              {/* Heavy Pot / Weight pressing down */}
              <div className="w-10 h-6 bg-slate-700 border-2 border-slate-400 rounded-b-lg shadow-lg flex items-center justify-center">
                <span className="text-[8px] text-red-300 font-black">눌림!</span>
              </div>
              <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow border border-white mt-1 whitespace-nowrap">
                호스 펴기! (터치)
              </div>
              {hoseHazard && (
                <span className="text-[9px] text-red-100 font-bold bg-red-900/80 px-1 rounded">
                  {hoseHazard.timeLeft.toFixed(1)}초
                </span>
              )}
            </motion.div>
          ) : (
            <div className="absolute left-1/2 -translate-x-1/2 text-[9px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full shadow-xs">
              호스 상태 양호
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Feedback Particles / Dialogue Banner */}
      <AnimatePresence>
        {phoneDialing && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-2 border-indigo-400 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
          >
            <PhoneCall className="w-6 h-6 text-indigo-400 animate-bounce" />
            <div>
              <div className="text-sm font-bold text-indigo-300">한국가스안전공사 연결 완료!</div>
              <div className="text-xs text-slate-200">"노후 밸브 정기 안전점검이 접수되었습니다."</div>
            </div>
          </motion.div>
        )}

        {wipingSpot && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-[48%] right-[12%] bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl z-50 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            <span className="text-xs font-black">기름때가 반짝반짝 깨끗해졌어요!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Hazards Summary Floating Indicators on Large Screens */}
      {activeHazards.length > 0 && !isPrologue && (
        <div className="absolute top-3 right-4 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/50 shadow-lg z-30">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
          <span className="text-xs font-bold text-slate-200">
            위험 발생: <span className="text-red-400 font-extrabold">{activeHazards.length}개</span> 동시 대처 중!
          </span>
        </div>
      )}
    </div>
  );
};
