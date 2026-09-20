import {
  NetworkNode,
  NetworkLink,
  ActivePacket,
  PacketProtocol,
  OsiLayerInfo,
  SecurityEventLog,
  DhcpBinding,
} from '../types/network';

export class NetworkEngine {
  /**
   * Find path using Dijkstra / Routing Table between source node and destination node
   */
  static computePacketPath(
    sourceNodeId: string,
    targetNodeId: string,
    nodes: NetworkNode[],
    links: NetworkLink[]
  ): { pathNodes: string[]; pathLinks: string[]; feasible: boolean; dropReason?: string; droppedAtNodeId?: string } {
    const srcNode = nodes.find((n) => n.id === sourceNodeId);
    const dstNode = nodes.find((n) => n.id === targetNodeId);

    if (!srcNode || !dstNode) {
      return { pathNodes: [], pathLinks: [], feasible: false, dropReason: 'Invalid source or destination node' };
    }

    if (srcNode.status !== 'up') {
      return { pathNodes: [sourceNodeId], pathLinks: [], feasible: false, dropReason: `Source node ${srcNode.name} is DOWN` };
    }

    if (dstNode.status !== 'up') {
      return { pathNodes: [sourceNodeId], pathLinks: [], feasible: false, dropReason: `Destination node ${dstNode.name} is unreachable (device DOWN)` };
    }

    // Build adjacency graph of active links (excluding down or stp-blocked links)
    const adj = new Map<string, { neighborId: string; linkId: string; cost: number }[]>();
    nodes.forEach((n) => adj.set(n.id, []));

    links.forEach((link) => {
      if (link.status === 'up') {
        const u = link.sourceNodeId;
        const v = link.targetNodeId;
        const nodeU = nodes.find((n) => n.id === u);
        const nodeV = nodes.find((n) => n.id === v);

        // Check if device interfaces are up
        const ifU = nodeU?.interfaces.find((i) => i.id === link.sourceInterfaceId);
        const ifV = nodeV?.interfaces.find((i) => i.id === link.targetInterfaceId);

        if (nodeU?.status === 'up' && nodeV?.status === 'up' && ifU?.status === 'up' && ifV?.status === 'up') {
          adj.get(u)?.push({ neighborId: v, linkId: link.id, cost: link.cost });
          adj.get(v)?.push({ neighborId: u, linkId: link.id, cost: link.cost });
        }
      }
    });

    // Dijkstra algorithm
    const distances = new Map<string, number>();
    const previous = new Map<string, { prevNodeId: string; linkId: string } | null>();
    const visited = new Set<string>();

    nodes.forEach((n) => distances.set(n.id, Infinity));
    distances.set(sourceNodeId, 0);

    while (visited.size < nodes.length) {
      let closestNode: string | null = null;
      let minDistance = Infinity;

      for (const [nodeId, dist] of distances.entries()) {
        if (!visited.has(nodeId) && dist < minDistance) {
          minDistance = dist;
          closestNode = nodeId;
        }
      }

      if (closestNode === null || minDistance === Infinity) break;
      if (closestNode === targetNodeId) break;

      visited.add(closestNode);

      const neighbors = adj.get(closestNode) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.neighborId)) {
          const newDist = distances.get(closestNode)! + edge.cost;
          if (newDist < distances.get(edge.neighborId)!) {
            distances.set(edge.neighborId, newDist);
            previous.set(edge.neighborId, { prevNodeId: closestNode, linkId: edge.linkId });
          }
        }
      }
    }

    if (!previous.has(targetNodeId) && sourceNodeId !== targetNodeId) {
      return {
        pathNodes: [sourceNodeId],
        pathLinks: [],
        feasible: false,
        dropReason: 'No feasible path through active routing/switching topology (Network Partition or Blocked Link)',
        droppedAtNodeId: sourceNodeId,
      };
    }

    // Reconstruct path
    const pathNodes: string[] = [targetNodeId];
    const pathLinks: string[] = [];
    let curr = targetNodeId;

    while (curr !== sourceNodeId) {
      const prevInfo = previous.get(curr);
      if (!prevInfo) break;
      pathLinks.unshift(prevInfo.linkId);
      pathNodes.unshift(prevInfo.prevNodeId);
      curr = prevInfo.prevNodeId;
    }

    return {
      pathNodes,
      pathLinks,
      feasible: true,
    };
  }

  /**
   * Generates rich OSI 7-Layer PDU details for Cisco Packet Tracer style inspection
   */
  static generateOsiDetails(
    protocol: PacketProtocol,
    srcNode: NetworkNode,
    dstNode: NetworkNode,
    finalDstIp: string
  ): OsiLayerInfo[] {
    const srcIp = srcNode.managementIp || srcNode.interfaces[0]?.ip || '10.10.20.15';
    const srcMac = srcNode.mac;
    const dstMac = dstNode.mac;

    switch (protocol) {
      case 'ICMP_ECHO':
        return [
          {
            layer: 1,
            name: 'Physical Layer',
            headerDetails: `Port: FastEthernet0/1 (Full-Duplex, 1000 Mbps Copper)`,
            status: 'valid',
            explanation: 'Encodes bits onto medium via 1000BASE-T 8B/10B encoding.',
          },
          {
            layer: 2,
            name: 'Data Link Layer (Ethernet II / 802.1Q)',
            headerDetails: `Src MAC: ${srcMac} | Dst MAC: ${dstMac} | EtherType: 0x0800 (IPv4) ${srcNode.vlanId ? `| 802.1Q Tag: VLAN ${srcNode.vlanId}` : ''}`,
            status: 'valid',
            explanation: 'Frames the packet with source/destination MAC addresses and 802.1Q trunk tag where applicable.',
          },
          {
            layer: 3,
            name: 'Network Layer (IPv4)',
            headerDetails: `Src IP: ${srcIp} -> Dst IP: ${finalDstIp} | TTL: 64 | Protocol: 1 (ICMP)`,
            status: 'valid',
            explanation: `Route lookup matches longest prefix; next-hop default gateway resolved via HSRP VIP.`,
          },
          {
            layer: 4,
            name: 'Transport / Control Layer',
            headerDetails: `Type: 8 (Echo Request) | Code: 0 | Checksum: 0x4f2a | Seq: 1 | Payload: 32 bytes`,
            status: 'valid',
            explanation: 'ICMP Echo Request message requesting reply from remote host.',
          },
          {
            layer: 7,
            name: 'Application Layer',
            headerDetails: `Application: Cisco IOS Diagnostic Ping Utility`,
            status: 'valid',
            explanation: 'End-user CLI ping execution validating end-to-end IP reachability.',
          },
        ];

      case 'OSPF_HELLO':
        return [
          {
            layer: 1,
            name: 'Physical Layer',
            headerDetails: `Port: GigabitEthernet0/1 (10GBASE-SR Fiber)`,
            status: 'valid',
            explanation: 'High-speed backbone trunk link physical framing.',
          },
          {
            layer: 2,
            name: 'Data Link Layer',
            headerDetails: `Src MAC: ${srcMac} | Dst MAC: 01:00:5E:00:00:05 (OSPF Multicast AllSPFRouters)`,
            status: 'valid',
            explanation: 'Layer 2 multicast frame directed to standard OSPF multicast group.',
          },
          {
            layer: 3,
            name: 'Network Layer (IPv4)',
            headerDetails: `Src IP: ${srcIp} -> Dst IP: 224.0.0.5 | TTL: 1 | Protocol: 89 (OSPF)`,
            status: 'valid',
            explanation: 'OSPF packet sent with TTL=1 for link-local multicast adjacency.',
          },
          {
            layer: 4,
            name: 'Routing Protocol Header',
            headerDetails: `OSPFv2 Type 1 (Hello) | Area: 0.0.0.0 | Router ID: ${srcNode.ospf?.routerId || '1.1.1.1'} | HelloInt: 10s | DeadInt: 40s`,
            status: 'valid',
            explanation: 'Maintains 2-Way and Full neighbor adjacencies with DR/BDR election parameters.',
          },
        ];

      case 'STP_BPDU':
        return [
          {
            layer: 1,
            name: 'Physical Layer',
            headerDetails: `Port: GigabitEthernet0/23 (1 Gbps Trunk)`,
            status: 'valid',
            explanation: 'Transmitted every 2 seconds by active switch ports.',
          },
          {
            layer: 2,
            name: 'Data Link Layer (802.3 LLC / Spanning Tree)',
            headerDetails: `Dst MAC: 01:80:C2:00:00:00 (Bridge Multicast) | LLC: 0x424203`,
            status: 'valid',
            explanation: 'Bridge Protocol Data Unit (BPDU) used for loop detection and Root Bridge election.',
          },
          {
            layer: 3,
            name: 'Spanning Tree Information',
            headerDetails: `Protocol ID: 0 (IEEE 802.1D) | Root ID: ${srcNode.stp?.rootBridgeId || '24576.000A.F302.0001'} | Cost: ${srcNode.stp?.rootCost || 0}`,
            status: 'valid',
            explanation: 'Switch calculates Path Cost to Root Bridge and assigns Root/Designated/Alternate roles.',
          },
        ];

      case 'HSRP_HELLO':
        return [
          {
            layer: 2,
            name: 'Data Link Layer',
            headerDetails: `Src MAC: ${srcMac} | Dst MAC: 01:00:5E:00:00:02 (All Routers Multicast)`,
            status: 'valid',
            explanation: 'HSRP heartbeat broadcasted between Distribution switches.',
          },
          {
            layer: 3,
            name: 'Network Layer',
            headerDetails: `Src IP: ${srcIp} -> Dst IP: 224.0.0.2 | TTL: 1 | Protocol: 17 (UDP)`,
            status: 'valid',
            explanation: 'UDP Port 1985 multicast for HSRP group negotiation.',
          },
          {
            layer: 4,
            name: 'HSRP State Machine',
            headerDetails: `Group: ${srcNode.hsrp?.[0]?.group || 20} | State: ${srcNode.hsrp?.[0]?.state || 'Active'} | Priority: ${srcNode.hsrp?.[0]?.priority || 110} | VIP: ${srcNode.hsrp?.[0]?.virtualIp || '10.10.20.1'}`,
            status: 'valid',
            explanation: 'Exchanges active/standby router priorities and validates Preempt triggers.',
          },
        ];

      case 'ROGUE_DHCP_OFFER':
        return [
          {
            layer: 2,
            name: 'Data Link Layer',
            headerDetails: `Src MAC: ${srcMac} | Dst MAC: FF:FF:FF:FF:FF:FF (Broadcast)`,
            status: 'rejected',
            explanation: 'Untrusted Port Ingress! Port is NOT configured with "ip dhcp snooping trust".',
          },
          {
            layer: 3,
            name: 'Network Layer (IPv4)',
            headerDetails: `Src IP: 10.10.20.99 -> Dst IP: 255.255.255.255 | UDP: 67 -> 68`,
            status: 'rejected',
            explanation: 'DHCP Snooping filter intercepts DHCP Offer from unauthorized server.',
          },
          {
            layer: 4,
            name: 'DHCP Application / Security Engine',
            headerDetails: `DHCP OFFER | Malicious Gateway: 10.10.20.99 | Malicious DNS: 10.10.20.99`,
            status: 'rejected',
            explanation: 'DROPPED BY SWITCH SECURITY ENGINE: Rogue DHCP offer intercepted and blackholed.',
          },
        ];

      case 'SPOOFED_ARP':
        return [
          {
            layer: 2,
            name: 'Data Link Layer',
            headerDetails: `Src MAC: ${srcMac} (Attacker) | Dst MAC: FF:FF:FF:FF:FF:FF (Gratuitous Broadcast)`,
            status: 'rejected',
            explanation: 'Dynamic ARP Inspection (DAI) intercepts frame for snooping database validation.',
          },
          {
            layer: 3,
            name: 'ARP Header (Address Resolution Protocol)',
            headerDetails: `Opcode: 2 (ARP Reply) | Claimed IP: 10.10.20.1 -> Claimed MAC: ${srcMac}`,
            status: 'rejected',
            explanation: 'DAI lookup in DHCP Snooping table reveals mismatch: IP 10.10.20.1 does not belong to MAC.',
          },
          {
            layer: 7,
            name: 'Security Alert',
            headerDetails: `%DAI-4-INVALID_ARP: Dropped spoofed ARP reply on untrusted port Gi0/3`,
            status: 'rejected',
            explanation: 'Man-In-The-Middle (MITM) ARP poisoning blocked and logged in SIEM.',
          },
        ];

      default:
        return [
          {
            layer: 2,
            name: 'Data Link Layer',
            headerDetails: `Src MAC: ${srcMac} | Dst MAC: ${dstMac}`,
            status: 'valid',
            explanation: 'Standard Layer 2 frame forwarding.',
          },
          {
            layer: 3,
            name: 'Network Layer',
            headerDetails: `Src IP: ${srcIp} -> Dst IP: ${finalDstIp}`,
            status: 'valid',
            explanation: 'Standard IPv4 packet processing.',
          },
        ];
    }
  }

  /**
   * Recalculates Spanning Tree Protocol (STP) state when links or switches change
   */
  static recalculateStp(nodes: NetworkNode[], links: NetworkLink[]): { updatedNodes: NetworkNode[]; updatedLinks: NetworkLink[]; logs: SecurityEventLog[] } {
    const logs: SecurityEventLog[] = [];
    const updatedNodes = [...nodes];
    const updatedLinks = [...links];

    // Find root bridge for VLAN 10/20 (HQ-DIST-SW01 has lowest priority 24576)
    const dist1 = updatedNodes.find((n) => n.id === 'dist-sw-01');
    const dist2 = updatedNodes.find((n) => n.id === 'dist-sw-02');
    const accEng = updatedNodes.find((n) => n.id === 'acc-sw-eng');
    const accHr = updatedNodes.find((n) => n.id === 'acc-sw-hr');

    const linkDist1AccEng = updatedLinks.find((l) => l.id === 'link-dist1-acceng');
    const linkDist2AccEng = updatedLinks.find((l) => l.id === 'link-dist2-acceng');

    const linkDist1AccHr = updatedLinks.find((l) => l.id === 'link-dist1-acchr');
    const linkDist2AccHr = updatedLinks.find((l) => l.id === 'link-dist2-acchr');

    // If primary link to Dist-01 is down, unblock the redundant link on Acc-SW-Eng
    if (linkDist1AccEng && linkDist2AccEng && accEng) {
      if (linkDist1AccEng.status === 'down' || dist1?.status === 'down') {
        if (linkDist2AccEng.status === 'stp-blocked') {
          linkDist2AccEng.status = 'up';
          // Update interface roles
          const if24 = accEng.interfaces.find((i) => i.id === 'g0/24');
          if (if24) {
            if24.stpRole = 'Root';
            if24.stpState = 'Forwarding';
          }
          logs.push({
            id: `stp-${Date.now()}-1`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: 'acc-sw-eng',
            deviceName: 'HQ-ACC-SW-ENG',
            interfaceName: 'Gi0/24',
            type: 'STP',
            severity: 'warning',
            title: '%SPANTREE-5-TOPOTRANS',
            message: 'Topology change detected. Port Gi0/24 transitioned from BLOCKING -> FORWARDING (New Root Port).',
          });
        }
      } else if (linkDist1AccEng.status === 'up' && dist1?.status === 'up') {
        // Dist1 is up, primary link is active, secondary is blocked to avoid loops
        if (linkDist2AccEng.status === 'up') {
          linkDist2AccEng.status = 'stp-blocked';
          const if24 = accEng.interfaces.find((i) => i.id === 'g0/24');
          if (if24) {
            if24.stpRole = 'Alternate';
            if24.stpState = 'Blocking';
          }
          logs.push({
            id: `stp-${Date.now()}-2`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: 'acc-sw-eng',
            deviceName: 'HQ-ACC-SW-ENG',
            interfaceName: 'Gi0/24',
            type: 'STP',
            severity: 'info',
            title: '%SPANTREE-6-PORT_BLOCK',
            message: 'Spanning Tree elected Gi0/23 as Root Port. Port Gi0/24 transitioned to ALTERNATE/BLOCKING to prevent loop.',
          });
        }
      }
    }

    // Acc-HR Spanning Tree dual uplink check
    if (linkDist2AccHr && linkDist1AccHr && accHr) {
      if (linkDist2AccHr.status === 'down' || dist2?.status === 'down') {
        if (linkDist1AccHr.status === 'stp-blocked') {
          linkDist1AccHr.status = 'up';
          const if23 = accHr.interfaces.find((i) => i.id === 'g0/23');
          if (if23) {
            if23.stpRole = 'Root';
            if23.stpState = 'Forwarding';
          }
          logs.push({
            id: `stp-${Date.now()}-3`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: 'acc-sw-hr',
            deviceName: 'HQ-ACC-SW-HR',
            interfaceName: 'Gi0/23',
            type: 'STP',
            severity: 'warning',
            title: '%SPANTREE-5-TOPOTRANS',
            message: 'Topology change on VLAN 30. Gi0/23 transitioned from BLOCKING -> FORWARDING.',
          });
        }
      } else if (linkDist2AccHr.status === 'up' && dist2?.status === 'up') {
        if (linkDist1AccHr.status === 'up') {
          linkDist1AccHr.status = 'stp-blocked';
          const if23 = accHr.interfaces.find((i) => i.id === 'g0/23');
          if (if23) {
            if23.stpRole = 'Alternate';
            if23.stpState = 'Blocking';
          }
        }
      }
    }

    return { updatedNodes, updatedLinks, logs };
  }

  /**
   * Recalculates HSRP State (Active / Standby) on Distribution layer switches
   */
  static recalculateHsrp(nodes: NetworkNode[]): { updatedNodes: NetworkNode[]; logs: SecurityEventLog[] } {
    const logs: SecurityEventLog[] = [];
    const updatedNodes = [...nodes];

    const dist1 = updatedNodes.find((n) => n.id === 'dist-sw-01');
    const dist2 = updatedNodes.find((n) => n.id === 'dist-sw-02');

    if (!dist1 || !dist2 || !dist1.hsrp || !dist2.hsrp) {
      return { updatedNodes, logs };
    }

    // VLAN 10 & 20: Dist-01 is primary active (priority 110), Dist-02 is standby (priority 90)
    [10, 20].forEach((vlanId) => {
      const g1 = dist1.hsrp?.find((g) => g.vlanId === vlanId);
      const g2 = dist2.hsrp?.find((g) => g.vlanId === vlanId);

      if (g1 && g2) {
        if (dist1.status === 'down') {
          if (g2.state !== 'Active') {
            g2.state = 'Active';
            g2.activeRouter = 'HQ-DIST-SW02 (local)';
            g2.standbyRouter = 'unknown';
            logs.push({
              id: `hsrp-${Date.now()}-${vlanId}`,
              timestamp: new Date().toLocaleTimeString(),
              deviceId: 'dist-sw-02',
              deviceName: 'HQ-DIST-SW02',
              interfaceName: `Vlan${vlanId}`,
              type: 'HSRP',
              severity: 'critical',
              title: '%HSRP-5-STATECHANGE',
              message: `Vlan${vlanId} Grp ${vlanId} state Standby -> Active (Peer router timed out). Assuming Virtual Gateway IP ${g2.virtualIp}.`,
            });
          }
        } else if (dist1.status === 'up' && g1.preempt) {
          // Preempt back to Dist-01
          if (g1.state !== 'Active') {
            g1.state = 'Active';
            g1.activeRouter = 'HQ-DIST-SW01 (local)';
            g1.standbyRouter = '10.10.20.3';
            g2.state = 'Standby';
            g2.activeRouter = '10.10.20.2';
            g2.standbyRouter = 'HQ-DIST-SW02 (local)';
            logs.push({
              id: `hsrp-${Date.now()}-preempt-${vlanId}`,
              timestamp: new Date().toLocaleTimeString(),
              deviceId: 'dist-sw-01',
              deviceName: 'HQ-DIST-SW01',
              interfaceName: `Vlan${vlanId}`,
              type: 'HSRP',
              severity: 'success',
              title: '%HSRP-5-STATECHANGE',
              message: `Vlan${vlanId} Grp ${vlanId} state Standby -> Active (Higher priority 110 preempted). Virtual IP ${g1.virtualIp} reclaimed.`,
            });
          }
        }
      }
    });

    return { updatedNodes, logs };
  }

  /**
   * Recalculates OSPF Neighbor States and Routing Tables across all routers
   */
  static recalculateOspf(nodes: NetworkNode[], links: NetworkLink[]): { updatedNodes: NetworkNode[]; logs: SecurityEventLog[] } {
    const logs: SecurityEventLog[] = [];
    const updatedNodes = [...nodes];

    // Check OSPF neighbors on Core-01, Core-02, Dist-01, Dist-02, Edge-R1
    updatedNodes.forEach((node) => {
      if (node.ospf && node.ospf.enabled) {
        node.ospf.neighbors.forEach((nbr) => {
          const peerNode = updatedNodes.find((n) => n.id === nbr.deviceId);
          // Find connecting link
          const link = links.find(
            (l) =>
              (l.sourceNodeId === node.id && l.targetNodeId === nbr.deviceId) ||
              (l.targetNodeId === node.id && l.sourceNodeId === nbr.deviceId)
          );

          if (!peerNode || peerNode.status !== 'up' || !link || link.status !== 'up') {
            if (nbr.state !== 'DOWN') {
              nbr.state = 'DOWN';
              nbr.deadTime = 0;
              logs.push({
                id: `ospf-${Date.now()}-${node.id}-${nbr.neighborId}`,
                timestamp: new Date().toLocaleTimeString(),
                deviceId: node.id,
                deviceName: node.hostname,
                type: 'OSPF',
                severity: 'warning',
                title: '%OSPF-5-ADJCHANGE',
                message: `Process 1, Nbr ${nbr.neighborId} on ${nbr.interface} from FULL to DOWN, Neighbor Down: Dead timer expired`,
              });
            }
          } else {
            if (nbr.state === 'DOWN') {
              nbr.state = 'FULL/DR';
              nbr.deadTime = 39;
              logs.push({
                id: `ospf-${Date.now()}-up-${node.id}-${nbr.neighborId}`,
                timestamp: new Date().toLocaleTimeString(),
                deviceId: node.id,
                deviceName: node.hostname,
                type: 'OSPF',
                severity: 'success',
                title: '%OSPF-5-ADJCHANGE',
                message: `Process 1, Nbr ${nbr.neighborId} on ${nbr.interface} from LOADING to FULL, Loading Done. OSPF SPF Re-converged in 14ms.`,
              });
            }
          }
        });
      }
    });

    return { updatedNodes, logs };
  }
}
