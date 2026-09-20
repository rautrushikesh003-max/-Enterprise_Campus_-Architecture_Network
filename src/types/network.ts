export type LayerType = 'wan' | 'core' | 'distribution' | 'access' | 'datacenter' | 'branch';
export type DeviceType = 'router' | 'core-switch' | 'dist-switch' | 'access-switch' | 'server' | 'host' | 'attacker';
export type DeviceStatus = 'up' | 'down' | 'degraded' | 'err-disabled';
export type LinkType = 'fiber-40g' | 'fiber-10g' | 'copper-1g' | 'wan-serial';
export type LinkStatus = 'up' | 'down' | 'stp-blocked';

export type StpPortRole = 'Root' | 'Designated' | 'Alternate' | 'Backup' | 'Disabled';
export type StpPortState = 'Forwarding' | 'Blocking' | 'Learning' | 'Listening' | 'Disabled';

export interface DeviceInterface {
  id: string;
  name: string; // e.g. GigabitEthernet0/1
  ip?: string;
  subnetMask?: string;
  mac: string;
  status: 'up' | 'down' | 'err-disabled';
  mode: 'access' | 'trunk' | 'routed';
  accessVlan?: number;
  trunkAllowedVlans?: number[];
  nativeVlan?: number;
  stpRole?: StpPortRole;
  stpState?: StpPortState;
  dhcpSnoopingTrusted?: boolean;
  portSecurity?: {
    enabled: boolean;
    maxMac: number;
    violation: 'shutdown' | 'restrict' | 'protect';
    learnedMacs: string[];
    violationCount: number;
  };
  connectedTo?: {
    deviceId: string;
    interfaceId: string;
    linkId: string;
  };
}

export interface RouteEntry {
  prefix: string; // e.g. "10.10.20.0/24"
  nextHop: string; // e.g. "10.10.1.2" or "Directly Connected"
  interface: string; // e.g. "GigabitEthernet0/1" or "Vlan10"
  metric: number;
  protocol: 'C' | 'S' | 'O' | 'O_IA' | 'B'; // Connected, Static, OSPF Intra, OSPF Inter-Area, BGP
  adminDistance: number;
}

export interface OspfNeighbor {
  neighborId: string; // e.g. "1.1.1.1"
  deviceId: string;
  ip: string;
  interface: string;
  state: 'FULL/DR' | 'FULL/BDR' | 'FULL/DROTHER' | '2WAY' | 'INIT' | 'DOWN';
  area: number;
  deadTime: number;
}

export interface HsrpGroup {
  group: number; // e.g. 10
  vlanId: number;
  virtualIp: string;
  virtualMac: string;
  priority: number;
  preempt: boolean;
  state: 'Active' | 'Standby' | 'Listen' | 'Init';
  activeRouter: string;
  standbyRouter: string;
  helloTimer: number;
  holdTimer: number;
}

export interface StpConfig {
  enabled: boolean;
  priority: number; // e.g. 32768, 24576, 28672
  isRootBridge: boolean;
  rootBridgeId: string;
  rootCost: number;
}

export interface DhcpBinding {
  mac: string;
  ip: string;
  leaseTimeSec: number;
  type: 'dhcp-snooping';
  vlan: number;
  interface: string;
  timestamp: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  hostname: string;
  type: DeviceType;
  layer: LayerType;
  x: number;
  y: number;
  status: DeviceStatus;
  mac: string;
  managementIp?: string;
  defaultGateway?: string;
  vlanId?: number; // for end hosts
  interfaces: DeviceInterface[];
  routingTable: RouteEntry[];
  ospf?: {
    enabled: boolean;
    processId: number;
    routerId: string;
    area: number;
    neighbors: OspfNeighbor[];
  };
  hsrp?: HsrpGroup[];
  stp?: StpConfig;
  dhcpSnooping?: {
    enabled: boolean;
    vlans: number[];
  };
  dai?: {
    enabled: boolean;
    vlans: number[];
    inspectedPackets: number;
    droppedPackets: number;
  };
  runningConfig: string;
  uptimeSeconds: number;
}

export interface NetworkLink {
  id: string;
  sourceNodeId: string;
  sourceInterfaceId: string;
  targetNodeId: string;
  targetInterfaceId: string;
  type: LinkType;
  status: LinkStatus;
  bandwidthMbps: number;
  cost: number;
  isVlanTrunk: boolean;
  allowedVlans?: number[];
  lossRate: number; // 0.0 to 1.0
  latencyMs: number;
}

export type PacketProtocol = 
  | 'ICMP_ECHO' 
  | 'ICMP_REPLY' 
  | 'OSPF_HELLO' 
  | 'STP_BPDU' 
  | 'HSRP_HELLO' 
  | 'DHCP_DISCOVER' 
  | 'DHCP_OFFER' 
  | 'DHCP_REQUEST' 
  | 'DHCP_ACK' 
  | 'ARP_REQUEST' 
  | 'ARP_REPLY'
  | 'ROGUE_DHCP_OFFER'
  | 'SPOOFED_ARP';

export interface OsiLayerInfo {
  layer: number;
  name: string;
  headerDetails: string;
  status: 'valid' | 'warning' | 'rejected' | 'processed';
  explanation: string;
}

export interface ActivePacket {
  id: string;
  protocol: PacketProtocol;
  sourceNodeId: string;
  targetNodeId: string;
  finalDestinationIp: string;
  sourceIp: string;
  currentHopIndex: number;
  pathNodeIds: string[];
  pathLinkIds: string[];
  progress: number; // 0 to 1 along current hop
  speed: number;
  status: 'in-transit' | 'delivered' | 'dropped';
  dropReason?: string;
  droppedAtNodeId?: string;
  osiDetails: OsiLayerInfo[];
  timestamp: number;
  payloadDescription: string;
}

export interface VlanDefinition {
  id: number;
  name: string;
  subnet: string;
  gateway: string;
  color: string;
  description: string;
  department: string;
}

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  interfaceName?: string;
  type: 'PORT_SECURITY' | 'DHCP_SNOOPING' | 'DAI' | 'OSPF' | 'HSRP' | 'STP' | 'TRAFFIC';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
}

export interface SimulationScenario {
  id: string;
  title: string;
  category: 'OSPF' | 'HSRP' | 'STP' | 'DHCP_SNOOPING' | 'DAI' | 'PORT_SECURITY';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  objective: string;
  initialStateDescription: string;
  steps: string[];
  expectedResult: string;
  verificationCmd: string;
  isCompleted?: boolean;
}
