import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Truck, Box, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Shipment } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface DrawerProps {
  shipment: Shipment | null;
  onClose: () => void;
  onFlag: (id: string) => void;
}

export function ShipmentDrawer({ shipment, onClose, onFlag }: DrawerProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor screen layout for bottom-sheet activation
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sheetRef = useRef<HTMLDivElement>(null);

  if (!shipment) return null;

  // Touch gesture control for pulling down to dismiss sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStart(e.targetTouches[0].clientY);
    setTouchCurrent(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || touchStart === null) return;
    const currentY = e.targetTouches[0].clientY;
    setTouchCurrent(currentY);
    
    const deltaY = currentY - touchStart;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || touchStart === null || touchCurrent === null) return;
    const deltaY = touchCurrent - touchStart;
    
    // If pulled down more than 120px (or 30% of average mobile height), trigger dismiss close
    if (deltaY > 120) {
      onClose();
    }
    setTouchStart(null);
    setTouchCurrent(null);
    setDragOffset(0);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Responsive Drawer Frame */}
      {/* Mobile: 90vh sliding bottom sheet, customizable drag height. Desktop: Right slide-in */}
      <div 
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed bg-bg-surface border-bg-elevated shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out",
          isMobile 
            ? "bottom-0 inset-x-0 h-[88vh] rounded-t-xl border-t border-x" 
            : "top-0 right-0 bottom-0 h-full w-[450px] border-l animate-in slide-in-from-right duration-300"
        )}
        style={isMobile ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        {/* Mobile drag handle bar */}
        {isMobile && (
          <div className="w-full py-3 flex items-center justify-center cursor-row-resize shrink-0">
            <div className="w-10 h-[4px] rounded-full bg-border-strong/70 bg-[#cbd5e1]/20" />
          </div>
        )}

        {/* Content Header section */}
        <div className="bg-bg-surface border-b border-bg-elevated px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg md:text-xl font-bold">{shipment.id}</h2>
              <span className={cn(
                "px-2 py-[2px] rounded text-[10px] font-semibold uppercase font-mono",
                shipment.status === 'in_transit' ? 'bg-accent-primary/15 text-accent-primary' :
                shipment.status === 'delivered' ? 'bg-accent-success/15 text-accent-success' :
                'bg-accent-warning/15 text-accent-warning'
              )}>
                {shipment.status}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">Operated by {shipment.carrier}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg-elevated rounded-full transition-colors text-text-muted hover:text-text-primary active:scale-95"
            aria-label="Close shipment sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Status highlight cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-bg-base p-3 rounded-lg border border-bg-elevated/85 border-b-2 border-b-accent-primary">
              <span className="text-[10px] text-text-muted mb-1 block uppercase font-mono">Registry Route</span>
              <span className="font-semibold text-text-primary block text-xs truncate">
                {shipment.origin.city} → {shipment.destination.city}
              </span>
            </div>
            <div className="bg-bg-base p-3 rounded-lg border border-bg-elevated/85">
              <span className="text-[10px] text-text-muted mb-1 block uppercase font-mono">Expected ETA</span>
              <span className="font-mono text-xs block text-text-primary font-bold">
                {format(new Date(shipment.eta), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>

          {/* Route Info configuration map/flow */}
          <div>
            <h3 className="text-[10px] font-mono text-text-muted mb-3 uppercase tracking-wider font-semibold">Route Hub Configuration</h3>
            <div className="flex items-center justify-between bg-bg-base p-4 rounded-lg border border-bg-elevated gap-2">
              <div className="text-center flex-1 min-w-0">
                <p className="font-mono text-sm font-bold truncate text-text-primary" title={shipment.origin.city}>{shipment.origin.city}</p>
                <p className="text-[10px] text-text-muted truncate" title={shipment.origin.country}>{shipment.origin.country}</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-2">
                <div className="w-full h-px bg-bg-elevated relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-base p-1 rounded-full border border-bg-elevated">
                    <Truck className="w-3.5 h-3.5 text-accent-primary animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="text-center flex-1 min-w-0">
                <p className="font-mono text-sm font-bold truncate text-text-primary" title={shipment.destination.city}>{shipment.destination.city}</p>
                <p className="text-[10px] text-text-muted truncate" title={shipment.destination.country}>{shipment.destination.country}</p>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div>
            <h3 className="text-[10px] font-mono text-text-muted mb-3 uppercase tracking-wider font-semibold">Consignment Specifications</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-base p-3 flex items-center gap-2.5 rounded-lg border border-bg-elevated">
                <Box className="w-4 h-4 text-accent-primary/80" />
                <div>
                  <p className="text-[10px] text-text-muted leading-none">Net Weight</p>
                  <p className="font-mono text-xs font-bold text-text-primary mt-1">{shipment.weight} kg</p>
                </div>
              </div>
              <div className="bg-bg-base p-3 flex items-center gap-2.5 rounded-lg border border-bg-elevated">
                <Box className="w-4 h-4 text-accent-primary/80" />
                <div>
                  <p className="text-[10px] text-text-muted leading-none">Volume Dim</p>
                  <p className="font-mono text-xs font-bold text-text-primary mt-1">{shipment.dimensions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline stepper */}
          <div>
            <h3 className="text-[10px] font-mono text-text-muted mb-3 uppercase tracking-wider font-semibold">Event Waypoints Timeline</h3>
            <div className="bg-bg-base p-4 rounded-lg border border-bg-elevated space-y-4">
              {shipment.events.map((e, i) => (
                <div key={i} className="relative flex gap-3 text-left">
                  {/* Stepper Vertical Connector line */}
                  {i !== shipment.events.length - 1 && (
                    <div className="absolute top-5 left-[10px] w-[1px] h-[calc(100%+8px)] bg-bg-elevated" />
                  )}
                  
                  {/* Floating marker dot */}
                  <div className="relative z-10 w-5 h-5 rounded-full bg-bg-elevated border border-bg-base flex items-center justify-center mt-0.5 shrink-0">
                    {i === 0 ? (
                      <div className="w-2   h-2 rounded-full bg-accent-primary animate-ping-custom" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-text-primary truncate">{e.type}</p>
                    <p className="text-[10px] text-text-muted truncate mt-0.5">🏁 {e.location}</p>
                    <p className="text-[9px] font-mono text-text-muted/80 mt-1">
                      {format(new Date(e.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions bar - full width on mobile viewports */}
        <div className="border-t border-bg-elevated p-4 bg-bg-surface shrink-0">
          <button 
            className="w-full bg-bg-base hover:bg-accent-warning/10 border border-accent-warning flex items-center justify-center gap-2 py-3 rounded-lg text-accent-warning font-semibold text-xs active:scale-[0.98] transition-colors"
            onClick={() => {
              onFlag(shipment.id);
              onClose();
            }}
          >
            <AlertCircle className="w-4 h-4" />
            Flag Critical Exception
          </button>
        </div>
      </div>
    </>
  );
}
