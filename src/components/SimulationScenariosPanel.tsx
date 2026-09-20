import React, { useState } from 'react';
import { SimulationScenario, NetworkNode, NetworkLink } from '../types/network';
import { Play, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Layers, Zap, Terminal } from 'lucide-react';

interface SimulationScenariosPanelProps {
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
  onSelectScenario: (scenarioId: string) => void;
  onRunScenarioSetup: (scenario: SimulationScenario) => void;
  onOpenCliForNode: (nodeId: string) => void;
}

export const SimulationScenariosPanel: React.FC<SimulationScenariosPanelProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onRunScenarioSetup,
  onOpenCliForNode,
}) => {
  const selectedScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  return (
    <div id="scenarios-panel-container" className="flex flex-col h-[520px] bg-[#020617] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Guided Simulation Labs & Verification Scenarios</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              6 Interactive Hands-On Network Engineering Testing Labs
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Scenario List, Right Active Guide */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left List */}
        <div className="w-full md:w-80 bg-[#080c14] border-r border-slate-800 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
          {scenarios.map((sc) => {
            const isSelected = sc.id === selectedScenario.id;
            return (
              <div
                key={sc.id}
                id={`scenario-card-${sc.id}`}
                onClick={() => onSelectScenario(sc.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-950/40'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                    {sc.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      sc.difficulty === 'Beginner'
                        ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40'
                        : sc.difficulty === 'Intermediate'
                        ? 'text-amber-300 bg-amber-950/80 border-amber-500/40'
                        : 'text-rose-300 bg-rose-950/80 border-rose-500/40'
                    }`}
                  >
                    {sc.difficulty}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">{sc.title}</h4>
              </div>
            );
          })}
        </div>

        {/* Right Active Lab Detail */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#040813] scrollbar-thin scrollbar-thumb-slate-800 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40 font-mono text-[10px] font-bold">
                {selectedScenario.category} LAB
              </span>
              <span className="text-slate-400 font-mono text-xs">Difficulty: {selectedScenario.difficulty}</span>
            </div>
            <h2 className="text-base font-bold text-white">{selectedScenario.title}</h2>
            <p className="text-slate-300 leading-relaxed">{selectedScenario.description}</p>
          </div>

          {/* Objective Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono">
              Learning & Simulation Objective:
            </span>
            <p className="text-slate-300 leading-relaxed">{selectedScenario.objective}</p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-200 font-mono">Interactive Walkthrough Steps:</span>
            <div className="space-y-2">
              {selectedScenario.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[#080c14] border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/60 text-purple-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-slate-300 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Outcome */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
            <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Expected Network Behavior:
            </span>
            <p className="text-emerald-200 leading-relaxed">{selectedScenario.expectedResult}</p>
          </div>

          {/* Action Launch Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id={`btn-launch-scenario-${selectedScenario.id}`}
              onClick={() => onRunScenarioSetup(selectedScenario)}
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-900/40 transition font-mono text-xs"
            >
              <Play className="w-4 h-4" /> Trigger Scenario Event in Topology
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
