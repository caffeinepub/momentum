import { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, ListPlus, ChevronDown } from 'lucide-react';

interface BottomNavigationProps {
  isPlanMode: boolean;
  onSwitchMode: (mode: number) => void;
  onAddTask: () => void;
  onAddList: () => void;
  onOpenSettings: () => void;
  onOpenTodayEarns: () => void;
  onOpenSpendPlan: () => void;
  onOpenInsights: () => void;
  earningsEnabled: boolean;
}

export default function BottomNavigation({ 
  isPlanMode, 
  onSwitchMode, 
  onAddTask, 
  onAddList, 
  onOpenSettings,
  onOpenTodayEarns,
  onOpenSpendPlan,
  onOpenInsights,
  earningsEnabled,
}: BottomNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLongPressGlow, setIsLongPressGlow] = useState(false);
  
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const isDragging = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredLongPress = useRef(false);
  
  const modeSwitchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isModeSwitching = useRef(false);

  useLayoutEffect(() => {
    const plusIcon = new Image();
    const xIcon = new Image();
    const arrowIcon = new Image();
    plusIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiA1djE0Ii8+PHBhdGggZD0iTTUgMTJoMTQiLz48L3N2Zz4=';
    xIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOCA2IDYgMTgiLz48cGF0aCBkPSJtNiA2IDEyIDEyIi8+PC9zdmc+';
    arrowIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im02IDkgNiA2IDYtNiIvPjwvc3ZnPg==';
  }, []);

  useEffect(() => {
    if (isPlanMode) {
      setIsMenuOpen(false);
      setIsAnimating(false);
      setIsLongPressGlow(false);
    }
  }, [isPlanMode]);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const clearModeSwitchDebounce = () => {
    if (modeSwitchDebounceTimer.current) {
      clearTimeout(modeSwitchDebounceTimer.current);
      modeSwitchDebounceTimer.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPlanMode) return;
    
    touchStartY.current = e.clientY;
    touchStartTime.current = Date.now();
    isDragging.current = false;
    hasTriggeredLongPress.current = false;

    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      if (!hasTriggeredLongPress.current && !isDragging.current && !isModeSwitching.current) {
        hasTriggeredLongPress.current = true;
        e.preventDefault();
        
        setIsLongPressGlow(true);
        setTimeout(() => setIsLongPressGlow(false), 150);
        
        setTimeout(() => {
          if (!isAnimating && !isModeSwitching.current) {
            isModeSwitching.current = true;
            setIsAnimating(true);
            onSwitchMode(1);
            
            clearModeSwitchDebounce();
            modeSwitchDebounceTimer.current = setTimeout(() => {
              setIsAnimating(false);
              isModeSwitching.current = false;
            }, 250);
          }
        }, 150);
      }
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPlanMode || touchStartY.current === null) return;
    
    const currentY = e.clientY;
    const deltaY = touchStartY.current - currentY;
    
    if (Math.abs(deltaY) > 5) {
      isDragging.current = true;
      clearLongPressTimer();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPlanMode || touchStartY.current === null || touchStartTime.current === null) return;
    
    clearLongPressTimer();
    
    if (hasTriggeredLongPress.current) {
      touchStartY.current = null;
      touchStartTime.current = null;
      isDragging.current = false;
      hasTriggeredLongPress.current = false;
      return;
    }
    
    const pointerEndY = e.clientY;
    const deltaY = touchStartY.current - pointerEndY;
    const deltaTime = Date.now() - touchStartTime.current;
    
    const isUpwardSwipe = deltaY > 40;
    const isQuickTap = deltaTime < 200 && !isDragging.current;
    
    if (isQuickTap) {
      if (isMenuOpen) {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsMenuOpen(false);
        setTimeout(() => setIsAnimating(false), 200);
      } else {
        onAddTask();
      }
    } else if (isUpwardSwipe) {
      if (isAnimating) return;
      
      setIsAnimating(true);
      setIsMenuOpen(!isMenuOpen);
      setTimeout(() => setIsAnimating(false), 200);
    }
    
    touchStartY.current = null;
    touchStartTime.current = null;
    isDragging.current = false;
    hasTriggeredLongPress.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPlanMode) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPlanMode || touchStartY.current === null) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    
    if (Math.abs(deltaY) > 5) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPlanMode || touchStartY.current === null || touchStartTime.current === null) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    const deltaTime = Date.now() - touchStartTime.current;
    
    const isUpwardSwipe = deltaY > 40;
    const isQuickTap = deltaTime < 200 && !isDragging.current;
    
    if (isQuickTap) {
      if (isMenuOpen) {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsMenuOpen(false);
        setTimeout(() => setIsAnimating(false), 200);
      } else {
        onAddTask();
      }
    } else if (isUpwardSwipe) {
      if (isAnimating) return;
      
      setIsAnimating(true);
      setIsMenuOpen(!isMenuOpen);
      setTimeout(() => setIsAnimating(false), 200);
    }
    
    touchStartY.current = null;
    touchStartTime.current = null;
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlanMode) return;
    
    touchStartY.current = e.clientY;
    touchStartTime.current = Date.now();
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPlanMode || touchStartY.current === null) return;
    
    const currentY = e.clientY;
    const deltaY = touchStartY.current - currentY;
    
    if (Math.abs(deltaY) > 5) {
      isDragging.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPlanMode || touchStartY.current === null || touchStartTime.current === null) return;
    
    const mouseEndY = e.clientY;
    const deltaY = touchStartY.current - mouseEndY;
    const deltaTime = Date.now() - touchStartTime.current;
    
    const isUpwardSwipe = deltaY > 40;
    const isQuickClick = deltaTime < 200 && !isDragging.current;
    
    if (isQuickClick) {
      if (isMenuOpen) {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsMenuOpen(false);
        setTimeout(() => setIsAnimating(false), 200);
      } else {
        onAddTask();
      }
    } else if (isUpwardSwipe) {
      if (isAnimating) return;
      
      setIsAnimating(true);
      setIsMenuOpen(!isMenuOpen);
      setTimeout(() => setIsAnimating(false), 200);
    }
    
    touchStartY.current = null;
    touchStartTime.current = null;
    isDragging.current = false;
  };

  const handleXButtonClick = () => {
    if (!isPlanMode || isModeSwitching.current) return;
    
    isModeSwitching.current = true;
    onSwitchMode(0);
    
    clearModeSwitchDebounce();
    modeSwitchDebounceTimer.current = setTimeout(() => {
      isModeSwitching.current = false;
    }, 200);
  };

  const handlePlanClick = () => {
    if (isModeSwitching.current) return;
    
    setIsMenuOpen(false);
    isModeSwitching.current = true;
    setIsAnimating(true);
    onSwitchMode(1);
    
    clearModeSwitchDebounce();
    modeSwitchDebounceTimer.current = setTimeout(() => {
      setIsAnimating(false);
      isModeSwitching.current = false;
    }, 250);
  };

  return (
    <>
      {!isPlanMode && (
        <div 
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 border border-border/50 rounded-2xl shadow-2xl z-50 p-4 origin-center`}
          style={{
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen 
              ? 'translateX(-50%) translateY(0px) scale(1)' 
              : 'translateX(-50%) translateY(15px) scale(0.95)',
            transition: 'opacity 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: isMenuOpen ? 'auto' : 'none',
            willChange: 'transform, opacity',
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handlePlanClick}
              variant="outline" 
              className="col-span-2 h-12 text-base font-semibold bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors"
            >
              Plan
            </Button>

            <Button 
              onClick={onOpenSpendPlan}
              variant="outline" 
              className="h-12 text-base font-semibold bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors"
            >
              Spend
            </Button>
            <Button 
              variant="outline" 
              className="h-12 text-base font-semibold bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors"
            >
              Earn
            </Button>

            <Button 
              onClick={onOpenSettings}
              variant="outline" 
              className="h-12 text-base font-semibold bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors"
            >
              Settings
            </Button>
            <Button 
              onClick={onOpenInsights}
              variant="outline" 
              className="h-12 text-base font-semibold bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors"
            >
              Insights
            </Button>

            {earningsEnabled && (
              <Button 
                onClick={onOpenTodayEarns}
                variant="outline" 
                className="col-span-2 h-12 text-base font-semibold bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors"
              >
                Today Earns
              </Button>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="relative h-14 flex items-end justify-center">
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-8">
            <Button
              onClick={isPlanMode ? onAddTask : onOpenSpendPlan}
              variant="ghost"
              className={`h-10 px-6 text-sm font-semibold rounded-t-2xl transition-all flex items-center justify-center ${
                isPlanMode 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/50 text-base px-8' 
                  : 'hover:bg-accent'
              }`}
              style={{
                willChange: 'transform, opacity',
              }}
            >
              {isPlanMode ? (
                <>
                  <Plus className="h-5 w-5 mr-1.5" />
                  Add Task
                </>
              ) : (
                'Spend'
              )}
            </Button>

            <div className="w-20" />

            <Button
              onClick={isPlanMode ? onAddList : undefined}
              variant="ghost"
              className={`h-10 px-6 text-sm font-semibold rounded-t-2xl transition-all flex items-center justify-center ${
                isPlanMode 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/50 text-base px-8' 
                  : 'hover:bg-accent'
              }`}
              style={{
                willChange: 'transform, opacity',
              }}
            >
              {isPlanMode ? (
                <>
                  <ListPlus className="h-5 w-5 mr-1.5" />
                  Add List
                </>
              ) : (
                'Earn'
              )}
            </Button>
          </div>

          {!isPlanMode ? (
            <button
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              disabled={isModeSwitching.current}
              className={`absolute bottom-2 left-1/2 -translate-x-1/2 h-20 w-20 rounded-full shadow-xl flex items-center justify-center z-10 border-4 border-background bg-gradient-to-br from-primary to-primary/80 hover:shadow-2xl hover:scale-105`}
              style={{
                transform: isMenuOpen 
                  ? 'translateX(-50%) translateY(-15px) scale(1.05)' 
                  : 'translateX(-50%) translateY(0px) scale(1)',
                transition: 'transform 175ms cubic-bezier(0.33, 1, 0.68, 1), box-shadow 150ms ease-out',
                willChange: 'transform, opacity',
                touchAction: 'none',
                boxShadow: isLongPressGlow 
                  ? '0 0 30px 8px rgba(59, 130, 246, 0.6), 0 0 60px 15px rgba(59, 130, 246, 0.3)' 
                  : undefined,
              }}
              aria-label={isMenuOpen ? 'Collapse menu' : 'Add Task, swipe up for menu, or hold for Plan Mode'}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    opacity: isMenuOpen ? 0 : 1,
                    transform: isMenuOpen ? 'scale(0.8)' : 'scale(1)',
                    transition: 'opacity 120ms ease-out, transform 120ms ease-out',
                    willChange: 'transform, opacity',
                  }}
                >
                  <Plus className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>

                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    opacity: isMenuOpen ? 1 : 0,
                    transform: isMenuOpen ? 'scale(1)' : 'scale(0.8)',
                    transition: 'opacity 120ms ease-out, transform 120ms ease-out',
                    willChange: 'transform, opacity',
                  }}
                >
                  <ChevronDown className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={handleXButtonClick}
              disabled={isModeSwitching.current}
              className={`absolute bottom-2 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full shadow-xl flex items-center justify-center z-10 border-4 border-background bg-gradient-to-br from-gray-400 to-gray-500 hover:shadow-2xl hover:scale-105`}
              style={{
                transform: 'translateX(-50%) translateY(0px) scale(1)',
                transition: 'transform 175ms cubic-bezier(0.33, 1, 0.68, 1), box-shadow 150ms ease-out',
                willChange: 'transform, opacity',
              }}
              aria-label="Exit Plan Mode"
            >
              <X className="h-6 w-6 text-white" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
