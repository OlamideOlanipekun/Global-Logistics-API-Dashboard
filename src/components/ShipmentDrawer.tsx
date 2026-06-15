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
  if (!shipment) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-bg-base/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-bg-surface border-l border-bg-elevated shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-bg-surface/90 backdrop-blur border-b border-bg-elevated px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold">{shipment.id}</h2>
            <p className="text-sm text-text-muted">Managed by {shipment.carrier}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg-elevated rounded-full transition-colors text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Status highlight */}
          <div className="flex gap-3 sm:gap-4">
            <div className="flex-1 bg-bg-base p-3 sm:p-4 rounded-lg border border-bg-elevated border-b-2 border-b-accent-primary">
              <span className="text-xs text-text-muted mb-1 block">Current Status</span>
              <span className="font-medium capitalize text-accent-primary flex items-center gap-2">
                {shipment.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex-1 bg-bg-base p-3 sm:p-4 rounded-lg border border-bg-elevated">
              <span className="text-xs text-text-muted mb-1 block">Expected Delivery</span>
              <span className="font-mono text-sm">{format(new Date(shipment.eta), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Route Info */}
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Route Configuration</h3>
            <div className="flex items-center justify-between bg-bg-base p-3 sm:p-4 rounded-lg border border-bg-elevated gap-2">
              <div className="text-center flex-1 min-w-0">
                <p className="font-mono text-sm sm:text-lg font-bold truncate" title={shipment.origin.city}>{shipment.origin.city}</p>
                <p className="text-xs text-text-muted truncate" title={shipment.origin.country}>{shipment.origin.country}</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-1 sm:px-4">
                <div className="w-full h-px bg-bg-elevated relative">
                  <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-text-muted bg-bg-base p-0.5" />
                </div>
              </div>
              <div className="text-center flex-1 min-w-0">
                <p className="font-mono text-sm sm:text-lg font-bold truncate" title={shipment.destination.city}>{shipment.destination.city}</p>
                <p className="text-xs text-text-muted truncate" title={shipment.destination.country}>{shipment.destination.country}</p>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Consignment Specs</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-base p-3 flex items-center gap-3 rounded-lg border border-bg-elevated">
                <Box className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Weight</p>
                  <p className="font-mono text-sm">{shipment.weight} kg</p>
                </div>
              </div>
              <div className="bg-bg-base p-3 flex items-center gap-3 rounded-lg border border-bg-elevated">
                <Box className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Dimensions</p>
                  <p className="font-mono text-sm">{shipment.dimensions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Event Timeline</h3>
            <div className="bg-bg-base p-5 rounded-lg border border-bg-elevated">
              <div className="space-y-6">
                {shipment.events.map((e, i) => (
                  <div key={i} className="relative flex gap-4">
                    {/* Line */}
                    {i !== shipment.events.length - 1 && (
                      <div className="absolute top-6 left-[11px] w-px h-full bg-bg-elevated" />
                    )}
                    
                    <div className="relative z-10 w-6 h-6 rounded-full bg-bg-elevated border-2 border-bg-base flex items-center justify-center mt-1">
                      {i === 0 ? (
                        <div className="w-2 h-2 rounded-full bg-accent-primary" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm text-text-primary">{e.type}</p>
                      <p className="text-xs text-text-muted mb-1">{e.location}</p>
                      <p className="text-[10px] font-mono text-text-muted">
                        {format(new Date(e.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-bg-surface/90 backdrop-blur border-t border-bg-elevated p-4">
          <button 
            className="w-full bg-bg-base hover:bg-accent-warning/10 border border-accent-warning flex items-center justify-center gap-2 py-2.5 rounded-md text-accent-warning font-medium transition-colors"
            onClick={() => {
              onFlag(shipment.id);
              onClose();
            }}
          >
            <AlertCircle className="w-4 h-4" />
            Flag Exception
          </button>
        </div>
      </div>
    </>
  );
}
