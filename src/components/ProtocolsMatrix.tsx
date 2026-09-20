import React, { useState } from 'react';
import {
  NetworkNode,
  NetworkLink,
  VlanDefinition,
} from '../types/network';
import {
  Activity,
  Layers,
  Sliders,
  Network,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
} from 'lucide-react';

interface ProtocolsMatrixProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  vlans: VlanDefinition[];
  onSelectNode: (nodeId: string) => void;
}

export const ProtocolsMatrix: React.FC<ProtocolsMatrixProps> = ({
  nodes,
  links,
  vlans,
  onSelectNode,
}) => {
  const [activeTab, setActiveTab] = useState<'ospf' | 'stp' | 'hsrp' | 'vlans'>('ospf');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string>('ALL');

  return (
    <div id="protocols-matrix-container" className="flex flex-col h-[520px] bg-[#020617] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
      {/* Top Protocol Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Enterprise Network Protocol Telemetry</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live OSPF Adjacencies • STP Port Roles • HSRP Gateways • 802.1Q VLANs
            </p>
          </div>
        </div>

        {/* Protocol Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#080c14] p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('ospf')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'ospf' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> OSPF Routing
          </button>
          <button
            onClick={() => setActiveTab('stp')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'stp' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> STP Spanning Tree
          </button>
          <button
            onClick={() => setActiveTab('hsrp')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'hsrp' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> HSRP Gateways
          </button>
          <button
            onClick={() => setActiveTab('vlans')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'vlans' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> VLAN Scheme
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 text-xs bg-[#040813]">
        {/* ================= OSPF TAB ================= */}
        {activeTab === 'ospf' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <span className="text-slate-400 font-mono text-[11px]">OSPF Area 0 (Backbone)</span>
                <div className="text-base font-bold text-indigo-400 mt-1">HQ Core & Edge Mesh</div>
                <div className="text-[11px] text-slate-400 mt-0.5">High-speed 40G/10G redundant fabric</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <span className="text-slate-400 font-mono text-[11px]">OSPF Area 1 (HQ Subnets)</span>
                <div className="text-base font-bold text-cyan-400 mt-1">VLAN 10, 20, 30 SVIs</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Inter-VLAN distribution routing</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <span className="text-slate-400 font-mono text-[11px]">OSPF Area 2 (Branch Site)</span>
                <div className="text-base font-bold text-pink-400 mt-1">WAN Serial Tunnel</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Inter-area LSA Type 3 summaries</div>
              </div>
            </div>

            {/* OSPF Neighbor Table */}
            <div className="space-y-2.5">
              <span className="font-semibold text-slate-200 font-mono">Active OSPF Neighbor Adjacency Matrix</span>
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Local Router</th>
                      <th className="px-4 py-2.5">Neighbor ID</th>
                      <th className="px-4 py-2.5">Neighbor Device</th>
                      <th className="px-4 py-2.5">IP Address</th>
                      <th className="px-4 py-2.5">Interface</th>
                      <th className="px-4 py-2.5">State</th>
                      <th className="px-4 py-2.5">Area</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-[#080c14] text-slate-300">
                    {nodes
                      .filter((n) => n.ospf && n.ospf.enabled)
                      .flatMap((n) =>
                        n.ospf!.neighbors.map((nbr, idx) => {
                          const isDown = nbr.state === 'DOWN';
                          return (
                            <tr
                              key={`${n.id}-${idx}`}
                              className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                              onClick={() => onSelectNode(n.id)}
                            >
                              <td className="px-4 py-2.5 font-bold text-indigo-400">{n.hostname}</td>
                              <td className="px-4 py-2.5 text-blue-400">{nbr.neighborId}</td>
                              <td className="px-4 py-2.5 text-slate-300">{nbr.deviceId}</td>
                              <td className="px-4 py-2.5 text-slate-400">{nbr.ip}</td>
                              <td className="px-4 py-2.5 text-slate-400">{nbr.interface}</td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    isDown
                                      ? 'bg-rose-900/60 text-rose-300 border-rose-500'
                                      : 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
                                  }`}
                                >
                                  {nbr.state}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-400">Area {nbr.area}</td>
                            </tr>
                          );
                        })
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= STP TAB ================= */}
        {activeTab === 'stp' && (
          <div className="space-y-4">
            <span className="font-semibold text-slate-200 font-mono">
              Rapid Spanning Tree Protocol (IEEE 802.1w / PVST+) Port State & Role Matrix
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nodes
                .filter((n) => n.stp && n.stp.enabled)
                .map((sw) => (
                  <div key={sw.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <strong className="text-amber-400 font-mono">{sw.hostname}</strong>
                        <div className="text-[10px] font-mono text-slate-400">
                          Priority: {sw.stp?.priority} • Root Cost: {sw.stp?.rootCost}
                        </div>
                      </div>
                      {sw.stp?.isRootBridge ? (
                        <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                          👑 ROOT BRIDGE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Non-Root Bridge</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {sw.interfaces.map((iface) => {
                        const isBlocked = iface.stpState === 'Blocking';
                        return (
                          <div
                            key={iface.id}
                            className={`p-2.5 rounded-lg border font-mono text-xs flex items-center justify-between ${
                              isBlocked ? 'bg-amber-950/30 border-amber-500/50' : 'bg-[#080c14] border-slate-800'
                            }`}
                          >
                            <div>
                              <strong className="text-white">{iface.name}</strong>
                              <span className="text-slate-400 ml-2">Role: <strong className="text-blue-300">{iface.stpRole || 'Designated'}</strong></span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isBlocked ? 'bg-amber-900/80 text-amber-200 border-amber-500' : 'bg-emerald-900/80 text-emerald-200 border-emerald-500'
                              }`}
                            >
                              {iface.stpState || 'Forwarding'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= HSRP TAB ================= */}
        {activeTab === 'hsrp' && (
          <div className="space-y-4">
            <span className="font-semibold text-slate-200 font-mono">
              Hot Standby Router Protocol (HSRP) Default Gateway Redundancy Status
            </span>

            <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Switch Device</th>
                    <th className="px-4 py-2.5">VLAN Interface</th>
                    <th className="px-4 py-2.5">HSRP Group</th>
                    <th className="px-4 py-2.5">Virtual Gateway IP</th>
                    <th className="px-4 py-2.5">Virtual MAC</th>
                    <th className="px-4 py-2.5">Priority</th>
                    <th className="px-4 py-2.5">Preempt</th>
                    <th className="px-4 py-2.5">Role State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#080c14] text-slate-300">
                  {nodes
                    .filter((n) => n.hsrp && n.hsrp.length > 0)
                    .flatMap((n) =>
                      n.hsrp!.map((h, idx) => {
                        const isActive = h.state === 'Active';
                        return (
                          <tr key={`${n.id}-${idx}`} className="hover:bg-slate-900/60 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-cyan-400">{n.hostname}</td>
                            <td className="px-4 py-2.5 text-white">Vlan{h.vlanId}</td>
                            <td className="px-4 py-2.5 text-slate-400">{h.group}</td>
                            <td className="px-4 py-2.5 text-emerald-400 font-bold">{h.virtualIp}</td>
                            <td className="px-4 py-2.5 text-slate-400">{h.virtualMac}</td>
                            <td className="px-4 py-2.5 text-white font-bold">{h.priority}</td>
                            <td className="px-4 py-2.5 text-blue-400">{h.preempt ? 'Enabled' : 'Disabled'}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                                  isActive
                                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {h.state}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= VLANS TAB ================= */}
        {activeTab === 'vlans' && (
          <div className="space-y-4">
            <span className="font-semibold text-slate-200 font-mono">
              Enterprise 802.1Q VLAN Allocation & IP Subnet Scheme
            </span>

            <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">VLAN ID</th>
                    <th className="px-4 py-2.5">VLAN Name</th>
                    <th className="px-4 py-2.5">Subnet CIDR</th>
                    <th className="px-4 py-2.5">Default Gateway</th>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#080c14] text-slate-300">
                  {vlans.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 font-bold" style={{ color: v.color }}>
                        VLAN {v.id}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-white">{v.name}</td>
                      <td className="px-4 py-2.5 text-blue-400">{v.subnet}</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-bold">{v.gateway}</td>
                      <td className="px-4 py-2.5 text-slate-300">{v.department}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px]">{v.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
