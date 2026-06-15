import React, { useState, useMemo } from 'react';
import { MOCK_SHIPMENTS } from '../mockData';
import { cn } from '../lib/utils';
import { 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  CornerUpRight, 
  Trash2, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  Mail, 
  FileText, 
  TrendingUp, 
  ArrowRight,
  Database,
  Globe
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Shipment, ShipmentStatus } from '../types';

export function Exceptions() {
  // 1. Initial State from MOCK_SHIPMENTS
  const [exceptions, setExceptions] = useState<Shipment[]>(() => {
    return MOCK_SHIPMENTS.filter(s => ['delayed', 'failed', 'flagged'].includes(s.status));
  });

  // Interactive UI states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [anomalyType, setAnomalyType] = useState<'all' | 'customs' | 'slow_transit' | 'high_tier'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // In-action Simulation States
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null); // holds Shipment ID during simulation
  const [reconciledOutput, setReconciledOutput] = useState<string>('');

  // Toast State
  const [toast, setToast] = useState<{ msg: string; visible: boolean; type: 'success' | 'info' | 'error' }>({
    msg: '',
    visible: false,
    type: 'success'
  });

  const showToast = (message: string, styleType: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg: message, visible: true, type: styleType });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4500);
  };

  // 2. Select handlers
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Safe click trigger on row checkbox
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.size === filteredExceptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExceptions.map(item => item.id)));
    }
  };

  // 3. Dynamic Exceptions Metrics counters
  const exceptionCounters = useMemo(() => {
    const list = exceptions;
    const customsHold = list.filter(item => 
      item.events.some(ev => ev.type.toLowerCase().includes('customs'))
    ).length;

    const extremeDelayCount = list.filter(item => {
      const idCode = parseInt(item.id.replace(/\D/g, ''), 10) || 5;
      const calculatedLateDays = (idCode % 4) + 1;
      return calculatedLateDays >= 3;
    }).length;

    const flaggedCount = list.filter(item => item.status === 'flagged').length;

    return {
      total: list.length,
      customsHold,
      extremeDelayCount,
      flaggedCount
    };
  }, [exceptions]);

  // 4. Filtering criteria (Dynamic search + anomaly select dropdown)
  const filteredExceptions = useMemo(() => {
    return exceptions.filter(s => {
      // Search matches Tracking ID, Origin, Destination, Carrier
      const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.carrier.toLowerCase().includes(search.toLowerCase()) ||
        s.origin.city.toLowerCase().includes(search.toLowerCase()) ||
        s.destination.city.toLowerCase().includes(search.toLowerCase());

      // Anomaly type classification matches
      let matchesAnomaly = true;
      if (anomalyType === 'customs') {
        matchesAnomaly = s.events.some(ev => ev.type.toLowerCase().includes('customs')) || s.status === 'flagged';
      } else if (anomalyType === 'slow_transit') {
        matchesAnomaly = s.status === 'delayed';
      } else if (anomalyType === 'high_tier') {
        // High priority / high tier late (weight > 250kg or calculated late > 3)
        const idCode = parseInt(s.id.replace(/\D/g, ''), 10) || 0;
        const calculatedLateDays = (idCode % 4) + 1;
        matchesAnomaly = s.weight > 200 || calculatedLateDays >= 3;
      }

      return matchesSearch && matchesAnomaly;
    });
  }, [exceptions, search, anomalyType]);

  // 5. Actions Handlers
  const handleBulkEscalate = () => {
    if (selectedIds.size === 0) return;
    showToast(`Urgent Satellite Escalation signal dispatched to ${selectedIds.size} flight decks. Priority routing active.`, 'success');
    setSelectedIds(new Set());
  };

  const handleResolve = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExceptions(prev => prev.filter(item => item.id !== id));
    if (expandedId === id) setExpandedId(null);
    showToast(`Shipment ${id} marked as resolved & returned to active delivery registry.`, 'success');
  };

  // 6. Interactive Troubleshooting Actions
  const handleSimulateCustomsClearance = (shipment: Shipment) => {
    setIsProcessingAction(shipment.id);
    setReconciledOutput('🛰️ Initializing customs secure channel bypass...');
    
    setTimeout(() => {
      setReconciledOutput(prev => prev + '\n📂 Electronic transit documents (Bill of Lading / Invoices) auto-packaged.');
    }, 700);

    setTimeout(() => {
      setReconciledOutput(prev => prev + '\n🔑 Dispatching secure hash token to port clearance tower...');
    }, 1400);

    setTimeout(() => {
      setIsProcessingAction(null);
      setReconciledOutput('');
      // Update exceptions list state to remove/resolve this shipment
      handleResolve(shipment.id);
      showToast(`Customs hold released on ${shipment.id}. Dispatched for final leg delivery.`, 'success');
    }, 2200);
  };

  const handleSimulateCarrierPing = (shipment: Shipment) => {
    setIsProcessingAction(shipment.id);
    setReconciledOutput(`📞 Signaling regional operations manager for ${shipment.carrier}...`);

    setTimeout(() => {
      setReconciledOutput(prev => prev + '\n📢 SLA warning broadcasted. Performance remediation requested.');
    }, 800);

    setTimeout(() => {
      setIsProcessingAction(null);
      setReconciledOutput('');
      showToast(`Emergency operational warning email sent to ${shipment.carrier} priority dispatch desk.`, 'info');
    }, 1600);
  };

  const handleSimulateReroute = (shipment: Shipment, newCarrier: string) => {
    setIsProcessingAction(shipment.id);
    setReconciledOutput(`🚧 Flagging shipment route as void under original contract...`);
    
    setTimeout(() => {
      setReconciledOutput(prev => prev + `\n🚚 Transferring payload telemetry to ${newCarrier} Priority network...`);
    }, 700);

    setTimeout(() => {
      setReconciledOutput(prev => prev + `\n🔄 Re-indexing waypoint coordinates for ${shipment.destination.city} sector...`);
    }, 1400);

    setTimeout(() => {
      setIsProcessingAction(null);
      setReconciledOutput('');
      // Update exceptions list state to reassign the carrier and resolve/remain in transit
      setExceptions(prev => prev.map(item => {
        if (item.id === shipment.id) {
          return {
            ...item,
            carrier: newCarrier,
            status: 'in_transit', // returned to regular transit
            events: [
              { timestamp: new Date().toISOString(), location: 'Local Terminal', type: `Carrier Rerouted to ${newCarrier}` },
              ...item.events
            ]
          };
        }
        return item;
      }));
      showToast(`Successfully re-routed consignment ${shipment.id} via ${newCarrier} Network.`, 'success');
    }, 2200);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 min-h-[850px] relative pb-16">
      
      {/* Header and Aggregate Stats Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-accent-warning flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <span>Operational Exceptions Control</span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5 font-mono">Real-time customs holds, container delivery warnings, and emergency reroute tools.</p>
        </div>
        
        {/* Bulk Action Controls */}
        <div className={cn(
          "flex items-center gap-3 transition-all duration-200 shrink-0", 
          selectedIds.size > 0 ? "opacity-100 translate-x-0 cursor-default" : "opacity-0 translate-x-4 pointer-events-none"
        )}>
          <span className="text-xs text-text-muted font-mono font-bold bg-bg-surface border border-bg-elevated px-2.5 py-1 rounded-md">{selectedIds.size} Node Checked</span>
          <button 
            type="button"
            id="bulk-escalate-btn"
            onClick={handleBulkEscalate}
            className="bg-accent-primary hover:bg-accent-primary/95 text-white px-3.5 py-1.5 rounded-md text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-accent-primary/10"
          >
            <CornerUpRight className="w-3.5 h-3.5" />
            <span>Escalate Signals</span>
          </button>
        </div>
      </div>

      {/* Exception Metrics Counters ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-accent-warning/10 text-accent-warning">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Active Exceptions</span>
            <span className="text-lg font-mono font-bold text-text-primary">{exceptionCounters.total}</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Customs Clear Holds</span>
            <span className="text-lg font-mono font-bold text-orange-400">{exceptionCounters.customsHold}</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-500/10 text-accent-danger">
            <ShieldAlert className="w-4 h-4 text-accent-danger" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Critical Backlogs (&ge;3 Days)</span>
            <span className="text-lg font-mono font-bold text-accent-danger">{exceptionCounters.extremeDelayCount}</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <Globe className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Flagged Discrepancies</span>
            <span className="text-lg font-mono font-bold text-purple-400">{exceptionCounters.flaggedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Search */}
        <div className="relative w-full md:flex-1 md:max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            id="exceptions-search-input"
            type="text"
            placeholder="Search anomalies (Tracking ID, carrier, route)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-elevated/40 border border-bg-elevated rounded-md py-1.5 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all font-sans"
          />
        </div>

        {/* Anomaly selector menus */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <span className="text-[10.5px] font-mono text-text-muted uppercase font-bold">Category Match:</span>
          <div className="bg-bg-elevated/40 border border-bg-elevated p-1 rounded-lg flex items-center shadow-inner text-xs">
            <button 
              id="anomaly-filter-all"
              onClick={() => setAnomalyType('all')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-mono text-[10.5px]",
                anomalyType === 'all' ? "bg-bg-surface text-accent-primary font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              All
            </button>
            <button 
              id="anomaly-filter-customs"
              onClick={() => setAnomalyType('customs')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-mono text-[10.5px]",
                anomalyType === 'customs' ? "bg-bg-surface text-orange-400 font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              Customs/Flagged
            </button>
            <button 
              id="anomaly-filter-slow"
              onClick={() => setAnomalyType('slow_transit')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-mono text-[10.5px]",
                anomalyType === 'slow_transit' ? "bg-bg-surface text-accent-warning font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              Custom Transit Late
            </button>
            <button 
              id="anomaly-filter-high"
              onClick={() => setAnomalyType('high_tier')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-mono text-[10.5px]",
                anomalyType === 'high_tier' ? "bg-bg-surface text-accent-danger font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              Core High Risk
            </button>
          </div>
        </div>

      </div>

      {/* Main Exceptions Layout list */}
      <div className="bg-bg-surface border border-bg-elevated rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated/30 text-text-muted border-b border-bg-elevated font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center cursor-pointer" onClick={toggleAll}>
                  {selectedIds.size > 0 && selectedIds.size === filteredExceptions.length ? (
                    <CheckSquare className="w-4 h-4 text-accent-primary mx-auto" />
                  ) : (
                    <Square className="w-4 h-4 mx-auto text-text-muted" />
                  )}
                </th>
                <th className="px-4 py-3.5">Tracking node</th>
                <th className="px-4 py-3.5">Category Anomaly</th>
                <th className="px-4 py-3.5">Consigner Carrier</th>
                <th className="px-4 py-3.5">Route</th>
                <th className="px-4 py-3.5">Weight (Payload)</th>
                <th className="px-4 py-3.5">Estimated Overdue</th>
                <th className="px-4 py-3.5 text-right pr-6">Manual Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-elevated/50 font-mono">
              {filteredExceptions.map(s => {
                const isSelected = selectedIds.has(s.id);
                const isExpanded = expandedId === s.id;
                
                // Deterministic calculation of lateness based on ID code
                const idCode = parseInt(s.id.replace(/\D/g, ''), 10) || 5;
                const calculatedLateDays = (idCode % 4) + 1;

                // Checking if shipment events contain customs indicators
                const isCustomsBlock = s.events.some(ev => ev.type.toLowerCase().includes('customs')) || s.status === 'flagged';

                return (
                  <React.Fragment key={s.id}>
                    <tr 
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className={cn(
                        "hover:bg-bg-elevated/30 transition-all cursor-pointer relative group",
                        isSelected && "bg-accent-primary/[0.02]",
                        isExpanded && "bg-bg-elevated/10"
                      )}
                    >
                      {/* Checkbox column */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => toggleSelect(s.id, e)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-accent-primary mx-auto" />
                        ) : (
                          <Square className="w-4 h-4 text-text-muted mx-auto group-hover:text-text-primary" />
                        )}
                      </td>

                      {/* Tracking ID */}
                      <td className="px-4 py-3.5 font-bold text-text-primary flex items-center gap-1.5 h-12">
                        <span>{s.id}</span>
                        {calculatedLateDays >= 3 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-danger animate-pulse" title="High Priority alarm" />
                        )}
                      </td>

                      {/* Status / Category Anomaly */}
                      <td className="px-4 py-3.5 font-sans">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center w-max gap-1",
                          isCustomsBlock
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : s.status === 'failed'
                            ? 'bg-accent-danger/15 text-accent-danger border border-accent-danger/20'
                            : 'bg-accent-warning/15 text-accent-warning border border-accent-warning/15'
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            isCustomsBlock ? "bg-orange-400" : s.status === 'failed' ? "bg-accent-danger" : "bg-accent-warning"
                          )} />
                          <span>{isCustomsBlock ? 'Customs Hold / Alert' : s.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Carrier */}
                      <td className="px-4 py-3.5 text-text-muted">{s.carrier}</td>

                      {/* Route */}
                      <td className="px-4 py-3.5 text-text-primary text-[11px]">
                        <span>{s.origin.city}</span>
                        <ArrowRight className="w-3 h-3 inline-block mx-1.5 text-text-muted" />
                        <span>{s.destination.city}</span>
                      </td>

                      {/* Weight */}
                      <td className="px-4 py-3.5 text-text-muted">{s.weight} kg</td>

                      {/* Days late */}
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "font-bold text-[11px]",
                          calculatedLateDays >= 3 ? "text-accent-danger" : "text-accent-warning"
                        )}>
                          +{calculatedLateDays} Days
                        </span>
                      </td>

                      {/* Row Action buttons */}
                      <td className="px-4 py-3.5 text-right pr-6 font-sans">
                        <div className="flex items-center justify-end gap-2.5">
                          <button 
                            type="button"
                            onClick={(e) => handleResolve(s.id, e)}
                            className="text-xs font-semibold text-accent-success hover:bg-accent-success/15 border border-transparent hover:border-accent-success/25 px-2.5 py-1 rounded transition-colors"
                          >
                            Resolve
                          </button>
                          
                          {/* Expansion toggler */}
                          <div className="text-text-muted group-hover:text-text-primary transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </td>

                    </tr>

                    {/* EXPANDED INTERACTIVE TROUBLESHOOTING DRAWER */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-bg-elevated/10 border-b border-bg-elevated px-6 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                            
                            {/* Panel 1: Satellite Tracking Timeline Logs */}
                            <div className="lg:col-span-1 bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex flex-col justify-between">
                              <div>
                                <h4 className="text-[11px] font-mono text-text-muted uppercase border-b border-bg-elevated pb-1.5 mb-2.5 flex items-center justify-between">
                                  <span>Tracking Logs Timeline</span>
                                  <Clock className="w-3.5 h-3.5 text-accent-primary" />
                                </h4>
                                <div className="flex flex-col gap-3 max-h-[140px] overflow-y-auto pr-1 text-[10.5px] font-mono">
                                  {s.events.map((event, i) => (
                                    <div key={i} className="flex gap-2 text-[10.5px]">
                                      <span className="text-text-muted shrink-0">{format(parseISO(event.timestamp), 'MM/dd')}</span>
                                      <div className="flex flex-col flex-1">
                                        <strong className="text-text-primary font-sans">{event.type}</strong>
                                        <span className="text-[9.5px] text-text-muted">location: {event.location}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-3 text-[9px] text-text-muted border-t border-bg-elevated/40 pt-2 flex items-center gap-1">
                                <Database className="w-3.5 h-3.5 text-accent-primary" />
                                <span>Secured by Kibuti decentralized data ledgers.</span>
                              </div>
                            </div>

                            {/* Panel 2: Interactive Operations Tools */}
                            <div className="lg:col-span-1 bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex flex-col justify-between">
                              <h4 className="text-[11px] font-mono text-text-muted uppercase border-b border-bg-elevated pb-1.5 mb-2.5 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-accent-success" />
                                <span>Immediate Remediation Choices</span>
                              </h4>

                              {isProcessingAction === s.id ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-3 font-mono text-[10px] text-accent-primary min-h-[110px]">
                                  <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                                  <pre className="text-left whitespace-pre-wrap leading-tight text-text-muted text-[9.5px] w-full max-h-[90px] overflow-y-auto">
                                    {reconciledOutput}
                                  </pre>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 flex-1 justify-center min-h-[110px]">
                                  
                                  {isCustomsBlock ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSimulateCustomsClearance(s)}
                                      className="w-full bg-orange-500 hover:bg-orange-600 text-bg-base font-bold py-1.5 rounded text-[11px] transition-all flex items-center justify-center gap-1"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-bg-base" />
                                      <span>Dispatch Customs Clear Token</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={s.status === 'failed'}
                                      onClick={() => handleSimulateCarrierPing(s)}
                                      className={cn(
                                        "w-full font-bold py-1.5 rounded text-[11px] transition-all flex items-center justify-center gap-1",
                                        s.status === 'failed' 
                                          ? "bg-bg-elevated text-text-muted cursor-not-allowed" 
                                          : "bg-accent-warning hover:bg-opacity-92 text-bg-base"
                                      )}
                                    >
                                      <Send className="w-3.5 h-3.5 text-bg-base" />
                                      <span>Dispatch Warning to {s.carrier}</span>
                                    </button>
                                  )}

                                  {/* Reroute carrier select dropdown simulation */}
                                  <div className="border-t border-bg-elevated/40 pt-2 flex flex-col gap-1.5">
                                    <span className="text-[10px] font-mono text-text-muted">Alternative Rerouting Network:</span>
                                    <div className="flex gap-1">
                                      {['DHL', 'FedEx', 'Kobo360'].filter(c => c !== s.carrier).map(alternative => (
                                        <button
                                          key={alternative}
                                          type="button"
                                          onClick={() => handleSimulateReroute(s, alternative)}
                                          className="flex-1 bg-bg-elevated hover:bg-zinc-800 border border-bg-elevated hover:border-accent-primary/40 text-text-primary py-1 px-1 rounded text-[9.5px] transition-all"
                                        >
                                          Route {alternative}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              )}
                            </div>

                            {/* Panel 3: Technical Payload Specifications */}
                            <div className="lg:col-span-1 bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex flex-col justify-between">
                              <div>
                                <h4 className="text-[11px] font-mono text-text-muted uppercase border-b border-bg-elevated pb-1.5 mb-2 flex items-center justify-between">
                                  <span>Payload Specifications</span>
                                  <ShieldAlert className="w-3.5 h-3.5 text-accent-danger" />
                                </h4>
                                
                                <div className="flex flex-col gap-1.5 text-[10.5px] font-mono leading-relaxed text-text-muted">
                                  <div>
                                    <span className="font-semibold text-text-primary">Origin Point:</span> {s.origin.city}, {s.origin.country}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-text-primary">Destination Terminal:</span> {s.destination.city}, {s.destination.country}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-text-primary">Carton Volume:</span> {s.dimensions}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-text-primary">ETA Milestone Checklist:</span> {format(parseISO(s.eta), 'PPP')}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleResolve(s.id, e)}
                                className="mt-3 w-full border border-accent-success/20 hover:border-accent-success/60 bg-accent-success/5 hover:bg-accent-success/10 text-accent-success py-1 rounded text-[11px] font-semibold transition-all"
                              >
                                Clear Anomaly & Archive Case File
                              </button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredExceptions.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-text-muted bg-bg-surface">
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle2 className="w-10 h-10 text-accent-success opacity-40 animate-pulse" />
                      <h3 className="font-display font-bold text-text-primary text-sm uppercase">Exceptions cleared</h3>
                      <p className="text-xs text-text-muted max-w-sm leading-relaxed font-sans">
                        Terrific work, operator! There are no outstanding anomalies, backlog violations, or customs blocks registering in this view.
                      </p>
                      {(search || anomalyType !== 'all') && (
                        <button 
                          type="button"
                          onClick={() => { setSearch(''); setAnomalyType('all'); }}
                          className="mt-2 px-3 py-1.5 border border-bg-elevated bg-bg-elevated/50 text-text-primary text-xs rounded font-mono active:scale-95 transition-all"
                        >
                          Clear Filtering Constraints
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating System Audit Toast notifications */}
      <div 
        id="exceptions-action-toast"
        className={cn(
          "fixed bottom-6 right-6 bg-bg-surface border text-[13px] px-4 py-3.5 rounded-lg shadow-2xl flex items-center gap-3.5 transition-all duration-300 z-50",
          toast.type === 'info' ? "border-accent-primary text-accent-primary" : "border-accent-success text-accent-success",
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {toast.type === 'info' ? (
          <AlertTriangle className="w-5 h-5 text-accent-primary shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-accent-success shrink-0" />
        )}
        <span className="font-medium text-text-primary">{toast.msg}</span>
      </div>

    </div>
  );
}
