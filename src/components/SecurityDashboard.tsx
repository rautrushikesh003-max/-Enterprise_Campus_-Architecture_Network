import React, { useState } from 'react';
import {
  NetworkNode,
  DhcpBinding,
  SecurityEventLog,
} from '../types/network';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Radio,
  FileText,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Sliders,
} from 'lucide-react';

interface SecurityDashboardProps {
  nodes: NetworkNode[];
  dhcpBindings: DhcpBinding[];
  securityLogs: SecurityEventLog[];
  onTriggerRogueDhcpAttack: () => void;
  onTriggerArpPoisonAttack: () => void;
  onTriggerPortSecurityViolation: (switchId: string, interfaceId: string) => void;
  onRecoverPort: (switchId: string, interfaceId: string) => void;
  onClearLogs: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  nodes,
  dhcpBindings,
  securityLogs,
  onTriggerRogueDhcpAttack,
  onTriggerArpPoisonAttack,
  onTriggerPortSecurityViolation,
  onRecoverPort,
  onClearLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'dhcp' | 'dai' | 'portsec' | 'logs'>('controls');
  const [logFilter, setLogFilter] = useState<string>('ALL');

  const filteredLogs =
    logFilter === 'ALL'
      ? securityLogs
      : securityLogs.filter((l) => l.type === logFilter || l.severity === logFilter.toLowerCase());

  // Aggregate stats
  const totalViolations = nodes.reduce((acc, n) => {
    return (
      acc +
      n.interfaces.reduce((sum, i) => sum + (i.portSecurity?.violationCount || 0), 0)
    );
  }, 0);

  const errDisabledPorts = nodes.flatMap((n) =>
    n.interfaces.filter((i) => i.status === 'err-disabled').map((i) => ({ node: n, iface: i }))
  );

  return (
    <div id="security-dashboard-container" className="flex flex-col h-[520px] bg-[#020617] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Layer 2 Security Controls & Attack Simulator</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              DHCP Snooping • Dynamic ARP Inspection (DAI) • Port Security Engine
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-3 py-1 rounded-lg bg-[#080c14] text-slate-300 border border-slate-800 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Active Bindings: <strong className="text-emerald-400">{dhcpBindings.length}</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-[#080c14] text-slate-300 border border-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Err-Disabled: <strong className={errDisabledPorts.length > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{errDisabledPorts.length}</strong>
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center px-4 bg-slate-950 border-b border-slate-800/80 gap-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('controls')}
          className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 font-mono font-semibold ${
            activeTab === 'controls' ? 'border-rose-500 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Attack Scenarios & Lab Controls
        </button>
        <button
          onClick={() => setActiveTab('dhcp')}
          className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 font-mono font-semibold ${
            activeTab === 'dhcp' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> DHCP Snooping Binding Table
        </button>
        <button
          onClick={() => setActiveTab('portsec')}
          className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 font-mono font-semibold ${
            activeTab === 'portsec' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> Port Security Audit
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 font-mono font-semibold ${
            activeTab === 'logs' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Security Syslog Stream ({securityLogs.length})
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 text-xs bg-[#040813]">
        {/* TAB 1: ATTACK CONTROLS */}
        {activeTab === 'controls' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rogue DHCP Attack Card */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                      <Radio className="w-4 h-4" /> Rogue DHCP Server
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      Untrusted Port
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">
                    Broadcasts a malicious DHCP Offer from Kali (IP 10.10.20.99). Tests DHCP Snooping dropping untrusted DHCP server packets.
                  </p>
                </div>
                <button
                  id="btn-trigger-rogue-dhcp"
                  onClick={onTriggerRogueDhcpAttack}
                  className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition"
                >
                  <Play className="w-3.5 h-3.5" /> Launch Rogue DHCP Attack
                </button>
              </div>

              {/* ARP Spoofing / DAI Card */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                      <ShieldAlert className="w-4 h-4" /> ARP Poisoning / MITM
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      DAI Inspection
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">
                    Sends gratuitous spoofed ARP reply claiming HSRP Gateway IP (10.10.20.1) has attacker MAC. Tests DAI database validation.
                  </p>
                </div>
                <button
                  id="btn-trigger-arp-poison"
                  onClick={onTriggerArpPoisonAttack}
                  className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition"
                >
                  <Play className="w-3.5 h-3.5" /> Broadcast Spoofed ARP
                </button>
              </div>

              {/* Port Security Violation Card */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                      <Lock className="w-4 h-4" /> Port Security Violation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      Acc-SW-Eng Gi0/1
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">
                    Plugs rogue laptop with foreign MAC address into port Gi0/1 (Sticky MAC max 1). Triggers instant <strong className="text-rose-400">err-disabled</strong> state.
                  </p>
                </div>
                <button
                  id="btn-trigger-port-sec-violation"
                  onClick={() => onTriggerPortSecurityViolation('acc-sw-eng', 'g0/1')}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition"
                >
                  <Play className="w-3.5 h-3.5" /> Simulate Rogue Device Plug-In
                </button>
              </div>
            </div>

            {/* Err-Disabled Ports Active Recovery Section */}
            {errDisabledPorts.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Err-Disabled Interfaces Requiring Administrative Recovery
                  </span>
                </div>
                <div className="space-y-2">
                  {errDisabledPorts.map(({ node, iface }) => (
                    <div
                      key={`${node.id}-${iface.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#080c14] border border-rose-500/30 text-xs font-mono"
                    >
                      <div>
                        <strong className="text-white">{node.hostname}</strong> — Interface: <span className="text-rose-400">{iface.name}</span> (Violation Mode: shutdown)
                      </div>
                      <button
                        id={`btn-recover-${node.id}-${iface.id}`}
                        onClick={() => onRecoverPort(node.id, iface.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-sans font-semibold flex items-center gap-1 transition shadow-sm"
                      >
                        <RotateCcw className="w-3 h-3" /> Recover (shut/no-shut)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DHCP SNOOPING BINDING TABLE */}
        {activeTab === 'dhcp' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 font-mono">
                DHCP Snooping Dynamic Binding Database (Cisco Catalyst 2960 Series)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Database Synchronized with SIEM
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">MAC Address</th>
                    <th className="px-4 py-2.5">IP Address</th>
                    <th className="px-4 py-2.5">Lease (sec)</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">VLAN</th>
                    <th className="px-4 py-2.5">Interface</th>
                    <th className="px-4 py-2.5">Binding Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#080c14] text-slate-300">
                  {dhcpBindings.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 text-blue-400 font-semibold">{b.mac}</td>
                      <td className="px-4 py-2.5 text-emerald-400">{b.ip}</td>
                      <td className="px-4 py-2.5">{b.leaseTimeSec}</td>
                      <td className="px-4 py-2.5 text-slate-400">{b.type}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                          VLAN {b.vlan}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">{b.interface}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-[10px]">{b.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PORT SECURITY AUDIT */}
        {activeTab === 'portsec' && (
          <div className="space-y-4">
            <span className="text-xs font-semibold text-slate-300 font-mono">
              Access Switches Port Security Configuration & Sticky MAC Table
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nodes
                .filter((n) => n.interfaces.some((i) => i.portSecurity && i.portSecurity.enabled))
                .map((sw) => (
                  <div key={sw.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <strong className="text-blue-400 font-mono">{sw.hostname}</strong>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {sw.managementIp}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {sw.interfaces
                        .filter((i) => i.portSecurity && i.portSecurity.enabled)
                        .map((iface) => {
                          const ps = iface.portSecurity!;
                          const isErr = iface.status === 'err-disabled';
                          return (
                            <div
                              key={iface.id}
                              className={`p-3 rounded-lg border font-mono text-xs ${
                                isErr ? 'bg-rose-950/30 border-rose-500/50' : 'bg-[#080c14] border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white">{iface.name}</span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold border ${
                                    isErr ? 'bg-rose-900/80 text-rose-300 border-rose-500' : 'bg-emerald-900/80 text-emerald-300 border-emerald-500'
                                  }`}
                                >
                                  {iface.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 space-y-0.5">
                                <div>Max MAC: <strong className="text-slate-200">{ps.maxMac}</strong> | Violation: <strong className="text-amber-300">{ps.violation}</strong></div>
                                <div>Learned MACs: <span className="text-blue-300">{ps.learnedMacs.join(', ') || 'None (learning)'}</span></div>
                                <div>Violation Count: <strong className={ps.violationCount > 0 ? 'text-rose-400' : 'text-slate-400'}>{ps.violationCount}</strong></div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY SYSLOG STREAM */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Live Security Syslog Stream</span>
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1 outline-none font-mono"
                >
                  <option value="ALL">All Categories</option>
                  <option value="PORT_SECURITY">Port Security</option>
                  <option value="DHCP_SNOOPING">DHCP Snooping</option>
                  <option value="DAI">Dynamic ARP (DAI)</option>
                  <option value="HSRP">HSRP</option>
                  <option value="OSPF">OSPF</option>
                  <option value="STP">Spanning Tree</option>
                </select>
              </div>
              <button
                onClick={onClearLogs}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Syslog
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No security events recorded. All systems operational.</div>
              ) : (
                filteredLogs.map((log) => {
                  const isCrit = log.severity === 'critical';
                  const isWarn = log.severity === 'warning';
                  const isSucc = log.severity === 'success';

                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                        isCrit
                          ? 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                          : isWarn
                          ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                          : isSucc
                          ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                          : 'bg-[#080c14] border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{log.timestamp}</span>
                      <div className="flex-1">
                        <div className="font-bold flex items-center gap-2">
                          <span>{log.deviceName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {log.title}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5">{log.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
