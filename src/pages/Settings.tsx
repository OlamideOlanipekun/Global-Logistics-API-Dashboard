import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Terminal, 
  Cpu, 
  Database, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Download, 
  Upload, 
  BookOpen, 
  Bell, 
  ShieldCheck, 
  Globe, 
  Webhook,
  Activity,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Settings() {
  // 1. Core State with Local Storage synchronization
  const [operatorName, setOperatorName] = useState(() => localStorage.getItem('op_name') || 'Lagos Central Commander');
  const [operatorId, setOperatorId] = useState(() => localStorage.getItem('op_id') || 'UTC-OP-8042');
  const [primaryRegion, setPrimaryRegion] = useState(() => localStorage.getItem('op_region') || 'all');
  const [slaWarningThreshold, setSlaWarningThreshold] = useState(() => Number(localStorage.getItem('sla_threshold')) || 90);
  const [autoResolveExceptions, setAutoResolveExceptions] = useState(() => localStorage.getItem('auto_resolve') !== 'false');
  const [audioPings, setAudioPings] = useState(() => localStorage.getItem('audio_pings') === 'true');
  const [simulationActive, setSimulationActive] = useState(() => localStorage.getItem('sim_active') !== 'false');
  const [backupEmail, setBackupEmail] = useState(() => localStorage.getItem('backup_email') || 'ops-control@kibuti.network');

  // Diagnostic states
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);

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

  // 2. Save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('op_name', operatorName);
    localStorage.setItem('op_id', operatorId);
    localStorage.setItem('op_region', primaryRegion);
    localStorage.setItem('sla_threshold', slaWarningThreshold.toString());
    localStorage.setItem('auto_resolve', autoResolveExceptions.toString());
    localStorage.setItem('audio_pings', audioPings.toString());
    localStorage.setItem('sim_active', simulationActive.toString());
    localStorage.setItem('backup_email', backupEmail);

    showToast('Workspace telemetry profiles compiled & saved successfully.', 'success');
  };

  // 3. Reset all config defaults
  const handleResetDefaults = () => {
    if (window.confirm('Revert all settings back to pristine telemetry defaults?')) {
      setOperatorName('Lagos Central Commander');
      setOperatorId('UTC-OP-8042');
      setPrimaryRegion('all');
      setSlaWarningThreshold(90);
      setAutoResolveExceptions(true);
      setAudioPings(false);
      setSimulationActive(true);
      setBackupEmail('ops-control@kibuti.network');

      localStorage.clear();
      showToast('Workspace defaults restored.', 'info');
    }
  };

  // 4. diagnostics logic simulation sequence
  const executeDiagnostics = () => {
    if (isRunningDiagnostics) return;
    setIsRunningDiagnostics(true);
    setDiagnosticLogs([]);
    setDiagnosticProgress(0);

    const checkSteps = [
      { prg: 20, log: '📡 Connecting to regional satellite gateway at Lagos Hub (LOS-WEST)...' },
      { prg: 40, log: '🖥️ Injecting carrier telemetry handshakes (DHL, FedEx, UCP-Logistics offline-sync)...' },
      { prg: 60, log: '💾 Authenticating in-memory logistics indexes and database queues...' },
      { prg: 80, log: '🚨 Recalibrating sla alert thresholds at >= ' + slaWarningThreshold + '%...' },
      { prg: 100, log: '⚡ Workspace self-diagnostics: [SUCCESS] 0 anomalies or package leaks discovered.' }
    ];

    checkSteps.forEach((step, idx) => {
      setTimeout(() => {
        setDiagnosticProgress(step.prg);
        setDiagnosticLogs(prev => [...prev, step.log]);
        if (step.prg === 100) {
          setIsRunningDiagnostics(false);
          showToast('Operational Telemetrics Recalibrated. System fully active.', 'success');
        }
      }, (idx + 1) * 900);
    });
  };

  // 5. Config file simulated Download
  const handleExportConfig = () => {
    const configData = {
      workspaceId: 'KIBUTI-NODE-781A',
      operatorName,
      operatorId,
      primaryRegion,
      slaWarningThreshold,
      autoResolveExceptions,
      audioPings,
      simulationActive,
      backupEmail,
      timestamp: new Date().toISOString()
    };
    
    try {
      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kibuti-config-${operatorId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Configuration manifest prepared & downloaded.', 'success');
    } catch (err) {
      showToast('Unable to export workspace config.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-text-primary flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-accent-primary animate-spin-slow" />
            <span>Workspace Operations Center</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">Customize operator telemetry settings, manual threshold adjustments, and diagnostic testing tools.</p>
        </div>

        <button 
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-2 px-3 py-1.5 border border-bg-elevated hover:bg-bg-elevated/40 text-text-muted hover:text-text-primary text-xs font-mono rounded-md active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Main Grid content split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column - Form options */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Section A: Operator Info Card */}
          <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-bg-elevated/40 pb-2.5">
              <User className="w-4 h-4 text-accent-primary" />
              <h2 className="text-sm font-bold font-display text-text-primary tracking-wide">Operator Identification & Hubs</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1.5">Command Operator Name</label>
                <input 
                  type="text"
                  required
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  className="w-full bg-bg-elevated/30 border border-bg-elevated rounded-md py-1.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1.5">Operator Badge ID / Callcode</label>
                <input 
                  type="text"
                  required
                  value={operatorId}
                  onChange={e => setOperatorId(e.target.value)}
                  className="w-full bg-bg-elevated/30 border border-bg-elevated rounded-md py-1.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1.5">Primary Dispatch Center</label>
                <select 
                  value={primaryRegion}
                  onChange={e => setPrimaryRegion(e.target.value)}
                  className="w-full bg-bg-elevated/40 border border-bg-elevated rounded-md py-1.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all font-mono"
                >
                  <option value="all">All Continental Sectors</option>
                  <option value="West Africa">West African Hub (Lagos)</option>
                  <option value="East Africa">East African Hub (Nairobi)</option>
                  <option value="Southern Africa">Southern African Hub (Johannesburg)</option>
                  <option value="North Africa">North African Hub (Casablanca)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1.5">Control Tower Alert Email</label>
                <input 
                  type="email"
                  required
                  value={backupEmail}
                  onChange={e => setBackupEmail(e.target.value)}
                  className="w-full bg-bg-elevated/30 border border-bg-elevated rounded-md py-1.5 px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section B: Alerts & Threshold Controls */}
          <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-bg-elevated/40 pb-2.5">
              <Sliders className="w-4 h-4 text-accent-warning" />
              <h2 className="text-sm font-bold font-display text-text-primary tracking-wide">Operational Threshold Rules</h2>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-mono text-text-muted uppercase">SLA Warning Watchlist Threshold (%)</span>
                  <span className="font-mono text-sm text-accent-warning font-bold">{slaWarningThreshold}%</span>
                </div>
                <p className="text-[11px] text-text-muted mb-2.5">Carriers operating below this on-time percentage will trigger automatic routing containment alerts and watchlist indicators.</p>
                <input 
                  type="range"
                  min={60}
                  max={95}
                  value={slaWarningThreshold}
                  onChange={e => setSlaWarningThreshold(Number(e.target.value))}
                  className="w-full accent-accent-warning bg-bg-elevated h-1 rounded-lg cursor-ew-resize outline-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-text-muted mt-1 uppercase">
                  <span>60% (High Tolerance)</span>
                  <span>80% (Moderate)</span>
                  <span>95% (Extreme Precision)</span>
                </div>
              </div>

              <div className="border-t border-bg-elevated/50 pt-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-text-primary mb-0.5">Automated Exception De-escalation</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">Let background handlers automatically mark minor routing delays (under 12 hours late) as acceptable status transitions without throwing critical alarms.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={autoResolveExceptions}
                      onChange={e => setAutoResolveExceptions(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-bg-elevated rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-primary after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between gap-4 border-t border-bg-elevated/30 pt-3">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-text-primary mb-0.5">Critical Telemetry Audio Pings</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">Enable subtle sound indicators when deep satellite alerts and exception escalations bypass firewall filters during tracking tasks.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={audioPings}
                      onChange={e => setAudioPings(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-bg-elevated rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-primary after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between gap-4 border-t border-bg-elevated/30 pt-3">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-text-primary mb-0.5">Real-time Simulation Active</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">Allow simulated backgrounds to feed minor anomalies and real-time carrier progress events to active monitoring views.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={simulationActive}
                      onChange={e => setSimulationActive(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-bg-elevated rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-primary after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-3 justify-end bg-bg-surface border border-bg-elevated p-4 rounded-xl shadow-sm">
            <span className="text-[11px] font-mono text-text-muted mr-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-accent-success rounded-full animate-pulse"></span>
              <span>All Node variables compliant.</span>
            </span>

            <button
              type="button"
              onClick={handleExportConfig}
              className="px-4 py-2 bg-bg-elevated border border-bg-elevated text-text-primary hover:bg-bg-elevated/80 font-bold font-sans text-xs rounded-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              <span>Export Manifest</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-accent-primary hover:bg-accent-primary/95 text-white font-bold font-sans text-xs rounded-md shadow-lg shadow-accent-primary/15 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              <span>Compile & Save Workspace</span>
            </button>
          </div>

        </form>

        {/* Right column - System Diagnostics Terminal */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* Diagnostic Widget */}
          <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-bg-elevated/40 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent-success" />
                <h2 className="text-sm font-bold font-display text-text-primary tracking-wide">System Diagnostic suite</h2>
              </div>
              <span className="text-[10px] font-mono text-text-muted uppercase">Ready</span>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed mb-4">Reconcile tracking connections, test satellite telemetry packets, and calibrate regional latency thresholds instantly.</p>

            <button
              type="button"
              onClick={executeDiagnostics}
              disabled={isRunningDiagnostics}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-bold transition-all select-none active:scale-95 h-9",
                isRunningDiagnostics 
                  ? "bg-bg-elevated text-text-muted cursor-not-allowed border border-bg-elevated" 
                  : "bg-accent-success text-bg-base hover:opacity-90 font-bold"
              )}
            >
              {isRunningDiagnostics ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-text-muted" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-bg-base" />
              )}
              <span>{isRunningDiagnostics ? "Analyzing Infrastructure..." : "Execute Full Diagnostics Test"}</span>
            </button>

            {/* Diagnostic Logs Screen */}
            {(diagnosticLogs.length > 0 || isRunningDiagnostics) && (
              <div className="mt-4 bg-bg-base/80 border border-bg-elevated rounded-lg p-3 font-mono text-[10px] flex flex-col gap-2 min-h-24">
                <div className="flex justify-between text-text-muted border-b border-bg-elevated/40 pb-1.5 mb-1 text-[9px] uppercase tracking-wider">
                  <span>Diagnostic Feed Log</span>
                  <span>{diagnosticProgress}%</span>
                </div>

                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                  {diagnosticLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed text-text-primary">
                      {log}
                    </div>
                  ))}
                  {isRunningDiagnostics && (
                    <div className="text-accent-primary animate-pulse flex items-center gap-1">
                      <span>_ Generating package response logs...</span>
                    </div>
                  )}
                </div>

                {diagnosticProgress === 100 && (
                  <div className="mt-2 text-[10.5px] font-bold text-accent-success flex items-center gap-1 bg-accent-success/5 p-1.5 rounded border border-accent-success/15 font-sans justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Workspace fully operational. All tests passed.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SLA benchmark advisory panel */}
          <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm text-xs relative overflow-hidden">
            <h3 className="font-bold text-text-primary font-display flex items-center gap-1.5 border-b border-bg-elevated/40 pb-2 mb-2.5">
              <Globe className="w-3.5 h-3.5 text-accent-primary" />
              <span>Continental Telemetry Node</span>
            </h3>

            <div className="flex flex-col gap-2.5 font-mono text-[11px] text-text-muted leading-relaxed">
              <p>Workspace Instance is registered under active identifier <strong className="text-text-primary">KIBUTI-NODE-781A</strong>, routing via satellite cluster <strong className="text-text-primary">EUMETSAT-N9</strong>.</p>
              <p>Delay alarms are integrated directly with carriers using real-time polling API handshakes.</p>
              <p className="p-2 border border-bg-elevated bg-bg-base/30 rounded text-center text-text-primary/70 font-sans italic text-[11.5px]">
                "Speed, accuracy, and operational tracking transparency across African borders."
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Shared system toast indicator */}
      <div 
        id="settings-action-toast"
        className={cn(
          "fixed bottom-6 right-6 bg-bg-surface border text-[13px] px-4 py-3.5 rounded-lg shadow-2xl flex items-center gap-3.5 transition-all duration-300 z-50",
          toast.type === 'info' ? "border-accent-primary text-accent-primary" : 
          toast.type === 'error' ? "border-accent-danger text-accent-danger" : 
          "border-accent-success text-accent-success",
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {toast.type === 'info' ? (
          <AlertTriangle className="w-5 h-5 text-accent-primary shrink-0" />
        ) : toast.type === 'error' ? (
          <AlertTriangle className="w-5 h-5 text-accent-danger shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-accent-success shrink-0" />
        )}
        <span className="font-semibold text-text-primary">{toast.msg}</span>
      </div>

    </div>
  );
}
