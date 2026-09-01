import React, { useState, useRef, useEffect } from 'react';
import { ActiveHazard, HazardType } from '../types';
import { 
  Flame, 
  Wind, 
  PhoneCall, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench,
  Trash2,
  MoveRight
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
  // Local interaction states
  const [valveAngle, setValveAngle] = useState(0); // 0deg (open) to 90deg (locked)
  const [isDraggingValve, setIsDraggingValve] = useState(false);

  const [windowClicks, setWindowClicks] = useState(0); // 0 -> 1 -> 2 (fully open)
  const [flammablesRemoved, setFlammablesRemoved] = useState<number[]>([]); // indices of removed items (0..3)

  const [phoneCalling, setPhoneCalling] = useState(false);
  const [phoneConnectedToast, setPhoneConnectedToast] = useState(false);

  const [wipingSpot, setWipingSpot] = useState(false);
  const [dishclothNeedPrompt, setDishclothNeedPrompt] = useState(false);

  const [hoseDragX, setHoseDragX] = useState(0);
  const [hoseDiscarded, setHoseDiscarded] = useState(false);

  const valveRef = useRef<HTMLDivElement>(null);

  const getHazard = (type: HazardType) => activeHazards.find(h => h.type === type);

  const valveHazard = getHazard('valve');
  const windowHazard = getHazard('window');
  const flammablesHazard = getHazard('flammables');
  const cleaningHazard = getHazard('cleaning');
  const oldValveHazard = getHazard('old_valve_call');
  const hoseHazard = getHazard('hose_kink');

  const isTargeted = (type: HazardType) => {
    if (isPrologue) return highlightedHazard === type;
    return !!getHazard(type);
  };

  // Reset local state when hazard spawns or disappears
  useEffect(() => {
    if (!valveHazard && (!isPrologue || highlightedHazard !== 'valve')) {
      setValveAngle(90); // Safe state
    } else {
      setValveAngle(0); // Open/Dangerous state
    }
  }, [valveHazard, isPrologue, highlightedHazard]);

  useEffect(() => {
    if (!windowHazard && (!isPrologue || highlightedHazard !== 'window')) {
      setWindowClicks(0);
    }
  }, [windowHazard, isPrologue, highlightedHazard]);

  useEffect(() => {
    if (!flammablesHazard && (!isPrologue || highlightedHazard !== 'flammables')) {
      setFlammablesRemoved([]);
    }
  }, [flammablesHazard, isPrologue, highlightedHazard]);

  useEffect(() => {
    if (!hoseHazard && (!isPrologue || highlightedHazard !== 'hose_kink')) {
      setHoseDiscarded(false);
      setHoseDragX(0);
    }
  }, [hoseHazard, isPrologue, highlightedHazard]);

  // 1. Valve Rotation Handler (Must turn 90 degrees to lock)
  const handleValveRotateStart = (e: React.PointerEvent) => {
    if (!isTargeted('valve')) return;
    setIsDraggingValve(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleValveRotateMove = (e: React.PointerEvent) => {
    if (!isDraggingValve || !isTargeted('valve') || !valveRef.current) return;
    const rect = valveRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // Angle relative to vertical (0 deg) to horizontal (90 deg)
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg = 0;
    if (deg > 90) deg = 90;

    setValveAngle(deg);

    if (deg >= 85) {
      // Snapped to 90 deg! Closed successfully!
      setIsDraggingValve(false);
      setValveAngle(90);
      onInteract('valve');
    }
  };

  const handleValveRotateEnd = (e: React.PointerEvent) => {
    if (!isDraggingValve) return;
    setIsDraggingValve(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (valveAngle < 85 && isTargeted('valve')) {
      // Spring back to 0 if not fully rotated 90 degrees
      setValveAngle(0);
    }
  };

  // Quick click helper for turning valve incrementally if user taps
  const handleValveClick = () => {
    if (!isTargeted('valve')) return;
    if (valveAngle < 45) {
      setValveAngle(45);
    } else {
      setValveAngle(90);
      onInteract('valve');
    }
  };

  // 2. Window Handler (Requires 2 clicks to fully open)
  const handleWindowClick = () => {
    if (!isTargeted('window')) return;
    const nextClicks = windowClicks + 1;
    setWindowClicks(nextClicks);

    if (nextClicks >= 2) {
      onInteract('window');
    }
  };

  // 3. Flammables Handler (Requires 4 clicks to remove all 4 items)
  const handleRemoveFlammableItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTargeted('flammables')) return;
    if (flammablesRemoved.includes(index)) return;

    const updated = [...flammablesRemoved, index];
    setFlammablesRemoved(updated);

    if (updated.length >= 4) {
      // All 4 removed!
      setFlammablesRemoved([]);
      onInteract('flammables');
    }
  };

  // 4. Cleaning Handler (Requires dishcloth selected)
  const handleCleaningClick = () => {
    if (cleaningDishclothSelected) {
      setWipingSpot(true);
      setTimeout(() => setWipingSpot(false), 800);
      onInteract('cleaning');
    } else {
      setDishclothNeedPrompt(true);
      setTimeout(() => setDishclothNeedPrompt(false), 1500);
    }
  };

  // 5. Phone Call Handler (Non-blocking: connects after 1 second while allowing other actions)
  const handlePhoneClick = () => {
    if (!isTargeted('old_valve_call') || phoneCalling) return;
    setPhoneCalling(true);

    // Call connects in background after 1.0s (1000ms) without blocking other gameplay
    setTimeout(() => {
      setPhoneCalling(false);
      setPhoneConnectedToast(true);
      setTimeout(() => setPhoneConnectedToast(false), 2000);
      onInteract('old_valve_call');
    }, 1000);
  };

  // 6. Hose Drag Handler (Drag damaged hose to discard)
  const handleHoseDragEnd = (_: any, info: any) => {
    if (!isTargeted('hose_kink')) return;
    if (info.offset.x > 60 || info.point.x > 100) {
      setHoseDiscarded(true);
      setHoseDragX(100);
      setTimeout(() => {
        onInteract('hose_kink');
        setHoseDiscarded(false);
        setHoseDragX(0);
      }, 400);
    } else {
      setHoseDragX(0);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-amber-50 to-slate-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/30 select-none">
      
      {/* 1. ROOM BACKGROUND: Wall, Clock with Pendulum & Hands, and Safety Poster */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Upper Wall */}
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

          {/* Kitchen Wall Clock with unified hands connected to central axle */}
          <div className="absolute top-2 right-[28%] flex flex-col items-center z-10">
            {/* Clock Dial */}
            <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-600 shadow-lg relative flex items-center justify-center">
              {/* Hour tick marks */}
              <div className="absolute top-1 w-0.5 h-1.5 bg-slate-500 rounded" />
              <div className="absolute bottom-1 w-0.5 h-1.5 bg-slate-500 rounded" />
              <div className="absolute left-1 w-1.5 h-0.5 bg-slate-500 rounded" />
              <div className="absolute right-1 w-1.5 h-0.5 bg-slate-500 rounded" />

              {/* Hour Hand attached to center */}
              <div 
                className="absolute w-0.5 h-4 bg-slate-800 rounded origin-bottom"
                style={{ bottom: '50%', transform: 'rotate(50deg)' }}
              />
              {/* Minute Hand attached to center */}
              <div 
                className="absolute w-0.5 h-5 bg-slate-600 rounded origin-bottom"
                style={{ bottom: '50%', transform: 'rotate(290deg)' }}
              />
              {/* Center Axle / Pin (firmly connecting the hands) */}
              <div className="w-2 h-2 bg-amber-600 border border-slate-900 rounded-full z-20 shadow-xs" />
            </div>

            {/* Gas Safety Awareness Sign placed cleanly UNDER the clock */}
            <div className="mt-1 bg-white/95 border border-amber-500/70 rounded-lg px-2.5 py-1 shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <Flame className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
              <div className="text-[10px] font-extrabold text-slate-800 leading-tight">
                <span className="text-amber-700 font-black">한국가스안전공사</span>
                <span className="text-slate-600 font-semibold ml-1">사용전 환기 · 사용후 밸브잠금!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Countertops and Kitchen Cabinets (Lower half) */}
        <div className="h-[42%] w-full bg-gradient-to-b from-slate-200 to-slate-300 border-t-8 border-amber-800/80 relative">
          {/* Backsplash tiles */}
          <div className="absolute -top-16 inset-x-0 h-16 bg-slate-100/95 border-b-2 border-slate-300 grid grid-cols-12 gap-1 p-1 opacity-70">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="border border-slate-300/60 rounded-sm bg-white/60" />
            ))}
          </div>
          {/* Cabinet Doors */}
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

      {/* 2. SINK AREA (LEFT) & WINDOW (TOP-LEFT) */}
      
      {/* 2-A. WINDOW (HAZARD #2: 창문 2번 눌러 열기) */}
      <div 
        id="hazard-window-area"
        onClick={handleWindowClick}
        className={`absolute top-3 left-[6%] w-[26%] h-[40%] rounded-2xl border-4 transition-all duration-300 cursor-pointer overflow-hidden group shadow-lg ${
          windowHazard || (isPrologue && highlightedHazard === 'window')
            ? 'border-red-500 bg-red-500/10 ring-4 ring-red-400 ring-offset-2 animate-pulse scale-[1.02]'
            : 'border-sky-800/60 bg-sky-100 hover:border-sky-500'
        }`}
      >
        {/* Window Header */}
        <div className="absolute top-0 inset-x-0 h-4 bg-amber-800/80 z-20 flex items-center justify-center">
          <span className="text-[10px] text-amber-100 font-bold tracking-wider">환기용 창문</span>
        </div>

        {/* Outdoor View */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200 flex items-end">
          <div className="w-16 h-8 bg-white/80 rounded-full absolute top-6 left-4 blur-[1px]" />
          <div className="w-20 h-10 bg-white/70 rounded-full absolute top-8 right-6 blur-[1px]" />
          <div className="w-full h-12 bg-emerald-600/40 rounded-t-full" />
        </div>

        {/* Window Glass Sashes (Moves open according to windowClicks: 0->1->2) */}
        <div className="absolute inset-0 flex p-1 pt-4 gap-1 pointer-events-none">
          {/* Left Pane */}
          <div 
            className="w-1/2 h-full bg-white/40 backdrop-blur-xs border-2 border-slate-400 rounded flex flex-col justify-between p-1 transition-transform duration-300 ease-out"
            style={{
              transform: !isTargeted('window') || windowClicks >= 2
                ? 'translateX(-80%)'
                : (windowClicks === 1 ? 'translateX(-40%)' : 'translateX(0%)')
            }}
          >
            <div className="w-full h-0.5 bg-white/60" />
            <div className="self-end w-1.5 h-6 bg-slate-500 rounded" />
          </div>

          {/* Right Pane */}
          <div 
            className="w-1/2 h-full bg-white/40 backdrop-blur-xs border-2 border-slate-400 rounded flex flex-col justify-between p-1 transition-transform duration-300 ease-out"
            style={{
              transform: !isTargeted('window') || windowClicks >= 2
                ? 'translateX(80%)'
                : (windowClicks === 1 ? 'translateX(40%)' : 'translateX(0%)')
            }}
          >
            <div className="w-full h-0.5 bg-white/60" />
            <div className="self-start w-1.5 h-6 bg-slate-500 rounded" />
          </div>
        </div>

        {/* Wind Breeze Animation when open/safe */}
        {(!windowHazard && (!isPrologue || highlightedHazard !== 'window')) && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-breeze">
            <Wind className="w-10 h-10 text-sky-500/70" />
            <span className="text-[11px] font-bold text-sky-700 bg-white/90 px-2 py-0.5 rounded-full shadow-xs ml-1">
              상쾌한 환기 중
            </span>
          </div>
        )}

        {/* Warning & 2-Click Indicator when Window Hazard is active */}
        {isTargeted('window') && (
          <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center z-30">
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="bg-red-600 text-white p-2 rounded-full shadow-xl mb-1"
            >
              <Wind className="w-6 h-6" />
            </motion.div>
            <div className="bg-red-700 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg border border-white">
              {windowClicks === 0 ? '창문 2번 터치하여 열기!' : '1번 더 터치! (활짝 열기)'}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full border border-white ${windowClicks >= 1 ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <span className={`w-3 h-3 rounded-full border border-white ${windowClicks >= 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            </div>
            {windowHazard && (
              <div className="mt-1 text-[10px] bg-white/95 text-red-700 font-bold px-1.5 py-0.5 rounded shadow">
                {windowHazard.timeLeft.toFixed(1)}초
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2-B. SINK COUNTERTOP & BASIN (LEFT) */}
      <div className="absolute top-[45%] left-[6%] w-[36%] h-[35%] bg-slate-300 rounded-t-2xl border-4 border-slate-400 shadow-xl flex flex-col">
        {/* Sink Basin */}
        <div className="m-3 h-[58%] bg-gradient-to-b from-slate-400 to-slate-200 rounded-xl border-2 border-slate-500 shadow-inner flex items-center justify-center relative">
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

        {/* Sink Accessories Bar (Smartphone + Dishcloth) */}
        <div className="flex-1 px-3 flex items-center justify-between pb-1">
          
          {/* 2-C. SMARTPHONE / PHONE CALL (HAZARD #5: 노후 밸브 교체 1초 후 연결) */}
          <div
            id="hazard-phone-area"
            onClick={handlePhoneClick}
            className={`relative flex items-center gap-1.5 p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              phoneCalling
                ? 'bg-indigo-600 text-white border-white ring-4 ring-indigo-400 animate-pulse scale-105'
                : isTargeted('old_valve_call')
                ? 'bg-red-500 text-white border-white ring-4 ring-red-400 animate-bounce shadow-xl scale-110'
                : 'bg-white/90 text-slate-800 border-slate-300 hover:bg-amber-50 hover:border-amber-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${phoneCalling ? 'bg-white text-indigo-600' : isTargeted('old_valve_call') ? 'bg-white text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-black leading-tight">가스전문가</div>
              <div className="text-[8px] font-semibold opacity-90">1544-4500</div>
            </div>

            {/* Calling in progress badge */}
            {phoneCalling && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg border border-white animate-pulse">
                📞 연결 중... (1초)
              </div>
            )}

            {/* Target call alert pulse */}
            {isTargeted('old_valve_call') && !phoneCalling && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg animate-pulse border border-white">
                노후부품 교체전화!
              </div>
            )}
          </div>

          {/* 2-D. DISHCLOTH (항균 행주 for HAZARD #4) */}
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
            <Sparkles className="w-4 h-4 text-amber-500" />
            <div className="text-left">
              <div className="text-[10px] font-bold">항균 행주</div>
              <div className="text-[8px] text-amber-800 font-semibold">
                {cleaningDishclothSelected ? '선택됨 (버너 터치)' : '터치하여 들기'}
              </div>
            </div>
            {(cleaningHazard || dishclothNeedPrompt || (isPrologue && highlightedHazard === 'cleaning')) && !cleaningDishclothSelected && (
              <div className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap animate-bounce ${
                dishclothNeedPrompt ? 'bg-red-600 text-white ring-2 ring-white' : 'bg-amber-600 text-white'
              }`}>
                {dishclothNeedPrompt ? '⚠️ 행주 먼저 터치!' : '행주 먼저 선택!'}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. GAS PIPING & 90-DEGREE ROTATING GAS VALVE (HAZARD #1) */}
      <div className="absolute top-[8%] right-[44%] w-[12%] h-[40%] flex flex-col items-center">
        {/* Yellow Gas Pipe */}
        <div className="w-5 h-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 border-2 border-amber-600 rounded-sm shadow-md relative">
          <div className="absolute top-1/4 inset-x-0 h-1 bg-amber-600/60" />
          <div className="absolute top-3/4 inset-x-0 h-1 bg-amber-600/60" />
        </div>

        {/* Interactive 90-Degree Turn Gas Valve (퓨즈콕) */}
        <div 
          ref={valveRef}
          id="hazard-valve-area"
          onPointerDown={handleValveRotateStart}
          onPointerMove={handleValveRotateMove}
          onPointerUp={handleValveRotateEnd}
          onClick={handleValveClick}
          className={`absolute top-[40%] cursor-grab active:cursor-grabbing p-3 rounded-2xl border-4 transition-all shadow-2xl flex flex-col items-center touch-none ${
            isTargeted('valve')
              ? 'bg-red-600 border-white ring-4 ring-red-400 animate-pulse scale-120 z-40'
              : 'bg-slate-800 border-slate-600 hover:scale-105'
          }`}
        >
          {/* Valve Dial Knob */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* Valve Base Disc with Angle indicator */}
            <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-700 shadow flex items-center justify-center">
              <Wrench className="w-4 h-4 text-amber-900" />
            </div>

            {/* Rotating Lever (Angle: 0deg vertical/open -> 90deg horizontal/closed) */}
            <motion.div 
              style={{ rotate: isTargeted('valve') ? valveAngle : 90 }}
              className={`absolute w-16 h-4 rounded-full shadow-md border-2 border-slate-900 flex items-center justify-between px-1 transition-colors ${
                (isTargeted('valve') && valveAngle < 85) ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <div className="text-[8px] font-black text-white whitespace-nowrap">
                {isTargeted('valve') && valveAngle < 85 ? `${Math.round(valveAngle)}° 회전` : '90° 잠김'}
              </div>
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </motion.div>
          </div>

          {/* Gas Leak Steam Effect & 90-deg Instruction when Open */}
          {isTargeted('valve') && (
            <>
              <div className="absolute -top-7 -left-3 animate-smoke pointer-events-none">
                <div className="w-5 h-5 bg-slate-300/80 rounded-full blur-xs" />
              </div>
              <div className="mt-1 bg-white text-red-700 text-[10px] font-black px-2 py-0.5 rounded shadow whitespace-nowrap">
                {valveAngle > 0 ? `90도로 돌리기! (${Math.round(valveAngle)}/90°)` : '90도 돌려 잠그기!'}
              </div>
              {valveHazard && (
                <div className="text-[9px] text-white font-bold">
                  {valveHazard.timeLeft.toFixed(1)}초
                </div>
              )}
            </>
          )}

          {!isTargeted('valve') && (
            <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
              <CheckCircle2 className="w-3 h-3" /> 90° 안전잠금
            </div>
          )}
        </div>
      </div>

      {/* 4. GAS STOVE & COOKTOP AREA (RIGHT SIDE) */}
      <div className="absolute top-[38%] right-[4%] w-[42%] h-[42%] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-3xl border-4 border-slate-600 shadow-2xl p-3 flex flex-col justify-between">
        
        {/* Cooktop Surface with 2 Burners */}
        <div className="w-full h-full relative rounded-2xl bg-slate-800/90 border-2 border-slate-700 p-2 flex items-center justify-around">
          
          {/* 4-A. LEFT BURNER & FLAMMABLES (HAZARD #3: 4 distinct items to remove) */}
          <div className="relative w-28 h-28 rounded-full border-4 border-slate-600 bg-slate-900 flex items-center justify-center">
            {/* Burner Grate */}
            <div className="w-20 h-20 border-2 border-slate-500 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-700/60 border-2 border-amber-500/40 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-500/80" />
              </div>
            </div>

            {/* 4 FLAMMABLE ITEMS AROUND LEFT BURNER */}
            {isTargeted('flammables') && (
              <div 
                id="hazard-flammables-area"
                className="absolute inset-0 flex items-center justify-center z-30"
              >
                {/* 4 items grid/scatter */}
                <div className="relative w-full h-full">
                  {/* Item 1: 휴지 (Tissue Box) */}
                  {!flammablesRemoved.includes(0) && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleRemoveFlammableItem(0, e)}
                      className="absolute top-1 left-1 w-9 h-8 bg-pink-400 border-2 border-white rounded-lg shadow-xl cursor-pointer flex flex-col items-center justify-center p-0.5 animate-bounce"
                    >
                      <div className="w-3 h-2 bg-white rounded-xs" />
                      <span className="text-[7px] text-pink-950 font-black">휴지</span>
                    </motion.div>
                  )}

                  {/* Item 2: 스프레이 (Aerosol Spray) */}
                  {!flammablesRemoved.includes(1) && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleRemoveFlammableItem(1, e)}
                      className="absolute top-1 right-1 w-8 h-10 bg-sky-500 border-2 border-white rounded-lg shadow-xl cursor-pointer flex flex-col items-center justify-between p-0.5 animate-bounce"
                    >
                      <div className="w-2 h-1 bg-red-500 rounded-xs" />
                      <span className="text-[6px] text-white font-black">스프레이</span>
                    </motion.div>
                  )}

                  {/* Item 3: 종이박스 (Cardboard Box) */}
                  {!flammablesRemoved.includes(2) && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleRemoveFlammableItem(2, e)}
                      className="absolute bottom-1 left-2 w-9 h-8 bg-amber-700 border-2 border-white rounded-lg shadow-xl cursor-pointer flex flex-col items-center justify-center p-0.5 animate-bounce"
                    >
                      <span className="text-[7px] text-amber-100 font-black">종이박스</span>
                    </motion.div>
                  )}

                  {/* Item 4: 키친타월 (Kitchen Towel) */}
                  {!flammablesRemoved.includes(3) && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleRemoveFlammableItem(3, e)}
                      className="absolute bottom-1 right-2 w-9 h-9 bg-yellow-100 border-2 border-amber-400 rounded-lg shadow-xl cursor-pointer flex flex-col items-center justify-center p-0.5 animate-bounce"
                    >
                      <span className="text-[7px] text-amber-900 font-black">키친타월</span>
                    </motion.div>
                  )}

                  {/* Center Guidance Badge */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xl border border-white whitespace-nowrap pointer-events-none">
                    4가지 터치! ({4 - flammablesRemoved.length}개 남음)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4-B. RIGHT BURNER & CLEANING (HAZARD #4) */}
          <div 
            id="hazard-cleaning-area"
            onClick={handleCleaningClick}
            className={`relative w-28 h-28 rounded-full border-4 cursor-pointer transition-all flex items-center justify-center ${
              isTargeted('cleaning')
                ? 'border-amber-500 bg-amber-950/70 ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse'
                : 'border-slate-600 bg-slate-900'
            }`}
          >
            <div className="w-20 h-20 border-2 border-slate-500 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-700/60 border-2 border-amber-500/40" />
            </div>

            {/* Oil Grease Splatters */}
            {isTargeted('cleaning') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-1 z-30">
                <div className="absolute top-2 left-3 w-4 h-4 bg-amber-600/90 rounded-full blur-[1px]" />
                <div className="absolute bottom-3 right-4 w-5 h-4 bg-amber-700/90 rounded-full blur-[1px]" />
                <div className="absolute top-4 right-3 w-3 h-3 bg-yellow-600/90 rounded-full blur-[1px]" />

                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                  className="bg-amber-600 text-white text-[9px] font-black px-2 py-1 rounded-xl shadow-xl border border-white text-center"
                >
                  기름때 청소!
                  <div className="text-[7px] text-amber-100">
                    {cleaningDishclothSelected ? '터치해 닦기' : '행주 들고 터치'}
                  </div>
                </motion.div>
                {cleaningHazard && (
                  <div className="text-[8px] text-amber-200 font-bold mt-0.5">
                    {cleaningHazard.timeLeft.toFixed(1)}초
                  </div>
                )}
              </div>
            )}

            {!isTargeted('cleaning') && !isPrologue && (
              <div className="absolute top-2 right-2">
                <Sparkles className="w-4 h-4 text-emerald-400/80 animate-spin" />
              </div>
            )}
          </div>

        </div>

        {/* Stove Knobs */}
        <div className="h-6 w-full flex items-center justify-around px-6 bg-slate-950/80 rounded-xl border border-slate-700">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-slate-200 shadow" />
          <span className="text-[9px] text-slate-400 font-bold tracking-widest">ECO GAS RANGE</span>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-slate-200 shadow" />
        </div>
      </div>

      {/* 5. GAS HOSE (HAZARD #6: 드래그하여 버리기/교체) */}
      <div 
        id="hazard-hose-area"
        className={`absolute bottom-3 right-[10%] w-[36%] h-[16%] rounded-2xl border-2 transition-all duration-200 flex items-center justify-between px-3 ${
          isTargeted('hose_kink')
            ? 'bg-red-600/30 border-red-500 ring-4 ring-red-400 shadow-xl'
            : 'bg-slate-900/30 border-slate-700/50'
        }`}
      >
        {/* Hose Graphic & Draggable damaged portion */}
        <div className="flex-1 h-6 relative flex items-center">
          {/* Base Hose Pipe */}
          <div className={`w-full h-3 rounded-full border border-orange-700 shadow-md ${
            isTargeted('hose_kink') && !hoseDiscarded ? 'bg-orange-600/60' : 'bg-orange-400'
          }`} />

          {/* Draggable Damaged/Kinked Hose Section */}
          {isTargeted('hose_kink') && !hoseDiscarded && (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 120 }}
              dragElastic={0.2}
              onDragEnd={handleHoseDragEnd}
              className="absolute left-1/4 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-40 flex items-center gap-1"
            >
              {/* Damaged Hose with Kink / Heavy pot weight */}
              <div className="bg-red-600 text-white border-2 border-white rounded-xl px-2.5 py-1 shadow-2xl flex items-center gap-1.5 animate-pulse">
                <span className="text-[9px] font-black">손상 호스</span>
                <MoveRight className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span className="text-[8px] font-bold text-yellow-200">우측으로 드래그!</span>
              </div>
            </motion.div>
          )}

          {/* Trash Drop Zone Indicator on the right */}
          {isTargeted('hose_kink') && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 bg-slate-900/90 border-2 border-dashed border-red-400 rounded-xl p-1 flex items-center gap-1 text-[8px] text-red-300 font-bold shadow-inner">
              <Trash2 className="w-4 h-4 text-red-400 animate-bounce" />
              <span>버리기</span>
            </div>
          )}

          {!isTargeted('hose_kink') && (
            <div className="absolute left-1/2 -translate-x-1/2 text-[9px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full shadow-xs">
              호스 상태 정상
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Feedback Toasts */}
      <AnimatePresence>
        {phoneConnectedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-2 border-emerald-400 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
          >
            <PhoneCall className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-emerald-300">한국가스안전공사 연결 완료!</div>
              <div className="text-xs text-slate-200">"노후 부품 점검 요청이 정상 접수되었습니다."</div>
            </div>
          </motion.div>
        )}

        {wipingSpot && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-[48%] right-[10%] bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl z-50 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            <span className="text-xs font-black">기름때를 깨끗하게 닦았습니다!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Hazards Summary Banner */}
      {activeHazards.length > 0 && !isPrologue && (
        <div className="absolute top-3 right-4 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/50 shadow-lg z-30">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
          <span className="text-xs font-bold text-slate-200">
            위험 요소: <span className="text-red-400 font-extrabold">{activeHazards.length} / 3개</span> 대처 중
          </span>
        </div>
      )}
    </div>
  );
};
