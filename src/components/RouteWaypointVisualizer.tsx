import React, { useState, useEffect } from 'react';
import { Shipment, Location } from '../types';
import { 
  Truck, 
  MapPin, 
  Compass, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Navigation, 
  Activity, 
  ShieldAlert,
  Package,
  Anchor,
  CloudLightning,
  Plane,
  HeartCrack
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface RouteWaypointVisualizerProps {
  shipment: Shipment | null;
  onClose?: () => void;
}

export function RouteWaypointVisualizer({ shipment, onClose }: RouteWaypointVisualizerProps) {
  // Simulating live telemetry stats that adjust dynamically with shipment
  const [pulsePosition, setPulsePosition] = useState(0.4);
  const [livePings, setLivePings] = useState<number>(0);
  const [vesselSpeed, setVesselSpeed] = useState<number>(85); // km/h

  // Update mock animations when active shipment shifts
  useEffect(() => {
    if (!shipment) return;

    // Different status = different waypoint positions
    let targetPos = 0.5;
    let targetSpeed = 85;
    if (shipment.status === 'delivered') {
      targetPos = 1.0;
      targetSpeed = 0;
    } else if (shipment.status === 'delayed') {
      targetPos = 0.33;
      targetSpeed = 12;
    } else if (shipment.status === 'failed') {
      targetPos = 0.66;
      targetSpeed = 0;
    } else if (shipment.status === 'flagged') {
      targetPos = 0.45;
      targetSpeed = 35;
    } else {
      // In transit
      targetPos = 0.62;
      targetSpeed = 92;
    }

    setPulsePosition(targetPos);
    setVesselSpeed(targetSpeed);

    const interval = setInterval(() => {
      setLivePings(p => (p + 1) % 100);
    }, 3500);

    return () => clearInterval(interval);
  }, [shipment]);

  if (!shipment) {
    return (
      <div className="bg-bg-surface border border-bg-elevated rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[220px] transition-all">
        <div className="p-4 bg-bg-elevated rounded-full text-text-muted mb-3 border border-bg-elevated/40 animate-pulse">
          <Compass className="w-8 h-8 text-accent-primary" />
        </div>
        <h3 className="text-sm font-sans font-semibold text-text-primary">No Waybill Selected for Mapping</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
          Select any active cargo waybill from the list or grid index below to load its vector tracking path and physical telemetry coordinates live.
        </p>
      </div>
    );
  }

  // Derive waypoint details
  const origin = shipment.origin;
  const destination = shipment.destination;

  // Let's draw dynamic midpoints based on actual coordinates to simulate route
  const mid1Name = `${origin.city} Port Outpost`;
  const mid2Name = `${destination.city} Terminal Inbound`;

  // Status mapping
  const isDelivered = shipment.status === 'delivered';
  const isDelayed = shipment.status === 'delayed';
  const isFailed = shipment.status === 'failed';
  const isFlagged = shipment.status === 'flagged';
  const isInTransit = shipment.status === 'in_transit';

  // SVG Coordinates setup
  // ViewBox: 0 0 600 120
  const x1 = 60, y1 = 60; // Origin Node
  const x2 = 220, y2 = 45; // Customs Checkout Midpoint 1
  const x3 = 380, y3 = 75; // Regional Hub Midpoint 2
  const x4 = 540, y4 = 60; // Final Destination Node

  // Determine which waypoints are complete
  const isNode1Active = true; // Origin is always complete
  const isNode2Active = isDelivered || isFailed || isFlagged || isInTransit; // Complete for most
  const isNode3Active = isDelivered || isFailed || (isInTransit && pulsePosition > 0.6); // Complete for final leg
  const isNode4Active = isDelivered; // Only complete when delivered

  // Active status text decoration
  let statusBadgeColor = "text-accent-primary border-accent-primary/20 bg-accent-primary/10";
  let statusLabel = "IN TRANSIT - LIVE TELEMETRY";
  if (isDelivered) {
    statusBadgeColor = "text-accent-success border-accent-success/22 bg-accent-success/10";
    statusLabel = "DELIVERED - MANIFEST RESOLVED";
  } else if (isDelayed) {
    statusBadgeColor = "text-accent-warning border-accent-warning/22 bg-accent-warning/10";
    statusLabel = "HOLD EXCEPTION - DELAY NOTED";
  } else if (isFailed) {
    statusBadgeColor = "text-accent-danger border-accent-danger/22 bg-accent-danger/10";
    statusLabel = "ROUTING FAILURE - CORRECTION FILED";
  } else if (isFlagged) {
    statusBadgeColor = "text-accent-warning border-accent-warning/30 bg-accent-warning/20 font-bold";
    statusLabel = "CRITICAL EXCEPTION - FLAG RAISED";
  }

  // Calculating exact coordinates of the pulse/carrier icon along the piece-wise path
  // Since we have 3 segments (A->B, B->C, C->D), let's calculate based on percentage
  let px = x1;
  let py = y1;
  
  if (pulsePosition <= 0.33) {
    const t = pulsePosition / 0.33;
    px = x1 + (x2 - x1) * t;
    py = y1 + (y2 - y1) * t;
  } else if (pulsePosition <= 0.66) {
    const t = (pulsePosition - 0.33) / 0.33;
    px = x2 + (x3 - x2) * t;
    py = y2 + (y3 - y2) * t;
  } else {
    const t = (pulsePosition - 0.66) / 0.34;
    px = x3 + (x4 - x3) * t;
    py = y3 + (y4 - y3) * t;
  }

  return (
    <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-lg relative flex flex-col gap-4 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-bg-elevated/65 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-lg bg-accent-primary/10",
            isDelivered && "bg-accent-success/10 text-accent-success",
            isDelayed && "bg-accent-warning/10 text-accent-warning",
            isFailed && "bg-accent-danger/10 text-accent-danger"
          )}>
            <Navigation className="w-4 h-4 text-accent-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-text-primary tracking-tight">ROUTE WAYPOINT VECTOR MAP</h3>
              <span className="font-mono text-[10px] text-accent-primary font-semibold bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/10">
                {shipment.id}
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">
              Sector: {origin.city} ({origin.country}) &rarr; {destination.city} ({destination.country})
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className={cn("px-2.5 py-1 rounded border text-[10px] font-mono font-bold tracking-wide shrink-0", statusBadgeColor)}>
          {statusLabel}
        </div>
      </div>

      {/* Primary SVG Canvas rendering the live waypoint path */}
      <div className="relative w-full bg-bg-base/40 border border-bg-elevated/45 rounded-xl p-4 flex flex-col justify-center min-h-[160px] overflow-hidden select-none">
        
        {/* Background Grid Pattern for high-tech aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c2539_1px,transparent_1px),linear-gradient(to_bottom,#1c2539_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
        
        {/* Compass / Compass details */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[9.5px] font-mono text-text-muted">
          <Activity className="w-3.5 h-3.5 text-accent-primary animate-pulse" />
          <span>Active Feed Pings: <strong className="text-text-primary">{12 + livePings}hz</strong></span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 text-[9.5px] font-mono text-text-muted">
          <ChevronRight className="w-3 h-3 text-accent-success animate-ping" />
          <span>Speed Class: <strong className="text-text-primary">{vesselSpeed} km/h</strong></span>
        </div>

        {/* SVG Container */}
        <svg className="w-full h-[120px] relative z-10 overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
          {/* Definitions for Glow Filters & Dash Effects */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-high" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Underlay route trajectory glow lines */}
          <path 
            d={`M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} L ${x4},${y4}`} 
            fill="none" 
            stroke="var(--color-bg-elevated)" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          <path 
            d={`M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} L ${x4},${y4}`} 
            fill="none" 
            stroke="var(--color-accent-primary)" 
            strokeWidth="2" 
            strokeOpacity="0.45"
            strokeLinecap="round" 
            strokeLinejoin="round" 
            filter="url(#glow)"
          />

          {/* Glowing Animated Dash segment if shipment is moving */}
          {isInTransit && (
            <path 
              d={`M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} L ${x4},${y4}`} 
              fill="none" 
              stroke="var(--color-accent-primary)" 
              strokeWidth="2.5" 
              strokeDasharray="8 6"
              className="animate-[dash_12s_linear_infinite]"
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Nodes waypoint checkpoints with SVG pins */}
          
          {/* Waypoint 1 (Origin) */}
          <g transform={`translate(${x1}, ${y1})`} className="cursor-pointer">
            <circle r="12" fill="var(--color-bg-surface)" stroke="var(--color-bg-elevated)" strokeWidth="2" />
            <circle r="6" fill={isNode1Active ? "var(--color-accent-success)" : "var(--color-text-muted)"} />
            {isNode1Active && <circle r="12" fill="none" stroke="var(--color-accent-success)" strokeWidth="1.5" className="animate-ping opacity-30" />}
          </g>

          {/* Waypoint 2 (Customs/Hub 1) */}
          <g transform={`translate(${x2}, ${y2})`} className="cursor-pointer">
            <circle r="12" fill="var(--color-bg-surface)" stroke="var(--color-bg-elevated)" strokeWidth="2" />
            <circle r="6" fill={
              isDelayed ? "var(--color-accent-warning)" :
              isFailed ? "var(--color-accent-danger)" :
              isNode2Active ? "var(--color-accent-success)" : "var(--color-text-muted)"
            } />
            {isDelayed && <circle r="12" fill="none" stroke="var(--color-accent-warning)" strokeWidth="1.5" className="animate-ping" />}
            {isFailed && <circle r="12" fill="none" stroke="var(--color-accent-danger)" strokeWidth="1.5" className="animate-ping" />}
          </g>

          {/* Waypoint 3 (Hub 2) */}
          <g transform={`translate(${x3}, ${y3})`} className="cursor-pointer">
            <circle r="12" fill="var(--color-bg-surface)" stroke="var(--color-bg-elevated)" strokeWidth="2" />
            <circle r="6" fill={
              isFlagged ? "var(--color-accent-warning)" :
              isNode3Active ? "var(--color-accent-success)" : 
              isInTransit ? "var(--color-accent-primary)" : "var(--color-text-muted)"
            } />
            {isFlagged && <circle r="12" fill="none" stroke="var(--color-accent-warning)" strokeWidth="1.5" className="animate-ping" />}
          </g>

          {/* Waypoint 4 (Destination) */}
          <g transform={`translate(${x4}, ${y4})`} className="cursor-pointer">
            <circle r="12" fill="var(--color-bg-surface)" stroke="var(--color-bg-elevated)" strokeWidth="2" />
            <circle r="6" fill={isNode4Active ? "var(--color-accent-success)" : "var(--color-text-muted)"} />
            {isNode4Active && <circle r="12" fill="none" stroke="var(--color-accent-success)" strokeWidth="1.5" className="animate-ping opacity-35" />}
          </g>

          {/* Moving Vessel Indicator Pin representing cargo location */}
          <g transform={`translate(${px}, ${py})`}>
            {/* Visual halo depending on status */}
            <circle r="16" fill={
              isDelivered ? "var(--color-accent-success)" : 
              isDelayed ? "var(--color-accent-warning)" :
              isFailed ? "var(--color-accent-danger)" : "var(--color-accent-primary)"
            } fillOpacity="0.2" className="animate-pulse" filter="url(#glow-high)" />
            
            <circle r="8" fill={
              isDelivered ? "var(--color-accent-success)" : 
              isDelayed ? "var(--color-accent-warning)" :
              isFailed ? "var(--color-accent-danger)" : "var(--color-accent-primary)"
            } stroke="#ffffff" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Labels underneath checkpoints */}
        <div className="grid grid-cols-4 text-center mt-1 z-15 select-none text-[10px] font-mono leading-tight">
          <div className="flex flex-col items-center">
            <span className="font-bold text-text-primary uppercase">{origin.city} Hub</span>
            <span className="text-[8px] text-text-muted">Origin Port</span>
          </div>

          <div className="flex flex-col items-center">
            <span className={cn(
              "font-bold uppercase", 
              isDelayed ? "text-accent-warning" : "text-text-primary"
            )}>Border Terminal</span>
            <span className="text-[8px] text-text-muted">Customs Node</span>
          </div>

          <div className="flex flex-col items-center">
            <span className={cn(
              "font-bold uppercase", 
              isFlagged ? "text-accent-warning font-bold" : "text-text-primary"
            )}>Waystation</span>
            <span className="text-[8px] text-text-muted">Transit Route</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold text-text-primary uppercase">{destination.city} Depot</span>
            <span className="text-[8px] text-text-muted">Final Arrival</span>
          </div>
        </div>

      </div>

      {/* Grid of details describing current transit tracking */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-bg-base/20 border border-bg-elevated/40 rounded-xl p-3.5">
        
        {/* Metric A */}
        <div className="flex flex-col gap-1 pr-3 border-r border-bg-elevated/50">
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-text-muted" />
            <span>ETA Countdown</span>
          </span>
          <span className="text-xs font-mono font-bold text-text-primary">
            {isDelivered ? "Manifest Closed" : `${format(new Date(shipment.eta), 'MMM d, yyyy')}`}
          </span>
          <span className="text-[9.5px] text-text-muted">
            {isDelivered ? "Successfully handshaked" : "Estimated transit limit"}
          </span>
        </div>

        {/* Metric B */}
        <div className="flex flex-col gap-1 pr-3 border-r border-bg-elevated/50">
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-text-muted" />
            <span>Vessel Coordinates</span>
          </span>
          <span className="text-xs font-mono font-bold text-text-primary">
            {isDelivered 
              ? `${destination.lat.toFixed(4)}°, ${destination.lng.toFixed(4)}°`
              : `${((origin.lat + destination.lat) / 2).toFixed(4)}°, ${((origin.lng + destination.lng) / 2).toFixed(4)}°`
            }
          </span>
          <span className="text-[9.5px] text-text-muted">
            Geographic locator projection
          </span>
        </div>

        {/* Metric C */}
        <div className="flex flex-col gap-1 pr-3 border-r border-bg-elevated/40">
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Package className="w-3 h-3 text-text-muted" />
            <span>Consignment specs</span>
          </span>
          <span className="text-xs font-mono font-bold text-text-primary">
            {shipment.weight} kg
          </span>
          <span className="text-[9.5px] text-text-muted truncate">
            {shipment.dimensions}
          </span>
        </div>

        {/* Metric D */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Anchor className="w-3 h-3 text-text-muted" />
            <span>Transporter</span>
          </span>
          <span className="text-xs font-mono font-bold text-accent-primary">
            {shipment.carrier} Fleet
          </span>
          <span className="text-[9.5px] text-text-muted">
            Secure air & land network
          </span>
        </div>

      </div>

      {/* Tactical Status Alerts for Exceptions */}
      {(isDelayed || isFlagged || isFailed) && (
        <div className={cn(
          "p-3 rounded-lg flex items-start gap-2.5 border text-xs font-medium font-sans leading-relaxed transition-all",
          isDelayed && "bg-accent-warning/10 border-accent-warning/20 text-accent-warning",
          isFlagged && "bg-accent-warning/10 border-accent-warning/30 text-accent-warning font-semibold",
          isFailed && "bg-accent-danger/10 border-accent-danger/20 text-accent-danger"
        )}>
          {isFailed ? (
            <HeartCrack className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col gap-0.5">
            <span className="font-bold uppercase tracking-wider">Tactical Incident Report Flagged</span>
            <span className="text-[11px] text-text-primary/95">
              {isDelayed && `Transit delay reported at Border Terminal Customs Node. Inspection scheduled under manifest code ${shipment.id}.`}
              {isFlagged && `Operator has raised warning alert level. Transit checkpoint bypassed due to weather conditions.`}
              {isFailed && `Vessel signal offline or connection timeout reported in transit. Routing dispatch intervention required.`}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline Helper subcomponent for rendering small directional chevron inside SVG label container
function ChevronRight({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn("inline-block", className)} {...props}>
      &raquo;
    </span>
  );
}
