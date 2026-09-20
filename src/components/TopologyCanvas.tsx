import React, { useState, useRef } from 'react';
import {
  NetworkNode,
  NetworkLink,
  ActivePacket,
  VlanDefinition,
} from '../types/network';
import {
  Server,
  Monitor,
  ShieldAlert,
  Wifi,
  Activity,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Terminal,
  Power,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface TopologyCanvasProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  vlans: VlanDefinition[];
  packets: ActivePacket[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onToggleLinkStatus: (linkId: string) => void;
  onToggleNodeStatus: (nodeId: string) => void;
  onOpenPacketInspector: (packet: ActivePacket) => void;
  onOpenCli: (nodeId: string) => void;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  nodes,
  links,
  vlans,
  packets,
  selectedNodeId,
  onSelectNode,
  onToggleLinkStatus,
  onToggleNodeStatus,
  onOpenPacketInspector,
  onOpenCli,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Helper to get device icon
  const renderDeviceIcon = (node: NetworkNode) => {
    switch (node.type) {
      case 'router':
        return (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center shadow-lg border border-blue-400/40 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
        );
      case 'core-switch':
        return (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-700 to-purple-900 text-white flex items-center justify-center shadow-lg border border-indigo-400/40 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
        );
      case 'dist-switch':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-700 to-blue-900 text-white flex items-center justify-center shadow-lg border border-cyan-400/40 group-hover:scale-105 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
        );
      case 'access-switch':
        return (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-md border border-slate-600/50 group-hover:scale-105 transition-transform">
            <Wifi className="w-5 h-5" />
          </div>
        );
      case 'server':
        return (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-800 to-violet-950 text-white flex items-center justify-center shadow-md border border-purple-500/40 group-hover:scale-105 transition-transform">
            <Server className="w-5 h-5" />
          </div>
        );
      case 'attacker':
        return (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-700 to-red-950 text-white flex items-center justify-center shadow-md border border-rose-500/50 animate-pulse group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
        );
      case 'host':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center shadow-md border border-emerald-500/40 group-hover:scale-105 transition-transform">
            <Monitor className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      id="topology-canvas-container"
      className="relative w-full h-[580px] bg-[#080c14] rounded-2xl border border-slate-800/90 overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-2xl"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Campus Layer Zones Guide */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Core Zone */}
        <div className="absolute left-[330px] top-[140px] w-[460px] h-[130px] rounded-2xl border border-blue-500/20 bg-blue-950/10 backdrop-blur-xs pointer-events-none">
          <div className="px-3 py-1.5 text-[10px] font-mono text-blue-400 font-bold tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            CORE LAYER • OSPF AREA 0 (40G REDUNDANT FABRIC)
          </div>
        </div>

        {/* Distribution Zone */}
        <div className="absolute left-[260px] top-[290px] w-[540px] h-[140px] rounded-2xl border border-indigo-500/20 bg-indigo-950/10 backdrop-blur-xs pointer-events-none">
          <div className="px-3 py-1.5 text-[10px] font-mono text-indigo-300 font-bold tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            DISTRIBUTION LAYER • HSRP REDUNDANCY & SVI INTER-VLAN ROUTING
          </div>
        </div>

        {/* Access Zone */}
        <div className="absolute left-[200px] top-[450px] w-[560px] h-[230px] rounded-2xl border border-slate-700/40 bg-slate-900/20 backdrop-blur-xs pointer-events-none">
          <div className="px-3 py-1.5 text-[10px] font-mono text-slate-300 font-bold tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ACCESS LAYER • 802.1Q VLANS, STP LOOP PREVENTION & PORT SECURITY
          </div>
        </div>

        {/* Data Center Zone */}
        <div className="absolute left-[20px] top-[60px] w-[270px] h-[430px] rounded-2xl border border-purple-500/20 bg-purple-950/10 backdrop-blur-xs pointer-events-none">
          <div className="px-3 py-1.5 text-[10px] font-mono text-purple-300 font-bold tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            DATA CENTER & INFRASTRUCTURE SERVICES (VLAN 100)
          </div>
        </div>

        {/* Branch Zone */}
        <div className="absolute left-[840px] top-[60px] w-[220px] h-[440px] rounded-2xl border border-pink-500/20 bg-pink-950/10 backdrop-blur-xs pointer-events-none">
          <div className="px-3 py-1.5 text-[10px] font-mono text-pink-300 font-bold tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
            BRANCH CAMPUS SITE (OSPF AREA 2)
          </div>
        </div>
      </div>

      {/* SVG Canvas for Links, Packets, & Ports */}
      <svg
        id="topology-svg"
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <linearGradient id="linkGradUp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Network Links */}
        {links.map((link) => {
          const srcNode = nodes.find((n) => n.id === link.sourceNodeId);
          const dstNode = nodes.find((n) => n.id === link.targetNodeId);

          if (!srcNode || !dstNode) return null;

          const isDown = link.status === 'down' || srcNode.status === 'down' || dstNode.status === 'down';
          const isStpBlocked = link.status === 'stp-blocked';
          const isHovered = hoveredLinkId === link.id;

          let strokeColor = '#38bdf8';
          let strokeDasharray = 'none';
          let strokeWidth = link.type === 'fiber-40g' ? 4 : link.type === 'fiber-10g' ? 3 : 2;

          if (isDown) {
            strokeColor = '#ef4444';
            strokeDasharray = '6,4';
          } else if (isStpBlocked) {
            strokeColor = '#f59e0b';
            strokeDasharray = '5,5';
            strokeWidth = 2;
          } else if (link.type === 'wan-serial') {
            strokeColor = '#ec4899';
            strokeDasharray = '8,4';
          }

          const midX = (srcNode.x + dstNode.x) / 2;
          const midY = (srcNode.y + dstNode.y) / 2;

          return (
            <g
              key={link.id}
              id={`svg-link-${link.id}`}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredLinkId(link.id)}
              onMouseLeave={() => setHoveredLinkId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLinkStatus(link.id);
              }}
            >
              {/* Invisible thicker stroke for easy clicking */}
              <line
                x1={srcNode.x}
                y1={srcNode.y}
                x2={dstNode.x}
                y2={dstNode.y}
                stroke="transparent"
                strokeWidth={18}
              />

              {/* Main Line */}
              <line
                x1={srcNode.x}
                y1={srcNode.y}
                x2={dstNode.x}
                y2={dstNode.y}
                stroke={strokeColor}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={strokeDasharray}
                opacity={isDown ? 0.6 : isStpBlocked ? 0.8 : 0.9}
                filter={!isDown && !isStpBlocked ? 'url(#glowEffect)' : undefined}
              />

              {/* STP Blocked Badge / Fault Cross Indicator */}
              {isStpBlocked && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <circle r={10} fill="#78350f" stroke="#f59e0b" strokeWidth={1.5} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fef3c7"
                    fontSize={8}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    BLK
                  </text>
                </g>
              )}

              {isDown && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <circle r={11} fill="#7f1d1d" stroke="#ef4444" strokeWidth={1.5} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fee2e2"
                    fontSize={11}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ✕
                  </text>
                </g>
              )}

              {/* Hover Tooltip Info */}
              {isHovered && (
                <g transform={`translate(${midX}, ${midY - 18})`}>
                  <rect
                    x={-75}
                    y={-14}
                    width={150}
                    height={24}
                    rx={6}
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth={1}
                    className="shadow-xl"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#e2e8f0"
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    {isDown ? '⚠️ LINK DOWN (Click to restore)' : isStpBlocked ? '🛡️ STP BLOCKED (Alt Port)' : `⚡ ${link.bandwidthMbps} Mbps | Click to Cut`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Animated Packets Moving Along Links */}
        {packets.map((pkt) => {
          if (pkt.pathNodeIds.length < 2) return null;
          const currNodeId = pkt.pathNodeIds[pkt.currentHopIndex];
          const nextNodeId = pkt.pathNodeIds[pkt.currentHopIndex + 1];
          const fromNode = nodes.find((n) => n.id === currNodeId);
          const toNode = nodes.find((n) => n.id === nextNodeId);

          if (!fromNode || !toNode) return null;

          const currentX = fromNode.x + (toNode.x - fromNode.x) * pkt.progress;
          const currentY = fromNode.y + (toNode.y - fromNode.y) * pkt.progress;

          const isDropped = pkt.status === 'dropped';
          const badgeColor = isDropped ? '#ef4444' : pkt.protocol === 'OSPF_HELLO' ? '#8b5cf6' : pkt.protocol === 'STP_BPDU' ? '#f59e0b' : pkt.protocol === 'HSRP_HELLO' ? '#06b6d4' : '#10b981';

          return (
            <g
              key={pkt.id}
              id={`pkt-${pkt.id}`}
              className="cursor-pointer animate-pulse"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPacketInspector(pkt);
              }}
            >
              <circle
                cx={currentX}
                cy={currentY}
                r={12}
                fill={badgeColor}
                opacity={0.3}
                className="animate-ping"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r={8}
                fill={badgeColor}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              {/* Protocol Label */}
              <text
                x={currentX}
                y={currentY - 14}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
                className="drop-shadow-md"
              >
                {pkt.protocol === 'ICMP_ECHO' ? 'ICMP PING' : pkt.protocol.replace('_', ' ')}
              </text>
            </g>
          );
        })}
      </svg>

      {/* HTML Overlay for Nodes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isDown = node.status === 'down';
          const isErrDisabled = node.status === 'err-disabled';

          return (
            <div
              key={node.id}
              id={`node-${node.id}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center group cursor-pointer transition-transform duration-150 ${
                isSelected ? 'scale-110 z-30' : 'z-10 hover:scale-105'
              }`}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.id);
              }}
            >
              {/* Device Icon + Status Glow */}
              <div className="relative">
                {renderDeviceIcon(node)}

                {/* Status LED Dot */}
                <div
                  className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                    isDown
                      ? 'bg-rose-500 animate-pulse'
                      : isErrDisabled
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  }`}
                />

                {/* HSRP Active Badge */}
                {node.hsrp && node.hsrp.some((h) => h.state === 'Active') && (
                  <span className="absolute -bottom-2 -left-3 bg-cyan-600/90 text-cyan-100 text-[8px] font-mono px-1.5 py-0.5 rounded border border-cyan-400 shadow">
                    HSRP ACT
                  </span>
                )}

                {/* STP Root Bridge Badge */}
                {node.stp?.isRootBridge && (
                  <span className="absolute -bottom-2 -right-3 bg-amber-600/90 text-amber-100 text-[8px] font-mono px-1.5 py-0.5 rounded border border-amber-400 shadow">
                    STP ROOT
                  </span>
                )}
              </div>

              {/* Node Name & IP Plate */}
              <div
                className={`mt-2 px-2.5 py-1 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-indigo-900/90 border-indigo-400 text-indigo-100 shadow-xl ring-2 ring-indigo-400/50'
                    : 'bg-slate-900/85 border-slate-700/80 text-slate-200 group-hover:border-slate-500'
                }`}
              >
                <div className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {node.hostname}
                </div>
                <div className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                  {node.managementIp || node.interfaces[0]?.ip || 'Unassigned'}
                </div>
              </div>

              {/* Quick CLI / Power Action Buttons on hover/selected */}
              {isSelected && (
                <div className="mt-1.5 flex items-center gap-1 bg-slate-950/90 px-2 py-0.5 rounded-full border border-slate-700 shadow-lg">
                  <button
                    id={`btn-cli-${node.id}`}
                    title="Open Cisco IOS Terminal"
                    className="p-1 text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCli(node.id);
                    }}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`btn-power-${node.id}`}
                    title={isDown ? 'Power ON Device' : 'Power OFF Device (Simulate Failure)'}
                    className={`p-1 rounded transition-colors ${
                      isDown ? 'text-rose-400 hover:text-emerald-400' : 'text-slate-400 hover:text-rose-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleNodeStatus(node.id);
                    }}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Zoom / Pan / Reset / Legend) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-xl">
        <button
          id="btn-zoom-in"
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-1" />
        <button
          id="btn-reset-view"
          onClick={resetView}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Reset Topology View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Layer Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 shadow-xl">
        <span className="flex items-center gap-1.5 text-indigo-400">
          <span className="w-2.5 h-1 bg-indigo-500 rounded"></span> Core Layer
        </span>
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2.5 h-1 bg-cyan-400 rounded"></span> Distribution
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2.5 h-1 bg-emerald-500 rounded"></span> Access
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> STP Blocked
        </span>
        <span className="flex items-center gap-1.5 text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Link Severed
        </span>
      </div>
    </div>
  );
};
