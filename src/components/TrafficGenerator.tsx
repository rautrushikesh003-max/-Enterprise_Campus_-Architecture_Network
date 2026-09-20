import React, { useState } from 'react';
import { NetworkNode, PacketProtocol } from '../types/network';
import { Send, FastForward, Play, Activity, Radio, Layers, Sliders, RefreshCw } from 'lucide-react';

interface TrafficGeneratorProps {
  nodes: NetworkNode[];
  onSendPacket: (
    sourceNodeId: string,
    targetNodeId: string,
    protocol: PacketProtocol,
    finalDstIp: string
  ) => void;
  onClearPackets: () => void;
  activePacketCount: number;
}

export const TrafficGenerator: React.FC<TrafficGeneratorProps> = ({
  nodes,
  onSendPacket,
  onClearPackets,
  activePacketCount,
}) => {
  const [sourceId, setSourceId] = useState<string>('pc-eng-01');
  const [targetId, setTargetId] = useState<string>('srv-webapp');
  const [protocol, setProtocol] = useState<PacketProtocol>('ICMP_ECHO');

  const handleSend = () => {
    const dstNode = nodes.find((n) => n.id === targetId);
    const targetIp = dstNode?.managementIp || dstNode?.interfaces[0]?.ip || '10.100.100.10';
    onSendPacket(sourceId, targetId, protocol, targetIp);
  };

  return (
    <div id="traffic-generator-container" className="p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/90 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs">
      {/* Source & Destination Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono font-medium">Source:</span>
          <select
            id="traffic-src-select"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="bg-[#020617] border border-slate-700/80 text-slate-200 rounded-lg px-3 py-1.5 outline-none font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.hostname} ({n.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono font-medium">Destination:</span>
          <select
            id="traffic-dst-select"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="bg-[#020617] border border-slate-700/80 text-slate-200 rounded-lg px-3 py-1.5 outline-none font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.hostname} ({n.managementIp || n.interfaces[0]?.ip || 'Host'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono font-medium">Protocol:</span>
          <select
            id="traffic-proto-select"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as PacketProtocol)}
            className="bg-[#020617] border border-slate-700/80 text-slate-200 rounded-lg px-3 py-1.5 outline-none font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          >
            <option value="ICMP_ECHO">ICMP Ping (Echo Request)</option>
            <option value="OSPF_HELLO">OSPF Hello (224.0.0.5)</option>
            <option value="STP_BPDU">STP BPDU (802.1D)</option>
            <option value="HSRP_HELLO">HSRP Heartbeat (UDP 1985)</option>
            <option value="DHCP_DISCOVER">DHCP Discover (Broadcast)</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          id="btn-send-custom-packet"
          onClick={handleSend}
          className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition active:scale-[0.98]"
        >
          <Send className="w-3.5 h-3.5" /> Transmit Packet
        </button>

        {activePacketCount > 0 && (
          <button
            id="btn-clear-traffic"
            onClick={onClearPackets}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700 rounded-xl transition"
            title="Clear In-Flight Packets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
