import React, { useState, useEffect, useRef } from 'react';
import {
  NetworkNode,
  NetworkLink,
  VlanDefinition,
  ActivePacket,
  PacketProtocol,
  SecurityEventLog,
  DhcpBinding,
  SimulationScenario,
} from './types/network';
import {
  INITIAL_NODES,
  INITIAL_LINKS,
  INITIAL_VLANS,
  INITIAL_DHCP_BINDINGS,
  SCENARIOS,
} from './data/initialTopology';
import { NetworkEngine } from './services/networkEngine';
import { TopologyCanvas } from './components/TopologyCanvas';
import { CiscoTerminal } from './components/CiscoTerminal';
import { SecurityDashboard } from './components/SecurityDashboard';
import { ProtocolsMatrix } from './components/ProtocolsMatrix';
import { SimulationScenariosPanel } from './components/SimulationScenariosPanel';
import { TrafficGenerator } from './components/TrafficGenerator';
import { NetworkAddressingSheet } from './components/NetworkAddressingSheet';
import { PacketInspectorModal } from './components/PacketInspectorModal';
import {
  Activity,
  Terminal,
  ShieldCheck,
  Network,
  BookOpen,
  Table,
  RotateCcw,
  Sliders,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function App() {
  const [nodes, setNodes] = useState<NetworkNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<NetworkLink[]>(INITIAL_LINKS);
  const [vlans] = useState<VlanDefinition[]>(INITIAL_VLANS);
  const [dhcpBindings, setDhcpBindings] = useState<DhcpBinding[]>(INITIAL_DHCP_BINDINGS);
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>([
    {
      id: 'init-1',
      timestamp: '22:30:00',
      deviceId: 'core-sw-01',
      deviceName: 'HQ-CORE-SW01',
      type: 'OSPF',
      severity: 'success',
      title: '%OSPF-5-ADJCHANGE',
      message: 'All OSPF Area 0 neighbor adjacencies reached FULL state. Network converged.',
    },
    {
      id: 'init-2',
      timestamp: '22:30:02',
      deviceId: 'dist-sw-01',
      deviceName: 'HQ-DIST-SW01',
      type: 'HSRP',
      severity: 'info',
      title: '%HSRP-5-STATECHANGE',
      message: 'HSRP Group 20 state Standby -> Active. Virtual IP 10.10.20.1 assigned.',
    },
    {
      id: 'init-3',
      timestamp: '22:30:04',
      deviceId: 'acc-sw-eng',
      deviceName: 'HQ-ACC-SW-ENG',
      type: 'DHCP_SNOOPING',
      severity: 'info',
      title: '%DHCP_SNOOPING-6-ENABLED',
      message: 'DHCP Snooping & Dynamic ARP Inspection active on VLAN 20. Trusted uplinks Gi0/23, Gi0/24.',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'cli' | 'security' | 'protocols' | 'labs' | 'configs'>('cli');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('acc-sw-eng');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sc-ospf-failover');
  const [activePackets, setActivePackets] = useState<ActivePacket[]>([]);
  const [inspectingPacket, setInspectingPacket] = useState<ActivePacket | null>(null);

  // Packet animation loop (60 FPS)
  useEffect(() => {
    if (activePackets.length === 0) return;

    const interval = setInterval(() => {
      setActivePackets((prevPackets) =>
        prevPackets
          .map((pkt) => {
            if (pkt.status === 'delivered' || pkt.status === 'dropped') {
              // Expire old delivered/dropped packets after 4 seconds
              if (Date.now() - pkt.timestamp > 4500) {
                return null;
              }
              return pkt;
            }

            const newProgress = pkt.progress + pkt.speed;

            if (newProgress >= 1) {
              // Hop reached
              const nextHopIndex = pkt.currentHopIndex + 1;
              if (nextHopIndex >= pkt.pathNodeIds.length - 1) {
                // Reached final destination!
                return {
                  ...pkt,
                  progress: 1,
                  currentHopIndex: nextHopIndex,
                  status: 'delivered',
                };
              } else {
                return {
                  ...pkt,
                  progress: 0,
                  currentHopIndex: nextHopIndex,
                };
              }
            }

            return {
              ...pkt,
              progress: newProgress,
            };
          })
          .filter((p): p is ActivePacket => p !== null)
      );
    }, 35);

    return () => clearInterval(interval);
  }, [activePackets.length]);

  // Handle Link Toggle (Simulate Physical Cut / Fiber Sever)
  const handleToggleLinkStatus = (linkId: string) => {
    setLinks((prevLinks) => {
      const updatedLinks = prevLinks.map((l) => {
        if (l.id === linkId) {
          const nextStatus = l.status === 'up' ? 'down' : 'up';
          return { ...l, status: nextStatus };
        }
        return l;
      });

      // Recalculate STP, HSRP, and OSPF
      const stpResult = NetworkEngine.recalculateStp(nodes, updatedLinks);
      const hsrpResult = NetworkEngine.recalculateHsrp(stpResult.updatedNodes);
      const ospfResult = NetworkEngine.recalculateOspf(hsrpResult.updatedNodes, stpResult.updatedLinks);

      setNodes(ospfResult.updatedNodes);

      const allNewLogs = [...stpResult.logs, ...hsrpResult.logs, ...ospfResult.logs];
      if (allNewLogs.length > 0) {
        setSecurityLogs((prev) => [...allNewLogs, ...prev]);
      }

      return stpResult.updatedLinks;
    });
  };

  // Handle Node Power Status Toggle (Simulate Device Crash / Shutdown)
  const handleToggleNodeStatus = (nodeId: string) => {
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((n) => {
        if (n.id === nodeId) {
          const nextStatus = n.status === 'up' ? 'down' : 'up';
          return { ...n, status: nextStatus };
        }
        return n;
      });

      const stpResult = NetworkEngine.recalculateStp(updatedNodes, links);
      const hsrpResult = NetworkEngine.recalculateHsrp(stpResult.updatedNodes);
      const ospfResult = NetworkEngine.recalculateOspf(hsrpResult.updatedNodes, stpResult.updatedLinks);

      setLinks(stpResult.updatedLinks);

      const allNewLogs = [...stpResult.logs, ...hsrpResult.logs, ...ospfResult.logs];
      if (allNewLogs.length > 0) {
        setSecurityLogs((prev) => [...allNewLogs, ...prev]);
      }

      return ospfResult.updatedNodes;
    });
  };

  // Transmit animated packet
  const handleSendPacket = (
    sourceNodeId: string,
    targetNodeId: string,
    protocol: PacketProtocol,
    finalDstIp: string
  ) => {
    const srcNode = nodes.find((n) => n.id === sourceNodeId);
    const dstNode = nodes.find((n) => n.id === targetNodeId);

    if (!srcNode || !dstNode) return;

    const pathCalc = NetworkEngine.computePacketPath(sourceNodeId, targetNodeId, nodes, links);
    const osiDetails = NetworkEngine.generateOsiDetails(protocol, srcNode, dstNode, finalDstIp);

    const newPacket: ActivePacket = {
      id: `pkt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      protocol,
      sourceNodeId,
      targetNodeId,
      finalDestinationIp: finalDstIp,
      sourceIp: srcNode.managementIp || srcNode.interfaces[0]?.ip || '10.10.20.15',
      currentHopIndex: 0,
      pathNodeIds: pathCalc.pathNodes,
      pathLinkIds: pathCalc.pathLinks,
      progress: 0,
      speed: 0.05,
      status: pathCalc.feasible ? 'in-transit' : 'dropped',
      dropReason: pathCalc.dropReason,
      droppedAtNodeId: pathCalc.droppedAtNodeId,
      osiDetails,
      timestamp: Date.now(),
      payloadDescription: `${protocol} probe from ${srcNode.hostname} to ${dstNode.hostname}`,
    };

    setActivePackets((prev) => [...prev, newPacket]);

    // Log packet event
    if (!pathCalc.feasible) {
      setSecurityLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          deviceId: sourceNodeId,
          deviceName: srcNode.hostname,
          type: 'TRAFFIC',
          severity: 'warning',
          title: '%TRAFFIC-4-DROP',
          message: `Packet ${protocol} from ${srcNode.hostname} to ${dstNode.hostname} dropped: ${pathCalc.dropReason}`,
        },
        ...prev,
      ]);
    }
  };

  // Launch Rogue DHCP Attack
  const handleTriggerRogueDhcpAttack = () => {
    const kali = nodes.find((n) => n.id === 'attacker-kali');
    const accEng = nodes.find((n) => n.id === 'acc-sw-eng');
    if (!kali || !accEng) return;

    const osiDetails = NetworkEngine.generateOsiDetails('ROGUE_DHCP_OFFER', kali, accEng, '255.255.255.255');

    const roguePkt: ActivePacket = {
      id: `rogue-dhcp-${Date.now()}`,
      protocol: 'ROGUE_DHCP_OFFER',
      sourceNodeId: 'attacker-kali',
      targetNodeId: 'acc-sw-eng',
      finalDestinationIp: '255.255.255.255',
      sourceIp: '10.10.20.99',
      currentHopIndex: 0,
      pathNodeIds: ['attacker-kali', 'acc-sw-eng'],
      pathLinkIds: [],
      progress: 0.6,
      speed: 0.04,
      status: 'dropped',
      dropReason: 'DHCP Snooping untrusted port policy: Dropped unauthorized DHCP Offer on Gi0/3',
      droppedAtNodeId: 'acc-sw-eng',
      osiDetails,
      timestamp: Date.now(),
      payloadDescription: 'Malicious DHCP Offer from Rogue Server (10.10.20.99)',
    };

    setActivePackets((prev) => [...prev, roguePkt]);

    setSecurityLogs((prev) => [
      {
        id: `sec-dhcp-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        deviceId: 'acc-sw-eng',
        deviceName: 'HQ-ACC-SW-ENG',
        interfaceName: 'Gi0/3',
        type: 'DHCP_SNOOPING',
        severity: 'critical',
        title: '%DHCP_SNOOPING-4-UNTRUSTED_PORT',
        message: 'Dropped unauthorized DHCP OFFER on untrusted port Gi0/3 from MAC DE:AD:BE:EF:00:66 (Rogue DHCP Server blocked).',
      },
      ...prev,
    ]);
  };

  // Launch Spoofed ARP Attack (DAI)
  const handleTriggerArpPoisonAttack = () => {
    const kali = nodes.find((n) => n.id === 'attacker-kali');
    const accEng = nodes.find((n) => n.id === 'acc-sw-eng');
    if (!kali || !accEng) return;

    const osiDetails = NetworkEngine.generateOsiDetails('SPOOFED_ARP', kali, accEng, '10.10.20.1');

    const spoofPkt: ActivePacket = {
      id: `spoof-arp-${Date.now()}`,
      protocol: 'SPOOFED_ARP',
      sourceNodeId: 'attacker-kali',
      targetNodeId: 'acc-sw-eng',
      finalDestinationIp: '10.10.20.1',
      sourceIp: '10.10.20.99',
      currentHopIndex: 0,
      pathNodeIds: ['attacker-kali', 'acc-sw-eng'],
      pathLinkIds: [],
      progress: 0.5,
      speed: 0.04,
      status: 'dropped',
      dropReason: 'Dynamic ARP Inspection (DAI): Claimed IP 10.10.20.1 does not match DHCP Snooping DB binding for MAC DE:AD:BE:EF:00:66',
      droppedAtNodeId: 'acc-sw-eng',
      osiDetails,
      timestamp: Date.now(),
      payloadDescription: 'Gratuitous ARP Reply claiming Gateway IP (10.10.20.1)',
    };

    setActivePackets((prev) => [...prev, spoofPkt]);

    setSecurityLogs((prev) => [
      {
        id: `sec-dai-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        deviceId: 'acc-sw-eng',
        deviceName: 'HQ-ACC-SW-ENG',
        interfaceName: 'Gi0/3',
        type: 'DAI',
        severity: 'critical',
        title: '%DAI-4-INVALID_ARP',
        message: '1 Invalid ARPs dropped on Gi0/3 (VLAN 20). Sender IP 10.10.20.1 / MAC DE:AD:BE:EF:00:66 failed DHCP Snooping validation.',
      },
      ...prev,
    ]);
  };

  // Trigger Port Security Violation
  const handleTriggerPortSecurityViolation = (switchId: string, interfaceId: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === switchId) {
          const updatedIfaces = node.interfaces.map((i) => {
            if (i.id === interfaceId) {
              return {
                ...i,
                status: 'err-disabled' as const,
                portSecurity: i.portSecurity
                  ? {
                      ...i.portSecurity,
                      violationCount: i.portSecurity.violationCount + 1,
                    }
                  : undefined,
              };
            }
            return i;
          });
          return { ...node, interfaces: updatedIfaces };
        }
        return node;
      })
    );

    setSecurityLogs((prev) => [
      {
        id: `sec-ps-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        deviceId: switchId,
        deviceName: 'HQ-ACC-SW-ENG',
        interfaceName: 'Gi0/1',
        type: 'PORT_SECURITY',
        severity: 'critical',
        title: '%PORT_SECURITY-2-VIOLATION',
        message: 'Security violation occurred, caused by MAC FF:EE:DD:00:99 on port GigabitEthernet0/1. Interface transitioned to ERR-DISABLED state.',
      },
      ...prev,
    ]);
  };

  // Recover Err-Disabled Port
  const handleRecoverPort = (switchId: string, interfaceId: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === switchId) {
          const updatedIfaces = node.interfaces.map((i) => {
            if (i.id === interfaceId) {
              return { ...i, status: 'up' as const };
            }
            return i;
          });
          return { ...node, interfaces: updatedIfaces };
        }
        return node;
      })
    );

    setSecurityLogs((prev) => [
      {
        id: `sec-rec-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        deviceId: switchId,
        deviceName: 'HQ-ACC-SW-ENG',
        interfaceName: 'Gi0/1',
        type: 'PORT_SECURITY',
        severity: 'success',
        title: '%LINK-3-UPDOWN',
        message: 'Interface GigabitEthernet0/1 administratively recovered (shutdown / no shutdown). Changed state to UP.',
      },
      ...prev,
    ]);
  };

  // Reset entire topology
  const handleResetTopology = () => {
    setNodes(INITIAL_NODES);
    setLinks(INITIAL_LINKS);
    setDhcpBindings(INITIAL_DHCP_BINDINGS);
    setActivePackets([]);
    setSecurityLogs([
      {
        id: `reset-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        deviceId: 'hq-edge-r1',
        deviceName: 'HQ-EDGE-R1',
        type: 'OSPF',
        severity: 'info',
        title: '%SYS-5-CONFIG_I',
        message: 'Topology state reloaded from NVRAM. All links, OSPF adjacencies, and HSRP VIPs restored.',
      },
    ]);
  };

  // Run guided scenario setup
  const handleRunScenarioSetup = (scenario: SimulationScenario) => {
    if (scenario.id === 'sc-ospf-failover') {
      handleToggleLinkStatus('link-core1-dist1');
    } else if (scenario.id === 'sc-hsrp-failover') {
      handleToggleNodeStatus('dist-sw-01');
    } else if (scenario.id === 'sc-stp-loop') {
      handleToggleLinkStatus('link-dist1-acceng');
    } else if (scenario.id === 'sc-dhcp-snooping') {
      handleTriggerRogueDhcpAttack();
    } else if (scenario.id === 'sc-dai-arp-poison') {
      handleTriggerArpPoisonAttack();
    } else if (scenario.id === 'sc-port-security') {
      handleTriggerPortSecurityViolation('acc-sw-eng', 'g0/1');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Sleek Navigation Bar */}
      <header className="border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & System State */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30 border border-blue-400/30">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Nexus360 Enterprise Campus Architecture
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v4.2.1 • 3-TIER HIERARCHICAL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>OSPF Multi-Area</span>
                <span className="text-slate-600">•</span>
                <span>HSRP Redundancy</span>
                <span className="text-slate-600">•</span>
                <span>Rapid PVST+</span>
                <span className="text-slate-600">•</span>
                <span>DHCP Snooping & DAI</span>
              </p>
            </div>
          </div>

          {/* Quick Telemetry Badges & Reload */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-slate-400">OSPF:</span>
              <strong className="text-emerald-400 font-semibold">Area 0, 1, 2</strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <span className="text-slate-400">HSRP VIP:</span>
              <strong className="text-cyan-400 font-semibold">10.10.20.1 (Active)</strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
              <span className="text-slate-400">STP:</span>
              <strong className="text-indigo-400 font-semibold">HQ-CORE-01 (Root)</strong>
            </div>

            <button
              id="btn-global-reset-topology"
              onClick={handleResetTopology}
              className="py-1.5 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Reset Topology & Links"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Reload Topology
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-5 py-6 space-y-6 flex-1">
        {/* TOP SECTION: Visual Topology Canvas */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Interactive Campus Network Topology & Packet Tracer
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono bg-slate-900/60 px-3 py-1 rounded-md border border-slate-800/80">
              💡 Click any link to cut/sever fiber • Click node to open Cisco CLI or toggle power
            </span>
          </div>

          <TopologyCanvas
            nodes={nodes}
            links={links}
            vlans={vlans}
            packets={activePackets}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              setActiveTab('cli');
            }}
            onToggleLinkStatus={handleToggleLinkStatus}
            onToggleNodeStatus={handleToggleNodeStatus}
            onOpenPacketInspector={(pkt) => setInspectingPacket(pkt)}
            onOpenCli={(id) => {
              setSelectedNodeId(id);
              setActiveTab('cli');
            }}
          />

          {/* Traffic Generator Bar */}
          <TrafficGenerator
            nodes={nodes}
            onSendPacket={handleSendPacket}
            onClearPackets={() => setActivePackets([])}
            activePacketCount={activePackets.length}
          />
        </section>

        {/* BOTTOM SECTION: Multifunctional Engineering Tabs */}
        <section className="space-y-3.5">
          {/* Sleek Tabs Header */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/70 rounded-2xl border border-slate-800/80">
            <button
              id="tab-cli"
              onClick={() => setActiveTab('cli')}
              className={`py-2 px-4 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'cli'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4" /> Cisco IOS CLI Console
            </button>

            <button
              id="tab-security"
              onClick={() => setActiveTab('security')}
              className={`py-2 px-4 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'security'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Layer 2 Security & Attacks
            </button>

            <button
              id="tab-protocols"
              onClick={() => setActiveTab('protocols')}
              className={`py-2 px-4 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'protocols'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" /> OSPF / STP / HSRP Telemetry
            </button>

            <button
              id="tab-labs"
              onClick={() => setActiveTab('labs')}
              className={`py-2 px-4 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'labs'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Guided Testing Labs (6 Scenarios)
            </button>

            <button
              id="tab-configs"
              onClick={() => setActiveTab('configs')}
              className={`py-2 px-4 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'configs'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Table className="w-4 h-4" /> Subnets & Cisco .cfg Viewer
            </button>
          </div>

          {/* Active Tab Panel Body */}
          <div>
            {activeTab === 'cli' && (
              <CiscoTerminal
                nodes={nodes}
                links={links}
                dhcpBindings={dhcpBindings}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => setSelectedNodeId(id)}
                onUpdateNode={(updatedNode) =>
                  setNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)))
                }
                onTriggerPingAnimation={(srcId, dstId, dstIp) =>
                  handleSendPacket(srcId, dstId, 'ICMP_ECHO', dstIp)
                }
              />
            )}

            {activeTab === 'security' && (
              <SecurityDashboard
                nodes={nodes}
                dhcpBindings={dhcpBindings}
                securityLogs={securityLogs}
                onTriggerRogueDhcpAttack={handleTriggerRogueDhcpAttack}
                onTriggerArpPoisonAttack={handleTriggerArpPoisonAttack}
                onTriggerPortSecurityViolation={handleTriggerPortSecurityViolation}
                onRecoverPort={handleRecoverPort}
                onClearLogs={() => setSecurityLogs([])}
              />
            )}

            {activeTab === 'protocols' && (
              <ProtocolsMatrix
                nodes={nodes}
                links={links}
                vlans={vlans}
                onSelectNode={(id) => {
                  setSelectedNodeId(id);
                  setActiveTab('cli');
                }}
              />
            )}

            {activeTab === 'labs' && (
              <SimulationScenariosPanel
                scenarios={SCENARIOS}
                activeScenarioId={activeScenarioId}
                onSelectScenario={(id) => setActiveScenarioId(id)}
                onRunScenarioSetup={handleRunScenarioSetup}
                onOpenCliForNode={(id) => {
                  setSelectedNodeId(id);
                  setActiveTab('cli');
                }}
              />
            )}

            {activeTab === 'configs' && (
              <NetworkAddressingSheet nodes={nodes} vlans={vlans} />
            )}
          </div>
        </section>
      </main>

      {/* Packet Inspector Modal */}
      <PacketInspectorModal
        packet={inspectingPacket}
        nodes={nodes}
        onClose={() => setInspectingPacket(null)}
      />

      {/* Sleek App Footer */}
      <footer className="border-t border-slate-800/90 bg-[#020617] py-3.5 px-6 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
          <span>SYSTEM_NOMINAL • ENGINE: CISCO_PACKET_TRACER_CORE • MULTI-SITE</span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Enterprise 3-Tier Campus Network Simulator • OSPF / HSRP / PVST+ / DAI / DHCP Snooping
        </div>
      </footer>
    </div>
  );
}
