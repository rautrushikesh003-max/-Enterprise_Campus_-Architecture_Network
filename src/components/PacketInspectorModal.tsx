import React from 'react';
import { ActivePacket, NetworkNode } from '../types/network';
import { ShieldCheck, ShieldAlert, X, Layers, ArrowRight, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

interface PacketInspectorModalProps {
  packet: ActivePacket | null;
  nodes: NetworkNode[];
  onClose: () => void;
}

export const PacketInspectorModal: React.FC<PacketInspectorModalProps> = ({ packet, nodes, onClose }) => {
  if (!packet) return null;

  const srcNode = nodes.find((n) => n.id === packet.sourceNodeId);
  const dstNode = nodes.find((n) => n.id === packet.targetNodeId);

  const isDropped = packet.status === 'dropped';

  return (
    <div
      id="packet-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#020617] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDropped ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isDropped ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                PDU Information — OSI 7-Layer Packet Details
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border ${
                    isDropped
                      ? 'bg-rose-900/60 text-rose-300 border-rose-500'
                      : 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
                  }`}
                >
                  {packet.status}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Protocol: {packet.protocol} • Src: {srcNode?.hostname || packet.sourceIp} → Dst: {dstNode?.hostname || packet.finalDestinationIp}
              </p>
            </div>
          </div>
          <button
            id="btn-close-packet-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800 bg-[#040813]">
          {/* Drop Alert if applicable */}
          {isDropped && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-200">Packet Intercepted & Dropped by Security Engine</h4>
                <p className="text-xs text-rose-300 font-mono mt-1">
                  Reason: {packet.dropReason || 'Security filter policy violation on access switch port.'}
                </p>
              </div>
            </div>
          )}

          {/* Hop Path Visualizer */}
          <div className="bg-[#080c14] p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-blue-400" /> Hop-by-Hop Transmission Route
            </h4>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {packet.pathNodeIds.map((nodeId, idx) => {
                const node = nodes.find((n) => n.id === nodeId);
                const isCurrent = idx === packet.currentHopIndex;
                return (
                  <React.Fragment key={nodeId}>
                    <div
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                        isCurrent
                          ? 'bg-blue-950 border-blue-400 text-blue-200 ring-2 ring-blue-400/40'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <span>{node?.hostname || nodeId}</span>
                    </div>
                    {idx < packet.pathNodeIds.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* OSI 7-Layer Stack Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 font-mono">OSI Layer Protocol Headers & Processing Decisions</h4>
            <div className="space-y-2.5">
              {packet.osiDetails.map((layer) => (
                <div
                  key={layer.layer}
                  className={`p-3.5 rounded-xl border transition-all ${
                    layer.status === 'rejected'
                      ? 'bg-rose-950/25 border-rose-500/40'
                      : 'bg-[#080c14] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                        Layer {layer.layer}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{layer.name}</span>
                    </div>
                    {layer.status === 'rejected' ? (
                      <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertOctagon className="w-3 h-3" /> DROPPED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> PROCESSED
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#040813] font-mono text-[11px] text-slate-300 border border-slate-800/80 break-all mb-1.5">
                    {layer.headerDetails}
                  </div>

                  <p className="text-xs text-slate-400 italic flex items-center gap-1.5">
                    <HelpCircle className="w-3 h-3 text-slate-500 shrink-0" />
                    {layer.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            id="btn-close-packet-footer"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700 font-mono"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
