import React, { useState, useMemo } from 'react';
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
  const [timeWindow, setTimeWindow] = useState<'30' | '90' | '365'>('30');
  const [activeMetric, setActiveMetric] = useState<'volume' | 'weight' | 'emissions'>('volume');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  // 2. Filter Shipments Dynamically based on state selection
  const filteredShipments = useMemo(() => {
    return MOCK_SHIPMENTS.filter(shipment => {
      // Carrier filter
      const matchesCarrier = selectedCarrier === 'all' || 
        shipment.carrier.toLowerCase() === selectedCarrier.toLowerCase();

      // Time Window filter (createdAt is subDays from now, up to 11 days)
      // Since mockData uses subDays up to 10 days, 30/90/365 will capture all, 
      // but let's simulate realistic subsets based on date ranges
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

    // SLA score (on time is total subtracting delayed / failed)
    const exceptionalCount = filteredShipments.filter(s => s.status === 'delivered' || s.status === 'in_transit').length;
    const slaScore = Number(((exceptionalCount / totalCount) * 100).toFixed(1));

    // Estimated Carbon Emissions: 0.12kg CO2 per kg weight per routing leg (average continental)
    const totalEmissions = Number(((totalWeight * 0.12) / 1000).toFixed(2)); // in metric tons CO2
    const carbonSavings = Number((totalEmissions * 0.15).toFixed(2)); // simulated 15% optimization savings

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
      // Map destinations to sectors
      const city = s.destination.city;
      if (['Lagos', 'Accra', 'Dakar'].includes(city)) counts['West Africa'] += 1;
      else if (['Nairobi', 'Kigali'].includes(city)) counts['East Africa'] += 1;
      else if (['Johannesburg'].includes(city)) counts['Southern Africa'] += 1;
      else counts['North Africa'] += 1; // Cairo, Casablanca
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
    
    // Rule A: Check SLA
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

    // Rule B: Carrier performance recommendation
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
        body: `DHL exhibits a higher transit delay friction index (${dhlDelayRate.toFixed(0)}%) this week. Reallocate Lagos sector tonnage to FedEx.`
      });
    } else {
      list.push({
        type: 'info' as const,
        title: 'Routing Consolidation Opportunities',
        body: `Optimal regional performance is tracked along West and East continental freight corridors. Container space pool efficiency increased by 8.2%.`
      });
    }

    // Rule C: Green rating
    if (kpiStats.totalEmissions > 1.2) {
      list.push({
        type: 'sustainability' as const,
        title: 'Emissions Cap Warning',
        body: `Total estimated carbon footprints reached ${kpiStats.totalEmissions} metric tons CO2. Tonnage pooling can save up to ${kpiStats.carbonSavings} tons.`
      });
    }

    return list;
  }, [kpiStats]);

  const activeMetricLabel = {
    volume: 'Consignments Count',
    weight: 'Tonnage Managed (kg)',
    emissions: 'CO2 Footprint (Tons)'
  }[activeMetric];

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 border-b border-bg-elevated/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-text-primary flex items-center gap-2">
            <span>Operational Logistical Analytics</span>
            <span className="text-[10px] font-mono font-semibold bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded uppercase tracking-wider">Dynamic Reconciler</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">Consolidated macro trends, carbon indexes, and cargo flow telemetry.</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Carrier pills */}
          <div className="bg-bg-surface border border-bg-elevated p-1 rounded-lg flex items-center shadow-inner text-xs">
            <button 
              id="analytics-carrier-all"
              onClick={() => setSelectedCarrier('all')}
              className={cn(
                "px-2.5 py-1 rounded transition-all font-mono text-[11px]",
                selectedCarrier === 'all' ? "bg-accent-primary text-bg-base font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              All Partners
            </button>
            {['DHL', 'FedEx', 'UCP Logistics', 'Kobo360', 'Sendbox'].map(carrier => (
              <button 
                key={carrier}
                id={`analytics-carrier-${carrier.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCarrier(carrier)}
                className={cn(
                  "px-2.5 py-1 rounded transition-all font-mono text-[11px] hidden sm:block",
                  selectedCarrier === carrier ? "bg-accent-primary text-bg-base font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
                )}
              >
                {carrier}
              </button>
            ))}
          </div>

          {/* Time window dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-text-muted uppercase font-bold">Horizon:</span>
            <select 
              id="analytics-time-window"
              value={timeWindow} 
              onChange={e => setTimeWindow(e.target.value as any)}
              className="bg-bg-surface border border-bg-elevated rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary font-mono cursor-pointer"
            >
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate Overview statistics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* KPI 1: Volumetric */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-3 rounded-lg bg-accent-primary/10 text-accent-primary">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Total Dispatches</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-text-primary">{kpiStats.totalVolume}</span>
              <span className="text-[10px] text-accent-success font-mono flex items-center font-semibold">
                <ArrowUpRight className="w-3 h-3" /> +12%
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: On-Time SLA */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className={cn(
            "p-3 rounded-lg transition-colors",
            kpiStats.slaScore >= 90 ? "bg-accent-success/15 text-accent-success" : "bg-accent-warning/15 text-accent-warning"
          )}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Consolidated SLA</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-xl font-mono font-bold",
                kpiStats.slaScore >= 90 ? "text-accent-success" : "text-accent-warning"
              )}>
                {kpiStats.slaScore}%
              </span>
              <span className="text-[9px] text-text-muted font-semibold">Target &ge;90%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Weight */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Tonnage Managed</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-text-primary">
                {(kpiStats.totalTonnage / 1000).toFixed(1)}t
              </span>
              <span className="text-[10px] text-text-muted font-mono">{kpiStats.totalTonnage.toLocaleString()} kg</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Carbon Emissions index */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-3 rounded-lg bg-emerald-500/15 text-accent-success">
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider block">Estimated Footprint</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-emerald-400">{kpiStats.totalEmissions} CO2e</span>
              <span className="text-[9.5px] text-emerald-500 font-mono font-bold">-{kpiStats.carbonSavings} Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Trend Chart + Side Pie Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Metric Trendline Panel */}
        <div className="lg:col-span-2 bg-bg-surface border border-bg-elevated rounded-xl p-5 flex flex-col justify-between h-[420px]">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div>
              <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                <Activity className="w-4 h-4 text-accent-primary" />
                <span>Macro Performance History</span>
              </h3>
              <p className="text-[11px] text-text-muted font-mono">Daily tracking resolution of the specified parameter index.</p>
            </div>

            {/* Selectable trends buttons */}
            <div className="bg-bg-elevated/40 border border-bg-elevated p-1 rounded-lg flex items-center shadow-inner text-xs self-end">
              <button 
                id="metric-toggle-volume"
                onClick={() => setActiveMetric('volume')}
                className={cn(
                  "px-2 py-0.5 rounded transition-all text-[10px] font-mono uppercase font-semibold",
                  activeMetric === 'volume' ? "bg-bg-surface text-accent-primary font-bold shadow-sm border border-bg-elevated" : "text-text-muted hover:text-text-primary"
                )}
              >
                Volume
              </button>
              <button 
                id="metric-toggle-weight"
                onClick={() => setActiveMetric('weight')}
                className={cn(
                  "px-2 py-0.5 rounded transition-all text-[10px] font-mono uppercase font-semibold",
                  activeMetric === 'weight' ? "bg-bg-surface text-accent-primary font-bold shadow-sm border border-bg-elevated" : "text-text-muted hover:text-text-primary"
                )}
              >
                Tonnage
              </button>
              <button 
                id="metric-toggle-emissions"
                onClick={() => setActiveMetric('emissions')}
                className={cn(
                  "px-2 py-0.5 rounded transition-all text-[10px] font-mono uppercase font-semibold",
                  activeMetric === 'emissions' ? "bg-bg-surface text-accent-primary font-bold shadow-sm border border-bg-elevated" : "text-text-muted hover:text-text-primary"
                )}
              >
                Carbon Footprint
              </button>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={dailyTrendsData} 
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload) {
                    setHoveredDataPoint(state.activePayload[0].payload);
                  }
                }}
                onMouseLeave={() => setHoveredDataPoint(null)}
              >
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2539" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#131929', borderColor: '#1C2539', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                  itemStyle={{ color: '#F1F5F9' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke="#3B82F6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#metricGradient)" 
                  name={activeMetricLabel} 
                  dot={{ r: 3, fill: '#0B0F1A', strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Micro chart details summary context */}
          <div className="mt-1 flex justify-between items-center text-[10px] font-mono text-text-muted border-t border-bg-elevated/40 pt-2 shrink-0">
            <span>Operational Resolution: Satellite Feed active</span>
            {hoveredDataPoint && (
              <span className="text-accent-primary font-semibold">
                Captured for {hoveredDataPoint.date}: {hoveredDataPoint[activeMetric].toLocaleString()} {activeMetric === 'weight' ? 'kg' : activeMetric === 'emissions' ? 'tons' : 'delivs'}
              </span>
            )}
          </div>
        </div>

        {/* Pie Status Breakdown Panel */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 flex flex-col justify-between h-[420px]">
          <div>
            <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span>SLA Port Status Breakdown</span>
            </h3>
            <p className="text-[11px] text-text-muted font-mono leading-relaxed">Proportion of physical package routing states in the filter active window.</p>
          </div>

          <div className="flex-1 flex items-center justify-center relative min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                  stroke="none"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#131929', borderColor: '#1C2539', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                  itemStyle={{ color: '#F1F5F9' }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span id="pie-center-value" className="text-2xl font-bold font-display leading-none">{kpiStats.totalVolume}</span>
              <span className="text-[10px] text-text-muted mt-1 uppercase font-mono">Consignments</span>
            </div>
          </div>

          {/* Color Indicators Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-mono border-t border-bg-elevated/40 pt-3">
            {statusPieData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full block shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-text-muted truncate max-w-[100px]">{entry.name} ({entry.count})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Region Bar Chart + Recommendation Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Regional Volume Horizontal bar chart */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Volume by Regional Sector</span>
            </h3>
            <p className="text-[11px] text-text-muted font-mono leading-relaxed">Distribution of physical cargo flow passing key regional customs towers.</p>
          </div>

          <div className="flex-1 w-full min-h-[180px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionVolumeData} layout="vertical" margin={{ top: 0, right: 10, left: 15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2539" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="region" type="category" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} width={85} />
                <RechartsTooltip cursor={{ fill: '#1C2539', opacity: 0.2 }} contentStyle={{ backgroundColor: '#131929', borderColor: '#1C2539', borderRadius: '8px', fontSize: "11px", fontFamily: "monospace" }} itemStyle={{ color: '#F1F5F9' }} />
                <Bar dataKey="volume" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16}>
                  {regionVolumeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.customColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <span className="text-[9.5px] font-mono text-text-muted uppercase tracking-wide text-center shrink-0">Lagos, Casablanca, Nairobi & Johannesburg Hub metrics synched</span>
        </div>

        {/* AI Control Tower Insights Recommendation Card */}
        <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 h-[340px] flex flex-col justify-between lg:col-span-2">
          
          <div className="border-b border-bg-elevated pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
                <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider">
                  Operational Recommendation Engine
                </h3>
              </div>
              <span className="text-[9px] font-mono text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Audit Insight Enabled</span>
            </div>
            <p className="text-[11px] text-text-muted font-mono mt-1">Real-time heuristics analyzed based on current regional performance variables.</p>
          </div>

          {/* Scrollable Insight Rows */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1 my-3 scrollbar-thin">
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
                  className={cn(
                    "border rounded-lg p-3 transition-colors flex items-start gap-3",
                    theme.border,
                    theme.bg
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {insight.type === 'warning' && <AlertTriangle className={cn("w-4 h-4", theme.iconColor)} />}
                    {insight.type === 'success' && <CheckCircle2 className={cn("w-4 h-4", theme.iconColor)} />}
                    {insight.type === 'info' && <Info className={cn("w-4 h-4", theme.iconColor)} />}
                    {insight.type === 'sustainability' && <Leaf className={cn("w-4 h-4", theme.iconColor)} />}
                  </div>

                  <div className="flex-1">
                    <h4 className={cn("text-xs font-bold font-display tracking-wide", theme.titleColor)}>
                      {insight.title}
                    </h4>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed font-sans">
                      {insight.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advisory warning */}
          <div className="bg-bg-elevated/40 rounded-lg p-2 flex items-center gap-2 text-[10px] text-text-muted font-sans border border-bg-elevated/30 shrink-0">
            <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span>These recommendations are dynamically computed from workspace live latency models. Check the exceptions queue for pending cargo releases.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
