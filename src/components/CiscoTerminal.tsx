import React, { useState, useRef, useEffect } from 'react';
import { NetworkNode, NetworkLink, DhcpBinding } from '../types/network';
import { CiscoCliEngine, CliSessionState } from '../services/ciscoCliEngine';
import { Terminal, Copy, Trash2, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

interface CiscoTerminalProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  dhcpBindings: DhcpBinding[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onUpdateNode: (updatedNode: NetworkNode) => void;
  onTriggerPingAnimation: (srcId: string, dstId: string, dstIp: string) => void;
}

export const CiscoTerminal: React.FC<CiscoTerminalProps> = ({
  nodes,
  links,
  dhcpBindings,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onTriggerPingAnimation,
}) => {
  const [sessions, setSessions] = useState<Record<string, CliSessionState>>({});
  const [terminalLogs, setTerminalLogs] = useState<Record<string, string[]>>({});
  const [inputVal, setInputVal] = useState('');
  const [theme, setTheme] = useState<'amber' | 'green' | 'white'>('green');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Initialize session for current node if not present
  useEffect(() => {
    if (!sessions[currentNode.id]) {
      setSessions((prev) => ({
        ...prev,
        [currentNode.id]: {
          mode: 'privileged',
          history: [],
          historyIndex: 0,
        },
      }));
      setTerminalLogs((prev) => ({
        ...prev,
        [currentNode.id]: [
          `Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)`,
          `Technical Support: http://www.cisco.com/techsupport`,
          `Compiled Wed 22-Aug-26 18:30 by prod_rel_team`,
          ``,
          `${currentNode.hostname}# (Ready for input. Type '?' or select quick commands below.)`,
        ],
      }));
    }
  }, [currentNode.id, sessions, currentNode.hostname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs, selectedNodeId]);

  const currentSession: CliSessionState = sessions[currentNode.id] || {
    mode: 'privileged',
    history: [],
    historyIndex: 0,
  };

  const currentLog = terminalLogs[currentNode.id] || [];

  const handleCommandSubmit = (commandToRun?: string) => {
    const rawCmd = commandToRun !== undefined ? commandToRun : inputVal;
    if (!rawCmd.trim()) return;

    const prompt = CiscoCliEngine.getPrompt(currentNode, currentSession);
    const { output, newSession, updatedNode, pingAnimation } = CiscoCliEngine.executeCommand(
      rawCmd,
      currentNode,
      currentSession,
      nodes,
      links,
      dhcpBindings
    );

    setSessions((prev) => ({ ...prev, [currentNode.id]: newSession }));
    setTerminalLogs((prev) => ({
      ...prev,
      [currentNode.id]: [...(prev[currentNode.id] || []), `${prompt} ${rawCmd}`, ...output],
    }));

    if (updatedNode) {
      onUpdateNode(updatedNode);
    }

    if (pingAnimation && pingAnimation.targetNodeId) {
      onTriggerPingAnimation(currentNode.id, pingAnimation.targetNodeId, pingAnimation.targetIp);
    }

    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentSession.history.length > 0 && currentSession.historyIndex > 0) {
        const nextIdx = currentSession.historyIndex - 1;
        setSessions((prev) => ({
          ...prev,
          [currentNode.id]: { ...currentSession, historyIndex: nextIdx },
        }));
        setInputVal(currentSession.history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentSession.historyIndex < currentSession.history.length - 1) {
        const nextIdx = currentSession.historyIndex + 1;
        setSessions((prev) => ({
          ...prev,
          [currentNode.id]: { ...currentSession, historyIndex: nextIdx },
        }));
        setInputVal(currentSession.history[nextIdx] || '');
      } else {
        setInputVal('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab autocomplete
      const commands = [
        'show ip route',
        'show ip ospf neighbor',
        'show ip interface brief',
        'show spanning-tree',
        'show standby brief',
        'show ip dhcp snooping binding',
        'show ip arp inspection',
        'show port-security',
        'show running-config',
        'configure terminal',
        'ping 10.100.100.10',
      ];
      const match = commands.find((c) => c.startsWith(inputVal.toLowerCase()));
      if (match) {
        setInputVal(match);
      }
    }
  };

  const clearLog = () => {
    setTerminalLogs((prev) => ({
      ...prev,
      [currentNode.id]: [`${CiscoCliEngine.getPrompt(currentNode, currentSession)} `],
    }));
  };

  const copyLog = () => {
    navigator.clipboard.writeText(currentLog.join('\n'));
  };

  const quickCommands = [
    'show ip route',
    'show ip ospf neighbor',
    'show spanning-tree',
    'show standby brief',
    'show ip dhcp snooping binding',
    'show ip arp inspection',
    'show port-security interface Gi0/1',
    'ping 10.100.100.10',
    'show running-config',
  ];

  const themeClasses =
    theme === 'green'
      ? 'text-emerald-400 font-mono'
      : theme === 'amber'
      ? 'text-amber-400 font-mono'
      : 'text-slate-100 font-mono';

  return (
    <div id="cisco-terminal-container" className="flex flex-col h-[520px] bg-[#020617] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="text-xs font-mono font-semibold text-slate-200 ml-1.5 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            Cisco IOS Console CLI — <span className="text-blue-400 font-bold">{currentNode.hostname}</span>
          </span>
        </div>

        {/* Device Switcher & Theme Selector */}
        <div className="flex items-center gap-2">
          <select
            id="terminal-device-select"
            value={selectedNodeId}
            onChange={(e) => onSelectNode(e.target.value)}
            className="bg-[#020617] border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.hostname} ({n.type.toUpperCase()})
              </option>
            ))}
          </select>

          <div className="flex items-center bg-[#020617] rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setTheme('green')}
              className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${theme === 'green' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              GRN
            </button>
            <button
              onClick={() => setTheme('amber')}
              className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${theme === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              AMB
            </button>
            <button
              onClick={() => setTheme('white')}
              className={`px-2 py-0.5 text-[10px] rounded font-mono transition-colors ${theme === 'white' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              WHT
            </button>
          </div>

          <button
            id="btn-copy-terminal"
            onClick={copyLog}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Copy Terminal Logs"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-clear-terminal"
            onClick={clearLog}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Clear Screen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Suggested Commands Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto text-[11px] font-mono scrollbar-thin">
        <span className="text-slate-400 flex items-center gap-1 whitespace-nowrap text-[10px]">
          <Sparkles className="w-3 h-3 text-blue-400" /> Quick Cmds:
        </span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            id={`btn-quick-${cmd.replace(/\s+/g, '-')}`}
            onClick={() => handleCommandSubmit(cmd)}
            className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/40 text-slate-300 border border-slate-700/60 whitespace-nowrap transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Screen Body */}
      <div
        id="terminal-output-screen"
        className={`flex-1 p-4 overflow-y-auto ${themeClasses} text-xs leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 bg-[#040813]`}
        onClick={() => inputRef.current?.focus()}
      >
        {currentLog.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap break-all font-mono">
            {line}
          </div>
        ))}

        {/* Active Input Line */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="font-bold opacity-90 select-none">
            {CiscoCliEngine.getPrompt(currentNode, currentSession)}
          </span>
          <input
            ref={inputRef}
            id="terminal-active-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono p-0 focus:ring-0"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>Press [Tab] for Autocomplete • [↑/↓] for Command History</span>
        <span>Device Node ID: <strong className="text-slate-300">{currentNode.id}</strong></span>
      </div>
    </div>
  );
};
