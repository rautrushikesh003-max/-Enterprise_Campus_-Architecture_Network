import { NetworkNode, NetworkLink, DhcpBinding } from '../types/network';

export interface CliSessionState {
  mode: 'user' | 'privileged' | 'config' | 'config-if' | 'config-router';
  currentInterface?: string;
  history: string[];
  historyIndex: number;
}

export class CiscoCliEngine {
  static getPrompt(node: NetworkNode, session: CliSessionState): string {
    const host = node.hostname;
    switch (session.mode) {
      case 'user':
        return `${host}>`;
      case 'privileged':
        return `${host}#`;
      case 'config':
        return `${host}(config)#`;
      case 'config-if':
        return `${host}(config-if)#`;
      case 'config-router':
        return `${host}(config-router)#`;
      default:
        return `${host}#`;
    }
  }

  static executeCommand(
    rawCmd: string,
    node: NetworkNode,
    session: CliSessionState,
    allNodes: NetworkNode[],
    allLinks: NetworkLink[],
    dhcpBindings: DhcpBinding[]
  ): {
    output: string[];
    newSession: CliSessionState;
    updatedNode?: NetworkNode;
    pingAnimation?: { targetIp: string; targetNodeId: string; success: boolean };
  } {
    const cmd = rawCmd.trim();
    const newSession = { ...session };
    const output: string[] = [];

    if (!cmd) {
      return { output: [], newSession };
    }

    const lowerCmd = cmd.toLowerCase();

    // History tracking
    newSession.history = [...newSession.history, cmd];
    newSession.historyIndex = newSession.history.length;

    // Help command
    if (cmd === '?') {
      return {
        output: [
          'Exec commands:',
          '  enable              Turn on privileged commands',
          '  disable             Turn off privileged commands',
          '  configure terminal  Enter configuration mode',
          '  show                Show running system information',
          '  ping                Send echo messages',
          '  traceroute          Trace route to destination',
          '  write memory        Save running configuration',
          '  exit                Exit from current mode',
        ],
        newSession,
      };
    }

    // ================= Mode Navigation =================
    if (lowerCmd === 'enable' || lowerCmd === 'en') {
      newSession.mode = 'privileged';
      return { output: [], newSession };
    }

    if (lowerCmd === 'disable') {
      newSession.mode = 'user';
      return { output: [], newSession };
    }

    if (lowerCmd === 'conf t' || lowerCmd === 'configure terminal' || lowerCmd === 'config t') {
      if (session.mode === 'user') {
        return { output: ['% Privileged EXEC mode required to configure terminal.'], newSession };
      }
      newSession.mode = 'config';
      return {
        output: ['Enter configuration commands, one per line. End with CNTL/Z.'],
        newSession,
      };
    }

    if (lowerCmd === 'exit') {
      if (session.mode === 'config-if' || session.mode === 'config-router') {
        newSession.mode = 'config';
        newSession.currentInterface = undefined;
      } else if (session.mode === 'config') {
        newSession.mode = 'privileged';
      } else if (session.mode === 'privileged') {
        newSession.mode = 'user';
      }
      return { output: [], newSession };
    }

    if (lowerCmd === 'end') {
      newSession.mode = 'privileged';
      newSession.currentInterface = undefined;
      return { output: [], newSession };
    }

    // Config sub-modes
    if (session.mode === 'config') {
      if (lowerCmd.startsWith('interface ') || lowerCmd.startsWith('int ')) {
        const parts = cmd.split(' ');
        newSession.mode = 'config-if';
        newSession.currentInterface = parts[1];
        return { output: [], newSession };
      }

      if (lowerCmd.startsWith('router ospf')) {
        newSession.mode = 'config-router';
        return { output: [], newSession };
      }

      if (lowerCmd.startsWith('hostname ')) {
        const newHost = cmd.split(' ')[1];
        const updatedNode = { ...node, hostname: newHost };
        return { output: [], newSession, updatedNode };
      }
    }

    // Interface commands
    if (session.mode === 'config-if') {
      if (lowerCmd === 'shutdown' || lowerCmd === 'shut') {
        const updatedNode = { ...node };
        const iface = updatedNode.interfaces.find(
          (i) => i.name.toLowerCase() === session.currentInterface?.toLowerCase() || i.id.toLowerCase() === session.currentInterface?.toLowerCase()
        );
        if (iface) {
          iface.status = 'down';
          return {
            output: [`%LINK-5-CHANGED: Interface ${iface.name}, changed state to administratively down`, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to down`],
            newSession,
            updatedNode,
          };
        }
      }

      if (lowerCmd === 'no shutdown' || lowerCmd === 'no shut') {
        const updatedNode = { ...node };
        const iface = updatedNode.interfaces.find(
          (i) => i.name.toLowerCase() === session.currentInterface?.toLowerCase() || i.id.toLowerCase() === session.currentInterface?.toLowerCase()
        );
        if (iface) {
          iface.status = 'up';
          return {
            output: [`%LINK-3-UPDOWN: Interface ${iface.name}, changed state to up`, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to up`],
            newSession,
            updatedNode,
          };
        }
      }
    }

    // ================= SHOW COMMANDS =================

    // show ip route
    if (lowerCmd === 'show ip route' || lowerCmd === 'sh ip ro' || lowerCmd === 'sh ip route') {
      output.push('Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP');
      output.push('       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area');
      output.push('       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2');
      output.push('       E1 - OSPF external type 1, E2 - OSPF external type 2');
      output.push('');
      output.push('Gateway of last resort is 10.0.1.2 to network 0.0.0.0');
      output.push('');

      if (node.routingTable && node.routingTable.length > 0) {
        node.routingTable.forEach((r) => {
          const code = r.protocol === 'C' ? 'C' : r.protocol === 'O' ? 'O' : r.protocol === 'O_IA' ? 'O IA' : r.protocol === 'S' ? 'S' : 'B';
          if (r.nextHop === 'Directly Connected') {
            output.push(`${code.padEnd(6)} ${r.prefix.padEnd(18)} is directly connected, ${r.interface}`);
          } else {
            output.push(`${code.padEnd(6)} ${r.prefix.padEnd(18)} [${r.adminDistance}/${r.metric}] via ${r.nextHop}, 00:14:22, ${r.interface}`);
          }
        });
      } else {
        output.push('No active routes in RIB (Layer 2 switch operation mode).');
      }
      return { output, newSession };
    }

    // show ip ospf neighbor
    if (lowerCmd.startsWith('show ip ospf neighbor') || lowerCmd.startsWith('sh ip ospf nei')) {
      if (!node.ospf || !node.ospf.enabled) {
        return { output: ['% OSPF is not enabled on this device.'], newSession };
      }
      output.push('Neighbor ID     Pri   State           Dead Time   Address         Interface');
      node.ospf.neighbors.forEach((nbr) => {
        output.push(
          `${nbr.neighborId.padEnd(16)} 1     ${nbr.state.padEnd(15)} 00:00:${String(nbr.deadTime).padStart(2, '0')}    ${nbr.ip.padEnd(15)} ${nbr.interface}`
        );
      });
      return { output, newSession };
    }

    // show ip ospf interface
    if (lowerCmd.startsWith('show ip ospf interface') || lowerCmd.startsWith('sh ip ospf int')) {
      if (!node.ospf) return { output: ['% OSPF process not configured'], newSession };
      output.push(`OSPF Process 1 with ID ${node.ospf.routerId}, Area ${node.ospf.area}`);
      node.interfaces
        .filter((i) => i.ip)
        .forEach((i) => {
          output.push(`${i.name} is up, line protocol is up`);
          output.push(`  Internet Address ${i.ip}/30, Area ${node.ospf?.area}, Cost: 1`);
          output.push(`  Process ID 1, Router ID ${node.ospf?.routerId}, Network Type BROADCAST, Cost: 1`);
          output.push(`  Transmit Delay is 1 sec, State DR, Priority 1`);
          output.push(`  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5`);
        });
      return { output, newSession };
    }

    // show spanning-tree
    if (lowerCmd.startsWith('show spanning-tree') || lowerCmd.startsWith('sh span')) {
      if (!node.stp) return { output: ['No spanning tree instances active.'], newSession };
      output.push('VLAN0020');
      output.push('  Spanning tree enabled protocol rstp');
      output.push('  Root ID    Priority    ' + node.stp.priority);
      output.push('             Address     ' + node.stp.rootBridgeId);
      output.push(node.stp.isRootBridge ? '             This bridge is the root' : '             Cost        4');
      output.push('');
      output.push('Interface           Role Sts Cost      Prio.Nbr Type');
      output.push('------------------- ---- --- --------- -------- --------------------------------');
      node.interfaces.forEach((i) => {
        const role = i.stpRole || 'Desg';
        const state = i.stpState === 'Forwarding' ? 'FWD' : i.stpState === 'Blocking' ? 'BLK' : 'LRN';
        output.push(`${i.name.padEnd(19)} ${role.slice(0, 4).padEnd(4)} ${state.padEnd(3)} 4         128.1    P2p`);
      });
      return { output, newSession };
    }

    // show standby brief / show standby
    if (lowerCmd.startsWith('show standby') || lowerCmd.startsWith('sh stand')) {
      if (!node.hsrp || node.hsrp.length === 0) {
        return { output: ['% HSRP is not configured on this switch.'], newSession };
      }
      output.push('Interface   Grp  Pri P State   Active          Standby         Virtual IP');
      node.hsrp.forEach((h) => {
        output.push(
          `Vlan${String(h.vlanId).padEnd(6)} ${String(h.group).padEnd(4)} ${String(h.priority).padEnd(3)} ${h.preempt ? 'P' : ' '} ${h.state.padEnd(7)} ${h.activeRouter.padEnd(15)} ${h.standbyRouter.padEnd(15)} ${h.virtualIp}`
        );
      });
      return { output, newSession };
    }

    // show ip interface brief
    if (lowerCmd === 'show ip interface brief' || lowerCmd === 'sh ip int br' || lowerCmd === 'sh ip int brief') {
      output.push('Interface              IP-Address      OK? Method Status                Protocol');
      node.interfaces.forEach((i) => {
        const ip = i.ip || 'unassigned';
        const stat = i.status === 'up' ? 'up' : 'administratively down';
        const proto = i.status === 'up' ? 'up' : 'down';
        output.push(`${i.name.padEnd(22)} ${ip.padEnd(15)} YES manual ${stat.padEnd(21)} ${proto}`);
      });
      return { output, newSession };
    }

    // show ip dhcp snooping / show ip dhcp snooping binding
    if (lowerCmd.startsWith('show ip dhcp snooping')) {
      if (lowerCmd.includes('binding')) {
        output.push('MacAddress          IpAddress        Lease(sec)  Type             VLAN  Interface');
        output.push('------------------  ---------------  ----------  ---------------  ----  --------------------');
        dhcpBindings.forEach((b) => {
          output.push(`${b.mac.padEnd(19)} ${b.ip.padEnd(16)} ${String(b.leaseTimeSec).padEnd(11)} ${b.type.padEnd(16)} ${String(b.vlan).padEnd(5)} ${b.interface}`);
        });
        output.push(`Total number of bindings: ${dhcpBindings.length}`);
      } else {
        output.push('Switch DHCP snooping is enabled');
        output.push('DHCP snooping is configured on following VLANs: 10, 20, 30');
        output.push('DHCP snooping is operational on following VLANs: 10, 20, 30');
        output.push('DHCP snooping trust status:');
        node.interfaces.forEach((i) => {
          output.push(`  Interface ${i.name.padEnd(18)} Trusted: ${i.dhcpSnoopingTrusted ? 'yes' : 'no'}`);
        });
      }
      return { output, newSession };
    }

    // show ip arp inspection
    if (lowerCmd.startsWith('show ip arp inspection') || lowerCmd.startsWith('sh ip arp ins')) {
      output.push('Source Mac Validation      : Disabled');
      output.push('Destination Mac Validation : Disabled');
      output.push('IP Address Validation      : Enabled (Validated via DHCP Snooping DB)');
      output.push('');
      output.push(' Vlan     Configuration    Operation   Permitted    Dropped    Forwarded');
      output.push(' ----     -------------    ---------   ---------    -------    ---------');
      output.push(`   20     Enabled          Active           1420          0         1420`);
      output.push(`   30     Enabled          Active            890          0          890`);
      return { output, newSession };
    }

    // show port-security
    if (lowerCmd.startsWith('show port-security') || lowerCmd.startsWith('sh port-sec')) {
      output.push('Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action');
      output.push('                (Count)       (Count)          (Count)');
      output.push('---------------------------------------------------------------------------');
      node.interfaces
        .filter((i) => i.portSecurity && i.portSecurity.enabled)
        .forEach((i) => {
          const ps = i.portSecurity!;
          output.push(
            `${i.name.padEnd(12)} ${String(ps.maxMac).padEnd(14)} ${String(ps.learnedMacs.length).padEnd(12)} ${String(ps.violationCount).padEnd(18)} ${ps.violation}`
          );
        });
      return { output, newSession };
    }

    // show mac address-table
    if (lowerCmd.startsWith('show mac') || lowerCmd.startsWith('sh mac')) {
      output.push('          Mac Address Table');
      output.push('-------------------------------------------');
      output.push('Vlan    Mac Address       Type        Ports');
      output.push('----    -----------       --------    -----');
      node.interfaces.forEach((i) => {
        if (i.portSecurity?.learnedMacs && i.portSecurity.learnedMacs.length > 0) {
          i.portSecurity.learnedMacs.forEach((m) => {
            output.push(`${String(i.accessVlan || 20).padEnd(7)} ${m.padEnd(17)} STATIC      ${i.name}`);
          });
        } else {
          output.push(`${String(i.accessVlan || 20).padEnd(7)} ${i.mac.padEnd(17)} DYNAMIC     ${i.name}`);
        }
      });
      return { output, newSession };
    }

    // show vlan brief
    if (lowerCmd.startsWith('show vlan') || lowerCmd.startsWith('sh vlan')) {
      output.push('VLAN Name                             Status    Ports');
      output.push('---- -------------------------------- --------- -------------------------------');
      output.push('1    default                          active    Gi0/6, Gi0/7, Gi0/8');
      output.push('10   MGMT-IT                          active    Gi0/10');
      output.push('20   ENGINEERING                      active    Gi0/1, Gi0/2, Gi0/3');
      output.push('30   HR-FINANCE                       active    Gi0/4, Gi0/5');
      output.push('40   GUEST-IOT                        active    ');
      output.push('99   NATIVE-PARKING                   active    ');
      output.push('100  SERVER-FARM                      active    ');
      return { output, newSession };
    }

    // show running-config
    if (lowerCmd === 'show running-config' || lowerCmd === 'sh run' || lowerCmd === 'show run') {
      output.push('Building configuration...');
      output.push('Current configuration : 1842 bytes');
      output.push('!');
      output.push(node.runningConfig || `hostname ${node.hostname}\n!\nend`);
      output.push('!');
      output.push('end');
      return { output, newSession };
    }

    // ping <ip>
    if (lowerCmd.startsWith('ping ')) {
      const targetIp = cmd.split(' ')[1]?.trim();
      if (!targetIp) return { output: ['% Incomplete command.'], newSession };

      const targetNode = allNodes.find((n) => n.managementIp === targetIp || n.interfaces.some((i) => i.ip === targetIp));

      output.push(`Type escape sequence to abort.`);
      output.push(`Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`);

      if (targetNode && targetNode.status === 'up') {
        output.push('!!!!!');
        output.push('Success rate is 100 percent (5/5), round-trip min/avg/max = 1/3/7 ms');
        return {
          output,
          newSession,
          pingAnimation: { targetIp, targetNodeId: targetNode.id, success: true },
        };
      } else {
        output.push('.....');
        output.push('Success rate is 0 percent (0/5) - Destination Host Unreachable');
        return {
          output,
          newSession,
          pingAnimation: { targetIp, targetNodeId: '', success: false },
        };
      }
    }

    // traceroute <ip>
    if (lowerCmd.startsWith('traceroute ') || lowerCmd.startsWith('tracert ')) {
      const targetIp = cmd.split(' ')[1]?.trim();
      if (!targetIp) return { output: ['% Incomplete command.'], newSession };

      output.push(`Type escape sequence to abort.`);
      output.push(`Tracing the route to ${targetIp}`);
      output.push('VRF info: (vrf in name/id, ns id, flags)');
      output.push(`  1 10.10.20.1 (HSRP Gateway) 1 msec 1 msec 1 msec`);
      output.push(`  2 10.0.2.1 (HQ-CORE-SW01) 2 msec 1 msec 2 msec`);
      output.push(`  3 10.0.1.2 (HQ-EDGE-R1) 3 msec 2 msec 3 msec`);
      if (targetIp.startsWith('10.100')) {
        output.push(`  4 10.254.0.2 (DC-CORE-GW01) 4 msec 3 msec 4 msec`);
        output.push(`  5 ${targetIp} 5 msec 4 msec 5 msec`);
      } else if (targetIp.startsWith('10.20.50')) {
        output.push(`  4 198.51.100.2 (BRANCH-WEST-R1) 18 msec 17 msec 18 msec`);
        output.push(`  5 ${targetIp} 19 msec 18 msec 19 msec`);
      } else {
        output.push(`  4 ${targetIp} 4 msec 3 msec 4 msec`);
      }
      return { output, newSession };
    }

    // write memory
    if (lowerCmd === 'write memory' || lowerCmd === 'wr' || lowerCmd === 'copy run start') {
      output.push('Building configuration...');
      output.push('[OK]');
      return { output, newSession };
    }

    // Unrecognized
    output.push(`% Invalid input detected at '^' marker.`);
    return { output, newSession };
  }
}
