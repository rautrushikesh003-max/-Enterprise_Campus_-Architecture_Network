import React, { useState } from 'react';
import { NetworkNode, VlanDefinition } from '../types/network';
import { FileCode, Download, Copy, Table, CheckCircle2 } from 'lucide-react';

interface NetworkAddressingSheetProps {
  nodes: NetworkNode[];
  vlans: VlanDefinition[];
}

export const NetworkAddressingSheet: React.FC<NetworkAddressingSheetProps> = ({ nodes, vlans }) => {
  const [activeTab, setActiveTab] = useState<'addressing' | 'configs'>('addressing');
  const [selectedConfigNodeId, setSelectedConfigNodeId] = useState<string>('core-sw-01');
  const [copied, setCopied] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedConfigNodeId) || nodes[0];

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(selectedNode.runningConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAllConfigs = () => {
    const combined = nodes
      .map((n) => `! =========================================\n! DEVICE: ${n.hostname} (${n.name})\n! =========================================\n${n.runningConfig}\n\n`)
      .join('\n');
    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Enterprise-Campus-Network-Configs.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="addressing-sheet-container" className="flex flex-col h-[520px] bg-[#020617] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-lg">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Campus IP Addressing Schema & Cisco Configs</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Hierarchical Subnetting Plan • Interface Matrix • Cisco IOS Running Configurations
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-[#080c14] p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('addressing')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'addressing' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> IP Addressing Plan
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'configs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> Cisco IOS .cfg Viewer
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 text-xs bg-[#040813]">
        {activeTab === 'addressing' && (
          <div className="space-y-6">
            {/* Subnets Table */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-2 font-mono">Campus VLAN Subnetting Plan</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">VLAN</th>
                      <th className="px-4 py-2.5">Subnet CIDR</th>
                      <th className="px-4 py-2.5">Usable Host Range</th>
                      <th className="px-4 py-2.5">Default Gateway (VIP)</th>
                      <th className="px-4 py-2.5">Broadcast</th>
                      <th className="px-4 py-2.5">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-[#080c14] text-slate-300">
                    {vlans.map((v) => {
                      const prefix = v.subnet.split('/')[0].replace(/\.0$/, '');
                      return (
                        <tr key={v.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="px-4 py-2.5 font-bold" style={{ color: v.color }}>
                            VLAN {v.id} ({v.name})
                          </td>
                          <td className="px-4 py-2.5 text-blue-400">{v.subnet}</td>
                          <td className="px-4 py-2.5 text-slate-400">
                            {prefix}.2 - {prefix}.254
                          </td>
                          <td className="px-4 py-2.5 text-emerald-400 font-bold">{v.gateway}</td>
                          <td className="px-4 py-2.5 text-slate-500">{prefix}.255</td>
                          <td className="px-4 py-2.5 text-slate-300">{v.department}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Point-to-Point Transit Subnets */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-2 font-mono">Point-to-Point Routed Backbone Subnets (/30)</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Link Description</th>
                      <th className="px-4 py-2.5">Subnet</th>
                      <th className="px-4 py-2.5">Side A Device & IP</th>
                      <th className="px-4 py-2.5">Side B Device & IP</th>
                      <th className="px-4 py-2.5">OSPF Area</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-[#080c14] text-slate-300">
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200">Core-01 ↔ Core-02 40G Interconnect</td>
                      <td className="px-4 py-2.5 text-blue-400">10.0.0.0/30</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-CORE-SW01 (10.0.0.1)</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-CORE-SW02 (10.0.0.2)</td>
                      <td className="px-4 py-2.5 text-indigo-400">Area 0</td>
                    </tr>
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200">Core-01 ↔ HQ-Edge-R1 Uplink</td>
                      <td className="px-4 py-2.5 text-blue-400">10.0.1.0/30</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-CORE-SW01 (10.0.1.1)</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-EDGE-R1 (10.0.1.2)</td>
                      <td className="px-4 py-2.5 text-indigo-400">Area 0</td>
                    </tr>
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200">Core-01 ↔ Dist-01 Downlink</td>
                      <td className="px-4 py-2.5 text-blue-400">10.0.2.0/30</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-CORE-SW01 (10.0.2.1)</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-DIST-SW01 (10.0.2.2)</td>
                      <td className="px-4 py-2.5 text-indigo-400">Area 0</td>
                    </tr>
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200">Core-01 ↔ Dist-02 Downlink</td>
                      <td className="px-4 py-2.5 text-blue-400">10.0.3.0/30</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-CORE-SW01 (10.0.3.1)</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-DIST-SW02 (10.0.3.2)</td>
                      <td className="px-4 py-2.5 text-indigo-400">Area 0</td>
                    </tr>
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200">HQ Edge ↔ Branch Router WAN Serial</td>
                      <td className="px-4 py-2.5 text-blue-400">198.51.100.0/30</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-EDGE-R1 (198.51.100.1)</td>
                      <td className="px-4 py-2.5 text-slate-300">BRANCH-WEST-R1 (198.51.100.2)</td>
                      <td className="px-4 py-2.5 text-pink-400">Area 2</td>
                    </tr>
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200">HQ Edge ↔ DC Core Fiber Link</td>
                      <td className="px-4 py-2.5 text-blue-400">10.254.0.0/30</td>
                      <td className="px-4 py-2.5 text-slate-300">HQ-EDGE-R1 (10.254.0.1)</td>
                      <td className="px-4 py-2.5 text-slate-300">DC-CORE-GW01 (10.254.0.2)</td>
                      <td className="px-4 py-2.5 text-indigo-400">Area 0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Cisco Running Configurations Tab */}
        {activeTab === 'configs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">Select Device:</span>
                <select
                  value={selectedConfigNodeId}
                  onChange={(e) => setSelectedConfigNodeId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 outline-none font-mono focus:ring-1 focus:ring-blue-400"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.hostname} ({n.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyConfig}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Config'}
                </button>
                <button
                  onClick={handleDownloadAllConfigs}
                  className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-900/30 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download All .cfg Files
                </button>
              </div>
            </div>

            {/* Config text viewer */}
            <div className="p-4 bg-[#080c14] rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-[350px]">
              {selectedNode.runningConfig}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
