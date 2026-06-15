import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { MOCK_SHIPMENTS, MOCK_CARRIERS } from '../mockData';
import { 
  TrendingUp, 
  TrendingDown, 
  Leaf, 
  Clock, 
  Package, 
  Scale, 
  Globe, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Layers,
  Sparkles,
  HelpCircle,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, subDays, isAfter, isBefore, parseISO } from 'date-fns';

export function Analytics() {
  // 1. Interactive States
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [timeWindow, setTimeWindow] = useState<'7' | '30' | '90' | '365'>('30');
  const [activeMetric, setActiveMetric] = useState<'volume' | 'weight' | 'emissions'>('volume');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);
  
  // Mobile check
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Filter Shipments Dynamically based on state selection
  const filteredShipments = useMemo(() => {
    return MOCK_SHIPMENTS.filter(shipment => {
      // Carrier filter
      const matchesCarrier = selectedCarrier === 'all' || 
        shipment.carrier.toLowerCase() === selectedCarrier.toLowerCase();

      // Time Window filter
      const createdDate = parseISO(shipment.createdAt);
      const limitDays = Number(timeWindow);
      const cutoffDate = subDays(new Date(), limitDays);
      const matchesTime = isAfter(createdDate, cutoffDate);

      return matchesCarrier && matchesTime;
    });
  }, [selectedCarrier, timeWindow]);

  // 3. Aggregate Macro KPIs
  const kpiStats = useMemo(() => {
    const totalCount = filteredShipments.length;
    if (totalCount === 0) {
      return {
        totalVolume: 0,
        totalTonnage: 0,
        avgLeadTime: 0,
        slaScore: 0,
        totalEmissions: 0,
        carbonSavings: 0
      };
    }

    const totalWeight = filteredShipments.reduce((sum, s) => sum + s.weight, 0);
    
    // Average lead time estimation (from createdAt to ETA)
    const totalLeadDays = filteredShipments.reduce((sum, s) => {
      const created = parseISO(s.createdAt);
      const eta = parseISO(s.eta);
      const diffTime = Math.abs(eta.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    const avgLeadTime = Number((totalLeadDays / totalCount).toFixed(1));

    // SLA score 
    const exceptionalCount = filteredShipments.filter(s => s.status === 'delivered' || s.status === 'in_transit').length;
    const slaScore = Number(((exceptionalCount / totalCount) * 100).toFixed(1));

    // Estimated Carbon Emissions
    const totalEmissions = Number(((totalWeight * 0.12) / 1000).toFixed(2));
    const carbonSavings = Number((totalEmissions * 0.15).toFixed(2));

    return {
      totalVolume: totalCount,
      totalTonnage: totalWeight,
      avgLeadTime,
      slaScore,
      totalEmissions,
      carbonSavings
    };
  }, [filteredShipments]);

  // 4. Group by Date for Primary Trend Chart
  const dailyTrendsData = useMemo(() => {
    const dateMap: { [key: string]: { date: string; volume: number; weight: number; emissions: number } } = {};
    
    // Initialize last 10 days to have flat clean curve
    for (let i = 9; i >= 0; i--) {
      const dStr = format(subDays(new Date(), i), 'MMM dd');
      dateMap[dStr] = { date: dStr, volume: 0, weight: 0, emissions: 0 };
    }

    filteredShipments.forEach(s => {
      const formattedDate = format(parseISO(s.createdAt), 'MMM dd');
      if (dateMap[formattedDate]) {
        dateMap[formattedDate].volume += 1;
        dateMap[formattedDate].weight += s.weight;
        dateMap[formattedDate].emissions += Number(((s.weight * 0.12) / 1000).toFixed(3));
      }
    });

    return Object.values(dateMap);
  }, [filteredShipments]);

  // 5. Regional Distribution
  const regionVolumeData = useMemo(() => {
    const counts: { [key: string]: number } = {
      'West Africa': 0,
      'East Africa': 0,
      'Southern Africa': 0,
      'North Africa': 0
    };

    filteredShipments.forEach(s => {
      const city = s.destination.city;
      if (['Lagos', 'Accra', 'Dakar'].includes(city)) counts['West Africa'] += 1;
      else if (['Nairobi', 'Kigali'].includes(city)) counts['East Africa'] += 1;
      else if (['Johannesburg'].includes(city)) counts['Southern Africa'] += 1;
      else counts['North Africa'] += 1;
    });

    return Object.entries(counts).map(([region, value]) => ({
      region,
      volume: value,
      customColor: region === 'West Africa' ? '#3B82F6' :
                   region === 'East Africa' ? '#10B981' :
                   region === 'Southern Africa' ? '#F59E0B' : '#8B5CF6'
    }));
  }, [filteredShipments]);

  // 6. Carrier Share status logic
  const statusPieData = useMemo(() => {
    const statuses = [
      { name: 'Delivered', count: 0, color: '#10B981', desc: 'Secure handoffs with zero issues.' },
      { name: 'In Transit', count: 0, color: '#3B82F6', desc: 'Moving smoothly along priority legs.' },
      { name: 'Delayed', count: 0, color: '#F59E0B', desc: 'Held at customs or weather corridors.' },
      { name: 'Flagged', count: 0, color: '#8B5CF6', desc: 'Alert payload, manual check active.' },
      { name: 'Failed', count: 0, color: '#EF4444', desc: 'Undelivered, requires investigation.' }
    ];

    filteredShipments.forEach(s => {
      const match = statuses.find(item => item.name.toLowerCase().replace(' ', '_') === s.status);
      if (match) match.count += 1;
    });

    return statuses.filter(s => s.count > 0);
  }, [filteredShipments]);

  // 7. Dynamic Recommendations Generator based on real KPIs
  const actionInsights = useMemo(() => {
    const list = [];
    
    if (kpiStats.slaScore < 85) {
      list.push({
        type: 'warning' as const,
        title: 'SLA Deviation Alert',
        body: `Continuous delays have pushed the current SLA to ${kpiStats.slaScore}%. Immediate escalation to dispatch control recommended.`
      });
    } else {
      list.push({
        type: 'success' as const,
        title: 'Network SLA Healthy',
        body: `All active routes exceed optimal target with ${kpiStats.slaScore}% on-time handshakes. Transit speeds stable.`
      });
    }

    const dhlShipments = MOCK_SHIPMENTS.filter(s => s.carrier === 'DHL');
    const dhlDelayed = dhlShipments.filter(s => ['delayed', 'failed'].includes(s.status)).length;
    const dhlDelayRate = dhlShipments.length > 0 ? (dhlDelayed / dhlShipments.length) * 100 : 0;

    const fedexShipments = MOCK_SHIPMENTS.filter(s => s.carrier === 'FedEx');
    const fedexDelayed = fedexShipments.filter(s => ['delayed', 'failed'].includes(s.status)).length;
    const fedexDelayRate = fedexShipments.length > 0 ? (fedexDelayed / fedexShipments.length) * 100 : 0;

    if (dhlDelayRate > 20 && fedexDelayRate < dhlDelayRate) {
      list.push({
        type: 'info' as const,
        title: 'Carrier Load Optimization',
        body: `DHL exhibits higher congestion delays on our lines. Consider re-routing priority containers to FedEx.`
      });
    } else {
      list.push({
        type: 'info' as const,
        title: 'Routing Consolidation Opportunities',
        body: `West and East continental freight corridors are showing high throughput. space-pool efficiency elevated by 8%.`
      });
    }

    if (kpiStats.totalEmissions > 1.2) {
      list.push({
        type: 'sustainability' as const,
        title: 'Eco-Compliance Audit Warning',
        body: `Footprints reached ${kpiStats.totalEmissions} tons CO2e. Payload consolidations can save up to ${kpiStats.carbonSavings} tons CO2.`
      });
    }

    return list;
  }, [kpiStats]);

  const activeMetricLabel = {
    volume: 'Consignments Volume',
    weight: 'Tonnage Managed (kg)',
    emissions: 'Estimated Footprint (CO2e)'
  }[activeMetric];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Header element */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-5 border-b border-bg-elevated/40 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-text-primary flex items-center gap-2">
            <span>Operational Logistical Analytics</span>
          </h1>
          <p className="text-[11px] text-text-muted mt-1 font-mono">Consolidated macro trends, carbon indexes, and cargo flow telemetry.</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto">
          {/* Scrollable date/time range chips for mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar -mx-2 px-2 shrink-0">
            {[
              { key: '7', label: '7 Days' },
              { key: '30', label: '30 Days' },
              { key: '90', label: '90 Days' },
              { key: '365', label: '1 Year' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeWindow(opt.key as any)}
                className={cn(
                  "px-3.5 h-[34px] rounded-full text-xs font-semibold whitespace-nowrap border shrink-0 transition-colors uppercase font-mono select-none active:scale-95 focus:outline-none",
                  timeWindow === opt.key 
                    ? "bg-accent-primary text-bg-base border-accent-primary font-bold" 
                    : "bg-bg-elevated/60 border-transparent text-text-secondary"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Scrollable carrier chips for mobile instead of drop downs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar -mx-2 px-2 shrink-0">
            {['all', 'DHL', 'FedEx', 'UCP Logistics', 'Kobo360', 'Sendbox'].map(carrier => (
              <button 
                key={carrier}
                onClick={() => setSelectedCarrier(carrier.toLowerCase())}
                className={cn(
                  "px-3.5 h-[34px] rounded-full text-xs font-semibold whitespace-nowrap border shrink-0 transition-colors uppercase font-mono select-none active:scale-95 focus:outline-none",
                  (carrier === 'all' ? selectedCarrier === 'all' : selectedCarrier === carrier.toLowerCase())
                    ? "bg-accent-primary text-bg-base border-accent-primary font-bold"
                    : "bg-bg-elevated/40 border-transparent text-text-secondary"
                )}
              >
                {carrier === 'all' ? 'All Partners' : carrier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate metrics line */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 text-sans">
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded bg-accent-primary/10 text-accent-primary">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-muted uppercase block">Dispatches</span>
            <span className="text-sm font-mono font-bold text-text-primary block leading-none mt-1">{kpiStats.totalVolume}</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-lg",
            kpiStats.slaScore >= 90 ? "bg-accent-success/15 text-accent-success" : "bg-accent-warning/15 text-accent-warning"
          )}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-muted uppercase block">Total SLA</span>
            <span className={cn(
              "text-sm font-mono font-bold block leading-none mt-1",
              kpiStats.slaScore >= 90 ? "text-accent-success animate-pulse" : "text-accent-warning"
            )}>
              {kpiStats.slaScore}%
            </span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded bg-yellow-500/10 text-yellow-500">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-muted uppercase block">Tonnage</span>
            <span className="text-sm font-mono font-bold text-text-primary block leading-none mt-1">{(kpiStats.totalTonnage / 1000).toFixed(1)}t</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-500/15 text-accent-success">
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-emerald-400/80 uppercase block">CO2 Emissions</span>
            <span className="text-sm font-mono font-bold text-emerald-400 block leading-none mt-1">{kpiStats.totalEmissions} CO2e</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Trend Chart + Side Pie breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        
        {/* Metric Trendline Panel - Height Capped on Mobile to 320px/220px, 420px on Desktop */}
        <div className="lg:col-span-2 bg-bg-surface border border-bg-elevated rounded-xl p-4 flex flex-col justify-between h-[340px] md:h-[420px]">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0">
            <div>
              <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <Activity className="w-4 h-4 text-accent-primary" />
                <span>Macro Performance History</span>
              </h3>
            </div>

            {/* Metric switches toggle */}
            <div className="bg-bg-elevated/40 border border-bg-elevated p-0.5 rounded-lg flex items-center shadow-inner text-xs self-end">
              {['volume', 'weight', 'emissions'].map(m => (
                <button 
                  key={m}
                  onClick={() => setActiveMetric(m as any)}
                  className={cn(
                    "px-2.5 py-1 rounded transition-all text-[9.5px] font-mono uppercase font-semibold",
                    activeMetric === m ? "bg-bg-surface text-accent-primary font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {m === 'weight' ? 'Tonnage' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Capped at 220px on mobile */}
          <div className="flex-1 w-full h-[220px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2539" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#1F2937', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke="#3B82F6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#metricGradient)" 
                  name={activeMetricLabel} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-[10px] font-mono text-text-muted border-t border-bg-elevated/40 pt-2 shrink-0">
            <span>Satellite stream synched • {activeMetricLabel} active</span>
          </div>
        </div>

        {/* Pie Status Breakdown Panel */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex flex-col justify-between h-[340px] md:h-[420px]">
          <div>
            <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider mb-0.5">
              <span>SLA Port Status Breakdown</span>
            </h3>
            <p className="text-[10px] text-text-muted font-mono leading-none">Proportion of physical package state distributions.</p>
          </div>

          <div className="flex-1 flex items-center justify-center relative min-h-[140px] h-[160px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                  stroke="none"
                >
                  {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#1E293B', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-xl font-bold font-display leading-none">{kpiStats.totalVolume}</span>
              <span className="text-[9px] text-text-muted mt-1 uppercase font-mono">Consignments</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px] font-mono border-t border-bg-elevated/40 pt-2">
            {statusPieData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full block shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-text-muted truncate max-w-[90px]">{entry.name} ({entry.count})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Region Bar Chart + Recommendation Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        
        {/* Regional Volume Horizontal bar chart */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 h-[300px] md:h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Volume by Regional Sector</span>
            </h3>
          </div>

          {/* Horizontal regional bar, height capped */}
          <div className="flex-1 w-full h-[160px] md:h-[200px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionVolumeData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2539" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748B" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis dataKey="region" type="category" stroke="#64748B" fontSize={8} tickLine={false} axisLine={false} width={75} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#1F2937', fontSize: '10px' }} />
                <Bar dataKey="volume" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={12}>
                  {regionVolumeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.customColor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <span className="text-[9px] font-mono text-text-muted uppercase text-center shrink-0 mt-1">Satellite nodes synched</span>
        </div>

        {/* AI Control Tower Insights Recommendation Card */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 h-auto md:h-[340px] flex flex-col justify-between lg:col-span-2">
          
          <div className="border-b border-bg-elevated pb-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
                <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider leading-none">
                  Operational Recommendation Engine
                </h3>
              </div>
            </div>
            <p className="text-[10px] text-text-muted font-mono mt-1">Heuristics analyzed based on active line performance variables.</p>
          </div>

          {/* Scrollable Insight Rows */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 my-2 scrollbar-thin max-h-[160px]">
            {actionInsights.map((insight, idx) => {
              const theme = {
                warning: { border: 'border-accent-warning/20', bg: 'bg-accent-warning/5', iconColor: 'text-accent-warning', titleColor: 'text-accent-warning' },
                success: { border: 'border-accent-success/20', bg: 'bg-accent-success/5', iconColor: 'text-accent-success', titleColor: 'text-accent-success' },
                info: { border: 'border-accent-primary/25', bg: 'bg-accent-primary/5', iconColor: 'text-accent-primary', titleColor: 'text-accent-primary' },
                sustainability: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', iconColor: 'text-emerald-400', titleColor: 'text-emerald-300' }
              }[insight.type];

              return (
                <div 
                  key={idx}
                  className={cn("border rounded-lg p-2.5 flex items-start gap-2.5", theme.border, theme.bg)}
                >
                  <div className="shrink-0 mt-0.5">
                    {insight.type === 'warning' && <AlertTriangle className={cn("w-3.5 h-3.5", theme.iconColor)} />}
                    {insight.type === 'success' && <CheckCircle2 className={cn("w-3.5 h-3.5", theme.iconColor)} />}
                    {insight.type === 'info' && <Info className={cn("w-3.5 h-3.5", theme.iconColor)} />}
                    {insight.type === 'sustainability' && <Leaf className={cn("w-3.5 h-3.5", theme.iconColor)} />}
                  </div>

                  <div className="flex-1">
                    <h4 className={cn("text-xs font-bold leading-none", theme.titleColor)}>{insight.title}</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed font-sans">{insight.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-bg-elevated/40 rounded-lg p-2 flex items-center gap-1.5 text-[9px] text-text-muted font-sans border border-bg-elevated/30 shrink-0">
            <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span>Advisory warning: checks are dynamically calculated from latency models.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
