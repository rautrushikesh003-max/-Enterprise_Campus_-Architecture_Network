import { NetworkNode, NetworkLink, VlanDefinition, SimulationScenario, DhcpBinding } from '../types/network';

export const INITIAL_VLANS: VlanDefinition[] = [
  { id: 10, name: 'MGMT-IT', subnet: '10.10.10.0/24', gateway: '10.10.10.1', color: '#6366f1', description: 'Network Management & IT Infrastructure', department: 'IT Operations' },
  { id: 20, name: 'ENGINEERING', subnet: '10.10.20.0/24', gateway: '10.10.20.1', color: '#06b6d4', description: 'Software & DevOps Engineering VLAN', department: 'Engineering' },
  { id: 30, name: 'HR-FINANCE', subnet: '10.10.30.0/24', gateway: '10.10.30.1', color: '#10b981', description: 'Human Resources & Finance Department', department: 'Corporate' },
  { id: 40, name: 'GUEST-IOT', subnet: '10.10.40.0/24', gateway: '10.10.40.1', color: '#f59e0b', description: 'Restricted Guest WiFi and IoT Sensors', department: 'Visitors / IoT' },
  { id: 50, name: 'BRANCH-SALES', subnet: '10.20.50.0/24', gateway: '10.20.50.1', color: '#ec4899', description: 'Branch Office Sales Subnet', department: 'Regional Sales' },
  { id: 99, name: 'NATIVE-PARKING', subnet: '10.99.99.0/24', gateway: '10.99.99.1', color: '#64748b', description: '802.1Q Native VLAN & Blackhole', department: 'Security' },
  { id: 100, name: 'SERVER-FARM', subnet: '10.100.100.0/24', gateway: '10.100.100.1', color: '#8b5cf6', description: 'Enterprise Data Center Server Farm', department: 'Data Center' },
];

export const INITIAL_DHCP_BINDINGS: DhcpBinding[] = [
  { mac: '00:1B:44:11:3A:01', ip: '10.10.20.15', leaseTimeSec: 86400, type: 'dhcp-snooping', vlan: 20, interface: 'Gi0/1', timestamp: '2026-08-22 08:30:00' },
  { mac: '00:1B:44:11:3A:02', ip: '10.10.20.16', leaseTimeSec: 86400, type: 'dhcp-snooping', vlan: 20, interface: 'Gi0/2', timestamp: '2026-08-22 08:31:12' },
  { mac: '00:1B:44:22:8C:01', ip: '10.10.30.12', leaseTimeSec: 86400, type: 'dhcp-snooping', vlan: 30, interface: 'Gi0/1', timestamp: '2026-08-22 08:45:00' },
  { mac: '00:1B:44:33:FF:01', ip: '10.10.10.5', leaseTimeSec: 86400, type: 'dhcp-snooping', vlan: 10, interface: 'Gi0/1', timestamp: '2026-08-22 08:15:20' },
  { mac: '00:50:56:A1:00:02', ip: '10.100.100.2', leaseTimeSec: 604800, type: 'dhcp-snooping', vlan: 100, interface: 'Gi0/1', timestamp: 'Static' },
  { mac: '00:50:56:A1:00:10', ip: '10.100.100.10', leaseTimeSec: 604800, type: 'dhcp-snooping', vlan: 100, interface: 'Gi0/2', timestamp: 'Static' },
];

export const INITIAL_NODES: NetworkNode[] = [
  // ==================== CORE LAYER ====================
  {
    id: 'core-sw-01',
    name: 'Core Switch 01 (HQ)',
    hostname: 'HQ-CORE-SW01',
    type: 'core-switch',
    layer: 'core',
    x: 420,
    y: 190,
    status: 'up',
    mac: '00:0A:F3:01:00:01',
    managementIp: '10.10.10.251',
    uptimeSeconds: 784200,
    interfaces: [
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0A:F3:01:00:01', ip: '10.0.1.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'hq-edge-r1', interfaceId: 'g0/1', linkId: 'link-core1-edge' } },
      { id: 'g0/2', name: 'Gi0/2', mac: '00:0A:F3:01:00:02', ip: '10.0.0.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-02', interfaceId: 'g0/2', linkId: 'link-core1-core2' } },
      { id: 'g0/3', name: 'Gi0/3', mac: '00:0A:F3:01:00:03', ip: '10.0.2.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'dist-sw-01', interfaceId: 'g0/1', linkId: 'link-core1-dist1' } },
      { id: 'g0/4', name: 'Gi0/4', mac: '00:0A:F3:01:00:04', ip: '10.0.3.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'dist-sw-02', interfaceId: 'g0/1', linkId: 'link-core1-dist2' } },
    ],
    routingTable: [
      { prefix: '10.0.0.0/30', nextHop: 'Directly Connected', interface: 'Gi0/2', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.1.0/30', nextHop: 'Directly Connected', interface: 'Gi0/1', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.2.0/30', nextHop: 'Directly Connected', interface: 'Gi0/3', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.3.0/30', nextHop: 'Directly Connected', interface: 'Gi0/4', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.10.0/24', nextHop: '10.0.2.2', interface: 'Gi0/3', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.20.0/24', nextHop: '10.0.2.2', interface: 'Gi0/3', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.30.0/24', nextHop: '10.0.3.2', interface: 'Gi0/4', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.40.0/24', nextHop: '10.0.3.2', interface: 'Gi0/4', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.100.100.0/24', nextHop: '10.0.1.2', interface: 'Gi0/1', metric: 20, protocol: 'O_IA', adminDistance: 110 },
      { prefix: '10.20.50.0/24', nextHop: '10.0.1.2', interface: 'Gi0/1', metric: 30, protocol: 'O_IA', adminDistance: 110 },
      { prefix: '0.0.0.0/0', nextHop: '10.0.1.2', interface: 'Gi0/1', metric: 1, protocol: 'O', adminDistance: 110 },
    ],
    ospf: {
      enabled: true,
      processId: 1,
      routerId: '1.1.1.1',
      area: 0,
      neighbors: [
        { neighborId: '0.0.0.1', deviceId: 'hq-edge-r1', ip: '10.0.1.2', interface: 'Gi0/1', state: 'FULL/DR', area: 0, deadTime: 36 },
        { neighborId: '1.1.1.2', deviceId: 'core-sw-02', ip: '10.0.0.2', interface: 'Gi0/2', state: 'FULL/BDR', area: 0, deadTime: 38 },
        { neighborId: '2.2.2.1', deviceId: 'dist-sw-01', ip: '10.0.2.2', interface: 'Gi0/3', state: 'FULL/DR', area: 0, deadTime: 37 },
        { neighborId: '2.2.2.2', deviceId: 'dist-sw-02', ip: '10.0.3.2', interface: 'Gi0/4', state: 'FULL/DR', area: 0, deadTime: 39 },
      ],
    },
    runningConfig: `hostname HQ-CORE-SW01
!
ip routing
!
interface GigabitEthernet0/1
 description UPLINK-TO-EDGE-R1
 no switchport
 ip address 10.0.1.1 255.255.255.252
 ip ospf 1 area 0
 ip ospf cost 1
!
interface GigabitEthernet0/2
 description CORE-INTERCONNECT-40G
 no switchport
 ip address 10.0.0.1 255.255.255.252
 ip ospf 1 area 0
 ip ospf cost 1
!
interface GigabitEthernet0/3
 description DOWNLINK-TO-DIST-SW01
 no switchport
 ip address 10.0.2.1 255.255.255.252
 ip ospf 1 area 0
 ip ospf cost 5
!
interface GigabitEthernet0/4
 description DOWNLINK-TO-DIST-SW02
 no switchport
 ip address 10.0.3.1 255.255.255.252
 ip ospf 1 area 0
 ip ospf cost 5
!
router ospf 1
 router-id 1.1.1.1
 log-adjacency-changes
!`,
  },
  {
    id: 'core-sw-02',
    name: 'Core Switch 02 (HQ Redundant)',
    hostname: 'HQ-CORE-SW02',
    type: 'core-switch',
    layer: 'core',
    x: 640,
    y: 190,
    status: 'up',
    mac: '00:0A:F3:01:00:02',
    managementIp: '10.10.10.252',
    uptimeSeconds: 784200,
    interfaces: [
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0A:F3:01:00:11', ip: '10.0.1.5', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'hq-edge-r1', interfaceId: 'g0/2', linkId: 'link-core2-edge' } },
      { id: 'g0/2', name: 'Gi0/2', mac: '00:0A:F3:01:00:12', ip: '10.0.0.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-01', interfaceId: 'g0/2', linkId: 'link-core1-core2' } },
      { id: 'g0/3', name: 'Gi0/3', mac: '00:0A:F3:01:00:13', ip: '10.0.4.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'dist-sw-01', interfaceId: 'g0/2', linkId: 'link-core2-dist1' } },
      { id: 'g0/4', name: 'Gi0/4', mac: '00:0A:F3:01:00:14', ip: '10.0.5.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'dist-sw-02', interfaceId: 'g0/2', linkId: 'link-core2-dist2' } },
    ],
    routingTable: [
      { prefix: '10.0.0.0/30', nextHop: 'Directly Connected', interface: 'Gi0/2', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.1.4/30', nextHop: 'Directly Connected', interface: 'Gi0/1', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.4.0/30', nextHop: 'Directly Connected', interface: 'Gi0/3', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.5.0/30', nextHop: 'Directly Connected', interface: 'Gi0/4', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.10.0/24', nextHop: '10.0.4.2', interface: 'Gi0/3', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.20.0/24', nextHop: '10.0.4.2', interface: 'Gi0/3', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.30.0/24', nextHop: '10.0.5.2', interface: 'Gi0/4', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.40.0/24', nextHop: '10.0.5.2', interface: 'Gi0/4', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '0.0.0.0/0', nextHop: '10.0.1.6', interface: 'Gi0/1', metric: 1, protocol: 'O', adminDistance: 110 },
    ],
    ospf: {
      enabled: true,
      processId: 1,
      routerId: '1.1.1.2',
      area: 0,
      neighbors: [
        { neighborId: '0.0.0.1', deviceId: 'hq-edge-r1', ip: '10.0.1.6', interface: 'Gi0/1', state: 'FULL/BDR', area: 0, deadTime: 35 },
        { neighborId: '1.1.1.1', deviceId: 'core-sw-01', ip: '10.0.0.1', interface: 'Gi0/2', state: 'FULL/DR', area: 0, deadTime: 38 },
        { neighborId: '2.2.2.1', deviceId: 'dist-sw-01', ip: '10.0.4.2', interface: 'Gi0/3', state: 'FULL/BDR', area: 0, deadTime: 37 },
        { neighborId: '2.2.2.2', deviceId: 'dist-sw-02', ip: '10.0.5.2', interface: 'Gi0/4', state: 'FULL/BDR', area: 0, deadTime: 39 },
      ],
    },
    runningConfig: `hostname HQ-CORE-SW02
!
ip routing
!
router ospf 1
 router-id 1.1.1.2
!`,
  },

  // ==================== DISTRIBUTION LAYER ====================
  {
    id: 'dist-sw-01',
    name: 'Distribution Switch 01 (HQ)',
    hostname: 'HQ-DIST-SW01',
    type: 'dist-switch',
    layer: 'distribution',
    x: 360,
    y: 330,
    status: 'up',
    mac: '00:0A:F3:02:00:01',
    managementIp: '10.10.10.2',
    uptimeSeconds: 784200,
    interfaces: [
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0A:F3:02:00:01', ip: '10.0.2.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-01', interfaceId: 'g0/3', linkId: 'link-core1-dist1' } },
      { id: 'g0/2', name: 'Gi0/2', mac: '00:0A:F3:02:00:02', ip: '10.0.4.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-02', interfaceId: 'g0/3', linkId: 'link-core2-dist1' } },
      { id: 'g0/3', name: 'Gi0/3', mac: '00:0A:F3:02:00:03', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 20, 30, 40, 99], nativeVlan: 99, stpRole: 'Designated', stpState: 'Forwarding', connectedTo: { deviceId: 'dist-sw-02', interfaceId: 'g0/3', linkId: 'link-dist1-dist2' } },
      { id: 'g0/4', name: 'Gi0/4', mac: '00:0A:F3:02:00:04', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 20, 99], nativeVlan: 99, stpRole: 'Designated', stpState: 'Forwarding', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'acc-sw-eng', interfaceId: 'g0/23', linkId: 'link-dist1-acceng' } },
      { id: 'g0/5', name: 'Gi0/5', mac: '00:0A:F3:02:00:05', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 30, 99], nativeVlan: 99, stpRole: 'Designated', stpState: 'Forwarding', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'acc-sw-hr', interfaceId: 'g0/23', linkId: 'link-dist1-acchr' } },
      { id: 'vlan10', name: 'Vlan10', mac: '00:00:0C:07:AC:0A', ip: '10.10.10.2', subnetMask: '255.255.255.0', status: 'up', mode: 'routed' },
      { id: 'vlan20', name: 'Vlan20', mac: '00:00:0C:07:AC:14', ip: '10.10.20.2', subnetMask: '255.255.255.0', status: 'up', mode: 'routed' },
      { id: 'vlan30', name: 'Vlan30', mac: '00:00:0C:07:AC:1E', ip: '10.10.30.2', subnetMask: '255.255.255.0', status: 'up', mode: 'routed' },
    ],
    routingTable: [
      { prefix: '10.10.10.0/24', nextHop: 'Directly Connected', interface: 'Vlan10', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.20.0/24', nextHop: 'Directly Connected', interface: 'Vlan20', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.30.0/24', nextHop: 'Directly Connected', interface: 'Vlan30', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.2.0/30', nextHop: 'Directly Connected', interface: 'Gi0/1', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.4.0/30', nextHop: 'Directly Connected', interface: 'Gi0/2', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.100.100.0/24', nextHop: '10.0.2.1', interface: 'Gi0/1', metric: 15, protocol: 'O', adminDistance: 110 },
      { prefix: '10.20.50.0/24', nextHop: '10.0.2.1', interface: 'Gi0/1', metric: 25, protocol: 'O', adminDistance: 110 },
      { prefix: '0.0.0.0/0', nextHop: '10.0.2.1', interface: 'Gi0/1', metric: 5, protocol: 'O', adminDistance: 110 },
    ],
    ospf: {
      enabled: true,
      processId: 1,
      routerId: '2.2.2.1',
      area: 0,
      neighbors: [
        { neighborId: '1.1.1.1', deviceId: 'core-sw-01', ip: '10.0.2.1', interface: 'Gi0/1', state: 'FULL/DR', area: 0, deadTime: 38 },
        { neighborId: '1.1.1.2', deviceId: 'core-sw-02', ip: '10.0.4.1', interface: 'Gi0/2', state: 'FULL/BDR', area: 0, deadTime: 37 },
      ],
    },
    hsrp: [
      { group: 10, vlanId: 10, virtualIp: '10.10.10.1', virtualMac: '00:00:0C:07:AC:0A', priority: 110, preempt: true, state: 'Active', activeRouter: 'HQ-DIST-SW01 (local)', standbyRouter: '10.10.10.3', helloTimer: 3, holdTimer: 10 },
      { group: 20, vlanId: 20, virtualIp: '10.10.20.1', virtualMac: '00:00:0C:07:AC:14', priority: 110, preempt: true, state: 'Active', activeRouter: 'HQ-DIST-SW01 (local)', standbyRouter: '10.10.20.3', helloTimer: 3, holdTimer: 10 },
      { group: 30, vlanId: 30, virtualIp: '10.10.30.1', virtualMac: '00:00:0C:07:AC:1E', priority: 90, preempt: true, state: 'Standby', activeRouter: '10.10.30.3', standbyRouter: 'HQ-DIST-SW01 (local)', helloTimer: 3, holdTimer: 10 },
    ],
    stp: {
      enabled: true,
      priority: 24576, // Lower priority -> Root Bridge for VLAN 10/20
      isRootBridge: true,
      rootBridgeId: '24576.000A.F302.0001',
      rootCost: 0,
    },
    runningConfig: `hostname HQ-DIST-SW01
!
ip routing
!
vlan 10,20,30,40,99
!
interface Vlan10
 ip address 10.10.10.2 255.255.255.0
 standby 10 ip 10.10.10.1
 standby 10 priority 110
 standby 10 preempt
!
interface Vlan20
 ip address 10.10.20.2 255.255.255.0
 standby 20 ip 10.10.20.1
 standby 20 priority 110
 standby 20 preempt
!
interface Vlan30
 ip address 10.10.30.2 255.255.255.0
 standby 30 ip 10.10.30.1
 standby 30 priority 90
 standby 30 preempt
!
spanning-tree vlan 10,20 root primary
!
router ospf 1
 router-id 2.2.2.1
 network 10.0.2.0 0.0.0.3 area 0
 network 10.0.4.0 0.0.0.3 area 0
 network 10.10.10.0 0.0.0.255 area 1
 network 10.10.20.0 0.0.0.255 area 1
 network 10.10.30.0 0.0.0.255 area 1
!`,
  },
  {
    id: 'dist-sw-02',
    name: 'Distribution Switch 02 (HQ)',
    hostname: 'HQ-DIST-SW02',
    type: 'dist-switch',
    layer: 'distribution',
    x: 700,
    y: 330,
    status: 'up',
    mac: '00:0A:F3:02:00:02',
    managementIp: '10.10.10.3',
    uptimeSeconds: 784200,
    interfaces: [
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0A:F3:02:00:11', ip: '10.0.3.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-01', interfaceId: 'g0/4', linkId: 'link-core1-dist2' } },
      { id: 'g0/2', name: 'Gi0/2', mac: '00:0A:F3:02:00:12', ip: '10.0.5.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-02', interfaceId: 'g0/4', linkId: 'link-core2-dist2' } },
      { id: 'g0/3', name: 'Gi0/3', mac: '00:0A:F3:02:00:13', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 20, 30, 40, 99], nativeVlan: 99, stpRole: 'Designated', stpState: 'Forwarding', connectedTo: { deviceId: 'dist-sw-01', interfaceId: 'g0/3', linkId: 'link-dist1-dist2' } },
      { id: 'g0/4', name: 'Gi0/4', mac: '00:0A:F3:02:00:14', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 20, 99], nativeVlan: 99, stpRole: 'Designated', stpState: 'Forwarding', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'acc-sw-eng', interfaceId: 'g0/24', linkId: 'link-dist2-acceng' } },
      { id: 'g0/5', name: 'Gi0/5', mac: '00:0A:F3:02:00:15', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 30, 99], nativeVlan: 99, stpRole: 'Designated', stpState: 'Forwarding', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'acc-sw-hr', interfaceId: 'g0/24', linkId: 'link-dist2-acchr' } },
      { id: 'vlan10', name: 'Vlan10', mac: '00:00:0C:07:AC:0A', ip: '10.10.10.3', subnetMask: '255.255.255.0', status: 'up', mode: 'routed' },
      { id: 'vlan20', name: 'Vlan20', mac: '00:00:0C:07:AC:14', ip: '10.10.20.3', subnetMask: '255.255.255.0', status: 'up', mode: 'routed' },
      { id: 'vlan30', name: 'Vlan30', mac: '00:00:0C:07:AC:1E', ip: '10.10.30.3', subnetMask: '255.255.255.0', status: 'up', mode: 'routed' },
    ],
    routingTable: [
      { prefix: '10.10.10.0/24', nextHop: 'Directly Connected', interface: 'Vlan10', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.20.0/24', nextHop: 'Directly Connected', interface: 'Vlan20', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.30.0/24', nextHop: 'Directly Connected', interface: 'Vlan30', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.3.0/30', nextHop: 'Directly Connected', interface: 'Gi0/1', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.5.0/30', nextHop: 'Directly Connected', interface: 'Gi0/2', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.100.100.0/24', nextHop: '10.0.3.1', interface: 'Gi0/1', metric: 15, protocol: 'O', adminDistance: 110 },
      { prefix: '0.0.0.0/0', nextHop: '10.0.3.1', interface: 'Gi0/1', metric: 5, protocol: 'O', adminDistance: 110 },
    ],
    ospf: {
      enabled: true,
      processId: 1,
      routerId: '2.2.2.2',
      area: 0,
      neighbors: [
        { neighborId: '1.1.1.1', deviceId: 'core-sw-01', ip: '10.0.3.1', interface: 'Gi0/1', state: 'FULL/DR', area: 0, deadTime: 38 },
        { neighborId: '1.1.1.2', deviceId: 'core-sw-02', ip: '10.0.5.1', interface: 'Gi0/2', state: 'FULL/BDR', area: 0, deadTime: 36 },
      ],
    },
    hsrp: [
      { group: 10, vlanId: 10, virtualIp: '10.10.10.1', virtualMac: '00:00:0C:07:AC:0A', priority: 90, preempt: true, state: 'Standby', activeRouter: '10.10.10.2', standbyRouter: 'HQ-DIST-SW02 (local)', helloTimer: 3, holdTimer: 10 },
      { group: 20, vlanId: 20, virtualIp: '10.10.20.1', virtualMac: '00:00:0C:07:AC:14', priority: 90, preempt: true, state: 'Standby', activeRouter: '10.10.20.2', standbyRouter: 'HQ-DIST-SW02 (local)', helloTimer: 3, holdTimer: 10 },
      { group: 30, vlanId: 30, virtualIp: '10.10.30.1', virtualMac: '00:00:0C:07:AC:1E', priority: 110, preempt: true, state: 'Active', activeRouter: 'HQ-DIST-SW02 (local)', standbyRouter: '10.10.30.2', helloTimer: 3, holdTimer: 10 },
    ],
    stp: {
      enabled: true,
      priority: 28672, // Root for VLAN 30/40
      isRootBridge: false,
      rootBridgeId: '24576.000A.F302.0001',
      rootCost: 4,
    },
    runningConfig: `hostname HQ-DIST-SW02
!
ip routing
!
vlan 10,20,30,40,99
!
interface Vlan10
 ip address 10.10.10.3 255.255.255.0
 standby 10 ip 10.10.10.1
 standby 10 priority 90
 standby 10 preempt
!
interface Vlan20
 ip address 10.10.20.3 255.255.255.0
 standby 20 ip 10.10.20.1
 standby 20 priority 90
 standby 20 preempt
!
interface Vlan30
 ip address 10.10.30.3 255.255.255.0
 standby 30 ip 10.10.30.1
 standby 30 priority 110
 standby 30 preempt
!
spanning-tree vlan 30,40 root primary
!`,
  },

  // ==================== ACCESS LAYER ====================
  {
    id: 'acc-sw-eng',
    name: 'Access Switch - Engineering',
    hostname: 'HQ-ACC-SW-ENG',
    type: 'access-switch',
    layer: 'access',
    x: 280,
    y: 490,
    status: 'up',
    mac: '00:0A:F3:03:00:01',
    managementIp: '10.10.10.11',
    uptimeSeconds: 784200,
    interfaces: [
      { id: 'g0/23', name: 'Gi0/23', mac: '00:0A:F3:03:00:23', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 20, 99], nativeVlan: 99, stpRole: 'Root', stpState: 'Forwarding', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'dist-sw-01', interfaceId: 'g0/4', linkId: 'link-dist1-acceng' } },
      { id: 'g0/24', name: 'Gi0/24', mac: '00:0A:F3:03:00:24', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 20, 99], nativeVlan: 99, stpRole: 'Alternate', stpState: 'Blocking', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'dist-sw-02', interfaceId: 'g0/4', linkId: 'link-dist2-acceng' } },
      {
        id: 'g0/1',
        name: 'Gi0/1',
        mac: '00:0A:F3:03:00:01',
        status: 'up',
        mode: 'access',
        accessVlan: 20,
        stpRole: 'Designated',
        stpState: 'Forwarding',
        dhcpSnoopingTrusted: false,
        portSecurity: { enabled: true, maxMac: 1, violation: 'shutdown', learnedMacs: ['00:1B:44:11:3A:01'], violationCount: 0 },
        connectedTo: { deviceId: 'pc-eng-01', interfaceId: 'eth0', linkId: 'link-acceng-pc1' },
      },
      {
        id: 'g0/2',
        name: 'Gi0/2',
        mac: '00:0A:F3:03:00:02',
        status: 'up',
        mode: 'access',
        accessVlan: 20,
        stpRole: 'Designated',
        stpState: 'Forwarding',
        dhcpSnoopingTrusted: false,
        portSecurity: { enabled: true, maxMac: 1, violation: 'restrict', learnedMacs: ['00:1B:44:11:3A:02'], violationCount: 0 },
        connectedTo: { deviceId: 'pc-eng-02', interfaceId: 'eth0', linkId: 'link-acceng-pc2' },
      },
      {
        id: 'g0/3',
        name: 'Gi0/3',
        mac: '00:0A:F3:03:00:03',
        status: 'up',
        mode: 'access',
        accessVlan: 20,
        stpRole: 'Designated',
        stpState: 'Forwarding',
        dhcpSnoopingTrusted: false,
        portSecurity: { enabled: true, maxMac: 1, violation: 'shutdown', learnedMacs: [], violationCount: 0 },
      },
    ],
    stp: {
      enabled: true,
      priority: 32768,
      isRootBridge: false,
      rootBridgeId: '24576.000A.F302.0001',
      rootCost: 4,
    },
    dhcpSnooping: {
      enabled: true,
      vlans: [10, 20],
    },
    dai: {
      enabled: true,
      vlans: [20],
      inspectedPackets: 1420,
      droppedPackets: 0,
    },
    routingTable: [],
    runningConfig: `hostname HQ-ACC-SW-ENG
!
ip dhcp snooping
ip dhcp snooping vlan 20
ip arp inspection vlan 20
!
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 20
 switchport port-security
 switchport port-security maximum 1
 switchport port-security violation shutdown
 switchport port-security mac-address sticky
 spanning-tree portfast
!
interface GigabitEthernet0/23
 description UPLINK-TO-DIST-01
 switchport mode trunk
 switchport trunk allowed vlan 10,20,99
 ip dhcp snooping trust
 ip arp inspection trust
!
interface GigabitEthernet0/24
 description REDUNDANT-UPLINK-TO-DIST-02
 switchport mode trunk
 switchport trunk allowed vlan 10,20,99
 ip dhcp snooping trust
 ip arp inspection trust
!`,
  },
  {
    id: 'acc-sw-hr',
    name: 'Access Switch - HR & Finance',
    hostname: 'HQ-ACC-SW-HR',
    type: 'access-switch',
    layer: 'access',
    x: 620,
    y: 490,
    status: 'up',
    mac: '00:0A:F3:03:00:02',
    managementIp: '10.10.10.12',
    uptimeSeconds: 784200,
    interfaces: [
      { id: 'g0/23', name: 'Gi0/23', mac: '00:0A:F3:03:00:25', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 30, 99], nativeVlan: 99, stpRole: 'Alternate', stpState: 'Blocking', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'dist-sw-01', interfaceId: 'g0/5', linkId: 'link-dist1-acchr' } },
      { id: 'g0/24', name: 'Gi0/24', mac: '00:0A:F3:03:00:26', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 30, 99], nativeVlan: 99, stpRole: 'Root', stpState: 'Forwarding', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'dist-sw-02', interfaceId: 'g0/5', linkId: 'link-dist2-acchr' } },
      {
        id: 'g0/1',
        name: 'Gi0/1',
        mac: '00:0A:F3:03:00:31',
        status: 'up',
        mode: 'access',
        accessVlan: 30,
        stpRole: 'Designated',
        stpState: 'Forwarding',
        dhcpSnoopingTrusted: false,
        portSecurity: { enabled: true, maxMac: 1, violation: 'shutdown', learnedMacs: ['00:1B:44:22:8C:01'], violationCount: 0 },
        connectedTo: { deviceId: 'pc-hr-01', interfaceId: 'eth0', linkId: 'link-acchr-pc1' },
      },
    ],
    stp: {
      enabled: true,
      priority: 32768,
      isRootBridge: false,
      rootBridgeId: '28672.000A.F302.0002',
      rootCost: 4,
    },
    dhcpSnooping: {
      enabled: true,
      vlans: [10, 30],
    },
    dai: {
      enabled: true,
      vlans: [30],
      inspectedPackets: 890,
      droppedPackets: 0,
    },
    routingTable: [],
    runningConfig: `hostname HQ-ACC-SW-HR
!
ip dhcp snooping
ip dhcp snooping vlan 30
ip arp inspection vlan 30
!`,
  },
  {
    id: 'acc-sw-mgmt',
    name: 'Access Switch - IT Mgmt',
    hostname: 'HQ-ACC-SW-MGMT',
    type: 'access-switch',
    layer: 'access',
    x: 450,
    y: 490,
    status: 'up',
    mac: '00:0A:F3:03:00:03',
    managementIp: '10.10.10.10',
    uptimeSeconds: 784200,
    interfaces: [
      { id: 'g0/24', name: 'Gi0/24', mac: '00:0A:F3:03:00:41', status: 'up', mode: 'trunk', trunkAllowedVlans: [10, 99], nativeVlan: 99, stpRole: 'Root', stpState: 'Forwarding', dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'dist-sw-01', interfaceId: 'g0/5', linkId: 'link-dist1-accmgmt' } },
      {
        id: 'g0/1',
        name: 'Gi0/1',
        mac: '00:0A:F3:03:00:42',
        status: 'up',
        mode: 'access',
        accessVlan: 10,
        stpRole: 'Designated',
        stpState: 'Forwarding',
        dhcpSnoopingTrusted: false,
        portSecurity: { enabled: true, maxMac: 1, violation: 'shutdown', learnedMacs: ['00:1B:44:33:FF:01'], violationCount: 0 },
        connectedTo: { deviceId: 'pc-admin-01', interfaceId: 'eth0', linkId: 'link-accmgmt-admin' },
      },
    ],
    stp: { enabled: true, priority: 32768, isRootBridge: false, rootBridgeId: '24576.000A.F302.0001', rootCost: 4 },
    routingTable: [],
    runningConfig: `hostname HQ-ACC-SW-MGMT
!`,
  },

  // ==================== EDGE / WAN LAYER ====================
  {
    id: 'hq-edge-r1',
    name: 'HQ Border Router (WAN Gateway)',
    hostname: 'HQ-EDGE-R1',
    type: 'router',
    layer: 'wan',
    x: 530,
    y: 70,
    status: 'up',
    mac: '00:0A:F3:00:00:01',
    managementIp: '10.0.1.2',
    uptimeSeconds: 980100,
    interfaces: [
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0A:F3:00:00:01', ip: '10.0.1.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-01', interfaceId: 'g0/1', linkId: 'link-core1-edge' } },
      { id: 'g0/2', name: 'Gi0/2', mac: '00:0A:F3:00:00:02', ip: '10.0.1.6', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'core-sw-02', interfaceId: 'g0/1', linkId: 'link-core2-edge' } },
      { id: 's0/1/0', name: 'Se0/1/0', mac: '00:0A:F3:00:00:03', ip: '198.51.100.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'branch-r1', interfaceId: 's0/1/0', linkId: 'link-wan-branch' } },
      { id: 'g0/0', name: 'Gi0/0', mac: '00:0A:F3:00:00:04', ip: '10.254.0.1', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'dc-core-r1', interfaceId: 'g0/0', linkId: 'link-hq-dc' } },
    ],
    routingTable: [
      { prefix: '10.0.1.0/30', nextHop: 'Directly Connected', interface: 'Gi0/1', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.0.1.4/30', nextHop: 'Directly Connected', interface: 'Gi0/2', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '198.51.100.0/30', nextHop: 'Directly Connected', interface: 'Se0/1/0', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.254.0.0/30', nextHop: 'Directly Connected', interface: 'Gi0/0', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.10.0/24', nextHop: '10.0.1.1', interface: 'Gi0/1', metric: 11, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.20.0/24', nextHop: '10.0.1.1', interface: 'Gi0/1', metric: 11, protocol: 'O', adminDistance: 110 },
      { prefix: '10.10.30.0/24', nextHop: '10.0.1.5', interface: 'Gi0/2', metric: 11, protocol: 'O', adminDistance: 110 },
      { prefix: '10.100.100.0/24', nextHop: '10.254.0.2', interface: 'Gi0/0', metric: 10, protocol: 'O', adminDistance: 110 },
      { prefix: '10.20.50.0/24', nextHop: '198.51.100.2', interface: 'Se0/1/0', metric: 64, protocol: 'O_IA', adminDistance: 110 },
    ],
    ospf: {
      enabled: true,
      processId: 1,
      routerId: '0.0.0.1',
      area: 0,
      neighbors: [
        { neighborId: '1.1.1.1', deviceId: 'core-sw-01', ip: '10.0.1.1', interface: 'Gi0/1', state: 'FULL/BDR', area: 0, deadTime: 36 },
        { neighborId: '1.1.1.2', deviceId: 'core-sw-02', ip: '10.0.1.5', interface: 'Gi0/2', state: 'FULL/DR', area: 0, deadTime: 38 },
        { neighborId: '5.5.5.1', deviceId: 'branch-r1', ip: '198.51.100.2', interface: 'Se0/1/0', state: 'FULL/DROTHER', area: 2, deadTime: 34 },
        { neighborId: '10.100.0.1', deviceId: 'dc-core-r1', ip: '10.254.0.2', interface: 'Gi0/0', state: 'FULL/DR', area: 0, deadTime: 37 },
      ],
    },
    runningConfig: `hostname HQ-EDGE-R1
!
interface GigabitEthernet0/1
 ip address 10.0.1.2 255.255.255.252
 ip ospf 1 area 0
!
interface Serial0/1/0
 description WAN-TO-BRANCH-OFFICE
 ip address 198.51.100.1 255.255.255.252
 ip ospf 1 area 2
!
interface GigabitEthernet0/0
 description DEDICATED-FIBER-TO-DATACENTER
 ip address 10.254.0.1 255.255.255.252
 ip ospf 1 area 0
!
router ospf 1
 router-id 0.0.0.1
!`,
  },

  // ==================== BRANCH CAMPUS ====================
  {
    id: 'branch-r1',
    name: 'Branch Gateway Router',
    hostname: 'BRANCH-WEST-R1',
    type: 'router',
    layer: 'branch',
    x: 910,
    y: 100,
    status: 'up',
    mac: '00:0B:C2:00:00:01',
    managementIp: '198.51.100.2',
    uptimeSeconds: 560000,
    interfaces: [
      { id: 's0/1/0', name: 'Se0/1/0', mac: '00:0B:C2:00:00:01', ip: '198.51.100.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'hq-edge-r1', interfaceId: 's0/1/0', linkId: 'link-wan-branch' } },
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0B:C2:00:00:02', ip: '10.20.50.1', subnetMask: '255.255.255.0', status: 'up', mode: 'routed', connectedTo: { deviceId: 'branch-dist-01', interfaceId: 'g0/1', linkId: 'link-branch-r-sw' } },
    ],
    routingTable: [
      { prefix: '198.51.100.0/30', nextHop: 'Directly Connected', interface: 'Se0/1/0', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.20.50.0/24', nextHop: 'Directly Connected', interface: 'Gi0/1', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.0.0/16', nextHop: '198.51.100.1', interface: 'Se0/1/0', metric: 74, protocol: 'O_IA', adminDistance: 110 },
      { prefix: '10.100.100.0/24', nextHop: '198.51.100.1', interface: 'Se0/1/0', metric: 74, protocol: 'O_IA', adminDistance: 110 },
      { prefix: '0.0.0.0/0', nextHop: '198.51.100.1', interface: 'Se0/1/0', metric: 64, protocol: 'O', adminDistance: 110 },
    ],
    ospf: {
      enabled: true,
      processId: 1,
      routerId: '5.5.5.1',
      area: 2,
      neighbors: [
        { neighborId: '0.0.0.1', deviceId: 'hq-edge-r1', ip: '198.51.100.1', interface: 'Se0/1/0', state: 'FULL/DROTHER', area: 2, deadTime: 36 },
      ],
    },
    runningConfig: `hostname BRANCH-WEST-R1
!
router ospf 1
 router-id 5.5.5.1
 network 198.51.100.0 0.0.0.3 area 2
 network 10.20.50.0 0.0.0.255 area 2
!`,
  },
  {
    id: 'branch-dist-01',
    name: 'Branch Access Switch',
    hostname: 'BRANCH-ACC-SW01',
    type: 'access-switch',
    layer: 'branch',
    x: 910,
    y: 280,
    status: 'up',
    mac: '00:0B:C2:01:00:01',
    managementIp: '10.20.50.2',
    uptimeSeconds: 560000,
    interfaces: [
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0B:C2:01:00:01', status: 'up', mode: 'trunk', trunkAllowedVlans: [50], nativeVlan: 99, dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'branch-r1', interfaceId: 'g0/1', linkId: 'link-branch-r-sw' } },
      { id: 'g0/2', name: 'Gi0/2', mac: '00:0B:C2:01:00:02', status: 'up', mode: 'access', accessVlan: 50, portSecurity: { enabled: true, maxMac: 1, violation: 'shutdown', learnedMacs: ['00:1B:44:55:00:10'], violationCount: 0 }, connectedTo: { deviceId: 'branch-pc-01', interfaceId: 'eth0', linkId: 'link-branch-sw-pc' } },
    ],
    routingTable: [],
    runningConfig: `hostname BRANCH-ACC-SW01
!`,
  },

  // ==================== DATA CENTER & SERVER FARM ====================
  {
    id: 'dc-core-r1',
    name: 'Data Center Core Gateway',
    hostname: 'DC-CORE-GW01',
    type: 'router',
    layer: 'datacenter',
    x: 130,
    y: 100,
    status: 'up',
    mac: '00:0D:CC:00:00:01',
    managementIp: '10.254.0.2',
    uptimeSeconds: 1200000,
    interfaces: [
      { id: 'g0/0', name: 'Gi0/0', mac: '00:0D:CC:00:00:01', ip: '10.254.0.2', subnetMask: '255.255.255.252', status: 'up', mode: 'routed', connectedTo: { deviceId: 'hq-edge-r1', interfaceId: 'g0/0', linkId: 'link-hq-dc' } },
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0D:CC:00:00:02', ip: '10.100.100.1', subnetMask: '255.255.255.0', status: 'up', mode: 'routed', connectedTo: { deviceId: 'dc-switch-01', interfaceId: 'g0/24', linkId: 'link-dc-r-sw' } },
    ],
    routingTable: [
      { prefix: '10.254.0.0/30', nextHop: 'Directly Connected', interface: 'Gi0/0', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.100.100.0/24', nextHop: 'Directly Connected', interface: 'Gi0/1', metric: 0, protocol: 'C', adminDistance: 0 },
      { prefix: '10.10.0.0/16', nextHop: '10.254.0.1', interface: 'Gi0/0', metric: 11, protocol: 'O', adminDistance: 110 },
      { prefix: '10.20.50.0/24', nextHop: '10.254.0.1', interface: 'Gi0/0', metric: 75, protocol: 'O_IA', adminDistance: 110 },
    ],
    ospf: {
      enabled: true,
      processId: 1,
      routerId: '10.100.0.1',
      area: 0,
      neighbors: [
        { neighborId: '0.0.0.1', deviceId: 'hq-edge-r1', ip: '10.254.0.1', interface: 'Gi0/0', state: 'FULL/BDR', area: 0, deadTime: 38 },
      ],
    },
    runningConfig: `hostname DC-CORE-GW01
!
router ospf 1
 router-id 10.100.0.1
 network 10.254.0.0 0.0.0.3 area 0
 network 10.100.100.0 0.0.0.255 area 0
!`,
  },
  {
    id: 'dc-switch-01',
    name: 'DC Spine Switch (VLAN 100)',
    hostname: 'DC-SPINE-SW01',
    type: 'core-switch',
    layer: 'datacenter',
    x: 130,
    y: 280,
    status: 'up',
    mac: '00:0D:CC:01:00:01',
    managementIp: '10.100.100.250',
    uptimeSeconds: 1200000,
    interfaces: [
      { id: 'g0/24', name: 'Gi0/24', mac: '00:0D:CC:01:00:24', status: 'up', mode: 'trunk', trunkAllowedVlans: [100], nativeVlan: 99, dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'dc-core-r1', interfaceId: 'g0/1', linkId: 'link-dc-r-sw' } },
      { id: 'g0/1', name: 'Gi0/1', mac: '00:0D:CC:01:00:01', status: 'up', mode: 'access', accessVlan: 100, dhcpSnoopingTrusted: true, connectedTo: { deviceId: 'srv-dhcp-dns', interfaceId: 'eth0', linkId: 'link-dc-dhcp' } },
      { id: 'g0/2', name: 'Gi0/2', mac: '00:0D:CC:01:00:02', status: 'up', mode: 'access', accessVlan: 100, connectedTo: { deviceId: 'srv-webapp', interfaceId: 'eth0', linkId: 'link-dc-web' } },
      { id: 'g0/3', name: 'Gi0/3', mac: '00:0D:CC:01:00:03', status: 'up', mode: 'access', accessVlan: 100, connectedTo: { deviceId: 'srv-syslog', interfaceId: 'eth0', linkId: 'link-dc-syslog' } },
    ],
    routingTable: [],
    runningConfig: `hostname DC-SPINE-SW01
!
ip dhcp snooping
ip dhcp snooping vlan 100
!
interface GigabitEthernet0/1
 description ENTERPRISE-DHCP-DNS-SERVER
 switchport mode access
 switchport access vlan 100
 ip dhcp snooping trust
!`,
  },

  // ==================== END HOSTS & SERVERS ====================
  {
    id: 'pc-eng-01',
    name: 'PC-Eng-01 (Lead Dev)',
    hostname: 'WS-ENG-01',
    type: 'host',
    layer: 'access',
    x: 230,
    y: 620,
    status: 'up',
    mac: '00:1B:44:11:3A:01',
    managementIp: '10.10.20.15',
    defaultGateway: '10.10.20.1', // HSRP Virtual IP
    vlanId: 20,
    interfaces: [{ id: 'eth0', name: 'FastEthernet0', mac: '00:1B:44:11:3A:01', ip: '10.10.20.15', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'acc-sw-eng', interfaceId: 'g0/1', linkId: 'link-acceng-pc1' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.10.20.1', interface: 'FastEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `IP Configuration:
IP: 10.10.20.15
Subnet: 255.255.255.0
Gateway: 10.10.20.1 (HSRP VIP)
DNS: 10.100.100.2
DHCP: Enabled`,
    uptimeSeconds: 43200,
  },
  {
    id: 'pc-eng-02',
    name: 'PC-Eng-02 (DevOps)',
    hostname: 'WS-ENG-02',
    type: 'host',
    layer: 'access',
    x: 320,
    y: 620,
    status: 'up',
    mac: '00:1B:44:11:3A:02',
    managementIp: '10.10.20.16',
    defaultGateway: '10.10.20.1',
    vlanId: 20,
    interfaces: [{ id: 'eth0', name: 'FastEthernet0', mac: '00:1B:44:11:3A:02', ip: '10.10.20.16', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'acc-sw-eng', interfaceId: 'g0/2', linkId: 'link-acceng-pc2' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.10.20.1', interface: 'FastEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `IP Configuration:
IP: 10.10.20.16
Gateway: 10.10.20.1`,
    uptimeSeconds: 43200,
  },
  {
    id: 'pc-hr-01',
    name: 'PC-HR-01 (HR Manager)',
    hostname: 'WS-HR-01',
    type: 'host',
    layer: 'access',
    x: 620,
    y: 620,
    status: 'up',
    mac: '00:1B:44:22:8C:01',
    managementIp: '10.10.30.12',
    defaultGateway: '10.10.30.1',
    vlanId: 30,
    interfaces: [{ id: 'eth0', name: 'FastEthernet0', mac: '00:1B:44:22:8C:01', ip: '10.10.30.12', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'acc-sw-hr', interfaceId: 'g0/1', linkId: 'link-acchr-pc1' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.10.30.1', interface: 'FastEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `IP Configuration:
IP: 10.10.30.12
Gateway: 10.10.30.1`,
    uptimeSeconds: 32000,
  },
  {
    id: 'pc-admin-01',
    name: 'NOC Admin Workstation',
    hostname: 'WS-NOC-ADMIN',
    type: 'host',
    layer: 'access',
    x: 450,
    y: 620,
    status: 'up',
    mac: '00:1B:44:33:FF:01',
    managementIp: '10.10.10.5',
    defaultGateway: '10.10.10.1',
    vlanId: 10,
    interfaces: [{ id: 'eth0', name: 'FastEthernet0', mac: '00:1B:44:33:FF:01', ip: '10.10.10.5', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'acc-sw-mgmt', interfaceId: 'g0/1', linkId: 'link-accmgmt-admin' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.10.10.1', interface: 'FastEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `IP Configuration:
IP: 10.10.10.5
Gateway: 10.10.10.1`,
    uptimeSeconds: 78000,
  },
  {
    id: 'branch-pc-01',
    name: 'Branch Sales Workstation',
    hostname: 'WS-BRANCH-SALES',
    type: 'host',
    layer: 'branch',
    x: 910,
    y: 430,
    status: 'up',
    mac: '00:1B:44:55:00:10',
    managementIp: '10.20.50.10',
    defaultGateway: '10.20.50.1',
    vlanId: 50,
    interfaces: [{ id: 'eth0', name: 'FastEthernet0', mac: '00:1B:44:55:00:10', ip: '10.20.50.10', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'branch-dist-01', interfaceId: 'g0/2', linkId: 'link-branch-sw-pc' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.20.50.1', interface: 'FastEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `IP: 10.20.50.10
Gateway: 10.20.50.1`,
    uptimeSeconds: 50000,
  },
  {
    id: 'srv-dhcp-dns',
    name: 'DHCP / DNS Enterprise Server',
    hostname: 'SRV-DC-DHCP01',
    type: 'server',
    layer: 'datacenter',
    x: 50,
    y: 420,
    status: 'up',
    mac: '00:50:56:A1:00:02',
    managementIp: '10.100.100.2',
    defaultGateway: '10.100.100.1',
    vlanId: 100,
    interfaces: [{ id: 'eth0', name: 'GigabitEthernet0', mac: '00:50:56:A1:00:02', ip: '10.100.100.2', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'dc-switch-01', interfaceId: 'g0/1', linkId: 'link-dc-dhcp' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.100.100.1', interface: 'GigabitEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `Service: ISC-DHCP-Server & BIND9 DNS
Active DHCP Scopes:
- VLAN 10 (10.10.10.0/24, Pool: 10.10.10.50-10.10.10.150)
- VLAN 20 (10.10.20.0/24, Pool: 10.10.20.50-10.10.20.200)
- VLAN 30 (10.10.30.0/24, Pool: 10.10.30.50-10.10.30.200)`,
    uptimeSeconds: 1200000,
  },
  {
    id: 'srv-webapp',
    name: 'Enterprise ERP / Intranet Portal',
    hostname: 'SRV-DC-WEB01',
    type: 'server',
    layer: 'datacenter',
    x: 130,
    y: 420,
    status: 'up',
    mac: '00:50:56:A1:00:10',
    managementIp: '10.100.100.10',
    defaultGateway: '10.100.100.1',
    vlanId: 100,
    interfaces: [{ id: 'eth0', name: 'GigabitEthernet0', mac: '00:50:56:A1:00:10', ip: '10.100.100.10', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'dc-switch-01', interfaceId: 'g0/2', linkId: 'link-dc-web' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.100.100.1', interface: 'GigabitEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `Service: Nginx HTTPS / Node.js ERP Portal
Listening Ports: 80, 443`,
    uptimeSeconds: 1200000,
  },
  {
    id: 'srv-syslog',
    name: 'SIEM / Syslog & NetFlow Server',
    hostname: 'SRV-DC-SIEM01',
    type: 'server',
    layer: 'datacenter',
    x: 210,
    y: 420,
    status: 'up',
    mac: '00:50:56:A1:00:20',
    managementIp: '10.100.100.20',
    defaultGateway: '10.100.100.1',
    vlanId: 100,
    interfaces: [{ id: 'eth0', name: 'GigabitEthernet0', mac: '00:50:56:A1:00:20', ip: '10.100.100.20', subnetMask: '255.255.255.0', status: 'up', mode: 'access', connectedTo: { deviceId: 'dc-switch-01', interfaceId: 'g0/3', linkId: 'link-dc-syslog' } }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.100.100.1', interface: 'GigabitEthernet0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `Service: Splunk / Rsyslogd Collector
Listening UDP 514, TCP 1514`,
    uptimeSeconds: 1200000,
  },

  // ==================== ATTACKER NODE ====================
  {
    id: 'attacker-kali',
    name: 'Kali Rogue Device (Security Lab)',
    hostname: 'KALI-ATTACKER-NODE',
    type: 'attacker',
    layer: 'access',
    x: 100,
    y: 620,
    status: 'up',
    mac: 'DE:AD:BE:EF:00:66',
    managementIp: '10.10.20.99',
    defaultGateway: '10.10.20.1',
    vlanId: 20,
    interfaces: [{ id: 'eth0', name: 'eth0', mac: 'DE:AD:BE:EF:00:66', ip: '10.10.20.99', subnetMask: '255.255.255.0', status: 'up', mode: 'access' }],
    routingTable: [{ prefix: '0.0.0.0/0', nextHop: '10.10.20.1', interface: 'eth0', metric: 1, protocol: 'S', adminDistance: 1 }],
    runningConfig: `Security Toolkit:
- Yersinia (STP / DHCP / CDP flooder)
- Ettercap / Arpspoof (MITM ARP Poisoning)
- Rogue DHCP Server (dnsmasq rogue listener)
- Macchanger / Flooder`,
    uptimeSeconds: 1800,
  },
];

export const INITIAL_LINKS: NetworkLink[] = [
  // Core to Edge
  { id: 'link-core1-edge', sourceNodeId: 'core-sw-01', sourceInterfaceId: 'g0/1', targetNodeId: 'hq-edge-r1', targetInterfaceId: 'g0/1', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 1, isVlanTrunk: false, lossRate: 0, latencyMs: 0.2 },
  { id: 'link-core2-edge', sourceNodeId: 'core-sw-02', sourceInterfaceId: 'g0/1', targetNodeId: 'hq-edge-r1', targetInterfaceId: 'g0/2', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 1, isVlanTrunk: false, lossRate: 0, latencyMs: 0.2 },
  
  // Core to Core (40G Interconnect)
  { id: 'link-core1-core2', sourceNodeId: 'core-sw-01', sourceInterfaceId: 'g0/2', targetNodeId: 'core-sw-02', targetInterfaceId: 'g0/2', type: 'fiber-40g', status: 'up', bandwidthMbps: 40000, cost: 1, isVlanTrunk: false, lossRate: 0, latencyMs: 0.1 },

  // Core to Distribution Full Mesh
  { id: 'link-core1-dist1', sourceNodeId: 'core-sw-01', sourceInterfaceId: 'g0/3', targetNodeId: 'dist-sw-01', targetInterfaceId: 'g0/1', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 5, isVlanTrunk: false, lossRate: 0, latencyMs: 0.3 },
  { id: 'link-core1-dist2', sourceNodeId: 'core-sw-01', sourceInterfaceId: 'g0/4', targetNodeId: 'dist-sw-02', targetInterfaceId: 'g0/1', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 5, isVlanTrunk: false, lossRate: 0, latencyMs: 0.3 },
  { id: 'link-core2-dist1', sourceNodeId: 'core-sw-02', sourceInterfaceId: 'g0/3', targetNodeId: 'dist-sw-01', targetInterfaceId: 'g0/2', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 5, isVlanTrunk: false, lossRate: 0, latencyMs: 0.3 },
  { id: 'link-core2-dist2', sourceNodeId: 'core-sw-02', sourceInterfaceId: 'g0/4', targetNodeId: 'dist-sw-02', targetInterfaceId: 'g0/2', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 5, isVlanTrunk: false, lossRate: 0, latencyMs: 0.3 },

  // Distribution Interconnect (HSRP Heartbeat & 802.1Q Trunk)
  { id: 'link-dist1-dist2', sourceNodeId: 'dist-sw-01', sourceInterfaceId: 'g0/3', targetNodeId: 'dist-sw-02', targetInterfaceId: 'g0/3', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 4, isVlanTrunk: true, allowedVlans: [10, 20, 30, 40, 99], lossRate: 0, latencyMs: 0.2 },

  // Distribution to Access Switches
  { id: 'link-dist1-acceng', sourceNodeId: 'dist-sw-01', sourceInterfaceId: 'g0/4', targetNodeId: 'acc-sw-eng', targetInterfaceId: 'g0/23', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: true, allowedVlans: [10, 20, 99], lossRate: 0, latencyMs: 0.4 },
  // STP Blocked alternate uplink from Acc-SW-Eng to Dist-02 to prevent loop!
  { id: 'link-dist2-acceng', sourceNodeId: 'dist-sw-02', sourceInterfaceId: 'g0/4', targetNodeId: 'acc-sw-eng', targetInterfaceId: 'g0/24', type: 'copper-1g', status: 'stp-blocked', bandwidthMbps: 1000, cost: 4, isVlanTrunk: true, allowedVlans: [10, 20, 99], lossRate: 0, latencyMs: 0.4 },
  
  // STP Blocked uplink from Acc-SW-HR to Dist-01
  { id: 'link-dist1-acchr', sourceNodeId: 'dist-sw-01', sourceInterfaceId: 'g0/5', targetNodeId: 'acc-sw-hr', targetInterfaceId: 'g0/23', type: 'copper-1g', status: 'stp-blocked', bandwidthMbps: 1000, cost: 4, isVlanTrunk: true, allowedVlans: [10, 30, 99], lossRate: 0, latencyMs: 0.4 },
  { id: 'link-dist2-acchr', sourceNodeId: 'dist-sw-02', sourceInterfaceId: 'g0/5', targetNodeId: 'acc-sw-hr', targetInterfaceId: 'g0/24', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: true, allowedVlans: [10, 30, 99], lossRate: 0, latencyMs: 0.4 },

  { id: 'link-dist1-accmgmt', sourceNodeId: 'dist-sw-01', sourceInterfaceId: 'g0/5', targetNodeId: 'acc-sw-mgmt', targetInterfaceId: 'g0/24', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: true, allowedVlans: [10, 99], lossRate: 0, latencyMs: 0.4 },

  // Access to Hosts
  { id: 'link-acceng-pc1', sourceNodeId: 'acc-sw-eng', sourceInterfaceId: 'g0/1', targetNodeId: 'pc-eng-01', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.5 },
  { id: 'link-acceng-pc2', sourceNodeId: 'acc-sw-eng', sourceInterfaceId: 'g0/2', targetNodeId: 'pc-eng-02', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.5 },
  { id: 'link-acchr-pc1', sourceNodeId: 'acc-sw-hr', sourceInterfaceId: 'g0/1', targetNodeId: 'pc-hr-01', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.5 },
  { id: 'link-accmgmt-admin', sourceNodeId: 'acc-sw-mgmt', sourceInterfaceId: 'g0/1', targetNodeId: 'pc-admin-01', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.5 },

  // WAN Link to Branch
  { id: 'link-wan-branch', sourceNodeId: 'hq-edge-r1', sourceInterfaceId: 's0/1/0', targetNodeId: 'branch-r1', targetInterfaceId: 's0/1/0', type: 'wan-serial', status: 'up', bandwidthMbps: 100, cost: 64, isVlanTrunk: false, lossRate: 0, latencyMs: 14.2 },
  { id: 'link-branch-r-sw', sourceNodeId: 'branch-r1', sourceInterfaceId: 'g0/1', targetNodeId: 'branch-dist-01', targetInterfaceId: 'g0/1', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: true, allowedVlans: [50], lossRate: 0, latencyMs: 0.4 },
  { id: 'link-branch-sw-pc', sourceNodeId: 'branch-dist-01', sourceInterfaceId: 'g0/2', targetNodeId: 'branch-pc-01', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.5 },

  // WAN Link to Data Center
  { id: 'link-hq-dc', sourceNodeId: 'hq-edge-r1', sourceInterfaceId: 'g0/0', targetNodeId: 'dc-core-r1', targetInterfaceId: 'g0/0', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 10, isVlanTrunk: false, lossRate: 0, latencyMs: 1.8 },
  { id: 'link-dc-r-sw', sourceNodeId: 'dc-core-r1', sourceInterfaceId: 'g0/1', targetNodeId: 'dc-switch-01', targetInterfaceId: 'g0/24', type: 'fiber-10g', status: 'up', bandwidthMbps: 10000, cost: 4, isVlanTrunk: true, allowedVlans: [100], lossRate: 0, latencyMs: 0.3 },
  { id: 'link-dc-dhcp', sourceNodeId: 'dc-switch-01', sourceInterfaceId: 'g0/1', targetNodeId: 'srv-dhcp-dns', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.4 },
  { id: 'link-dc-web', sourceNodeId: 'dc-switch-01', sourceInterfaceId: 'g0/2', targetNodeId: 'srv-webapp', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.4 },
  { id: 'link-dc-syslog', sourceNodeId: 'dc-switch-01', sourceInterfaceId: 'g0/3', targetNodeId: 'srv-syslog', targetInterfaceId: 'eth0', type: 'copper-1g', status: 'up', bandwidthMbps: 1000, cost: 4, isVlanTrunk: false, lossRate: 0, latencyMs: 0.4 },
];

export const SCENARIOS: SimulationScenario[] = [
  {
    id: 'sc-ospf-failover',
    title: 'OSPF Core Link Failure & Dynamic Re-convergence',
    category: 'OSPF',
    difficulty: 'Intermediate',
    description: 'Simulate a physical cut on the primary link between Core-SW-01 and Dist-SW-01. Observe OSPF SPF recalculation, route re-direction via Core-SW-02, and zero packet drop.',
    objective: 'Demonstrate fault-tolerant dynamic routing and verify sub-second OSPF convergence time in Area 0.',
    initialStateDescription: 'Core-01 has primary path to Dist-01. All OSPF adjacencies are FULL.',
    steps: [
      'Click the link between HQ-CORE-SW01 and HQ-DIST-SW01 to simulate link severed (DOWN).',
      'Observe OSPF Dead Timer trigger neighbor state change from FULL to DOWN.',
      'Watch OSPF Dijkstra algorithm dynamically re-route traffic through Core-SW-02 (10.0.4.0/30).',
      'Execute "show ip route" in HQ-CORE-SW01 terminal to inspect the updated metric and next-hop.',
    ],
    expectedResult: 'Traffic from PC-Eng-01 to DC Web Server seamlessly reroutes via Core-SW-02 with no permanent loss.',
    verificationCmd: 'show ip ospf neighbor',
  },
  {
    id: 'sc-hsrp-failover',
    title: 'HSRP Default Gateway Active/Standby Failover',
    category: 'HSRP',
    difficulty: 'Intermediate',
    description: 'Dist-SW-01 is configured as HSRP Active for VLAN 20 (Priority 110). Shut down Dist-SW-01 and verify Dist-SW-02 assumes Active state (Priority 90) with Virtual IP 10.10.20.1.',
    objective: 'Verify First-Hop Redundancy Protocol (FHRP) operation ensuring continuous default gateway availability for hosts.',
    initialStateDescription: 'Dist-SW-01 is Active (VIP: 10.10.20.1). Dist-SW-02 is Standby.',
    steps: [
      'Open HQ-DIST-SW01 CLI and run "show standby brief" to verify Active state.',
      'Click HQ-DIST-SW01 power button to set status to DOWN (or run "shutdown" on Vlan20).',
      'Observe HSRP Hold Timer expire on HQ-DIST-SW02.',
      'HQ-DIST-SW02 transmits Coup packet and transitions from Standby -> Active.',
      'Ping 10.100.100.10 from PC-Eng-01 to confirm packets route through new active gateway.',
    ],
    expectedResult: 'Host PC-Eng-01 retains uninterrupted internet/intranet access using unchanged Virtual Gateway IP 10.10.20.1.',
    verificationCmd: 'show standby brief',
  },
  {
    id: 'sc-stp-loop',
    title: 'STP Loop Prevention & Port State Transitions',
    category: 'STP',
    difficulty: 'Beginner',
    description: 'Acc-SW-Eng has redundant dual uplinks to Dist-SW-01 and Dist-SW-02. Rapid PVST+ places Gi0/24 into Alternate/Blocking to prevent broadcast storms.',
    objective: 'Demonstrate how Spanning Tree eliminates Layer 2 loops and handles topology change notifications (TCN).',
    initialStateDescription: 'Dist-SW-01 is Root Bridge for VLAN 20. Gi0/24 on Acc-SW-Eng is in BLOCKING state.',
    steps: [
      'Inspect the amber dot on Acc-SW-Eng Gi0/24 indicating Alternate/Blocking port role.',
      'Sever the primary uplink link between Acc-SW-Eng and Dist-SW-01.',
      'Observe Acc-SW-Eng transition Gi0/24 from Blocking -> Learning -> Forwarding (green).',
      'Run "show spanning-tree" on Acc-SW-Eng to view the newly elected Root Port.',
    ],
    expectedResult: 'Network automatically unblocks backup link and restores L2 frame forwarding without creating loops.',
    verificationCmd: 'show spanning-tree vlan 20',
  },
  {
    id: 'sc-dhcp-snooping',
    title: 'Rogue DHCP Server Attack & Snooping Mitigation',
    category: 'DHCP_SNOOPING',
    difficulty: 'Advanced',
    description: 'An attacker connects a Rogue DHCP server on an untrusted access port (Acc-SW-Eng Gi0/3) to distribute malicious gateway and DNS addresses to employees.',
    objective: 'Demonstrate DHCP Snooping dropping untrusted DHCP Offers while permitting legitimate DHCP Server packets through trusted uplinks.',
    initialStateDescription: 'DHCP Snooping is enabled on VLAN 20. Uplinks are trusted; access ports are untrusted.',
    steps: [
      'Select Kali-Attacker node and click "Launch Rogue DHCP Offer Attack".',
      'The rogue DHCP Offer hits Acc-SW-Eng Gi0/3 (untrusted port).',
      'Acc-SW-Eng DHCP Snooping inspection engine drops the packet and generates a security syslog alert.',
      'Inspect Security Events log and DHCP Snooping binding table to verify no corruption.',
    ],
    expectedResult: 'Rogue DHCP packet is dropped immediately with zero host misconfiguration.',
    verificationCmd: 'show ip dhcp snooping binding',
  },
  {
    id: 'sc-dai-arp-poison',
    title: 'Dynamic ARP Inspection (DAI) vs ARP Cache Poisoning',
    category: 'DAI',
    difficulty: 'Advanced',
    description: 'An attacker broadcasts gratuitous spoofed ARP replies claiming the HSRP Gateway IP (10.10.20.1) has the attacker MAC (DE:AD:BE:EF:00:66) to perform Man-In-The-Middle interception.',
    objective: 'Verify DAI intercepting and validating ARP packets against the DHCP Snooping database and dropping spoofed packets.',
    initialStateDescription: 'DAI enabled on VLAN 20. Valid bindings present in DHCP database.',
    steps: [
      'Select Kali-Attacker node and click "Broadcast Spoofed ARP Reply".',
      'Acc-SW-Eng inspects the ARP header: IP 10.10.20.1 does not match the database MAC.',
      'DAI invalidates the packet, drops it at ingress, and logs "DHCP_SNOOPING_DENIED_ARP".',
      'Run "show ip arp inspection" on Acc-SW-Eng to inspect the dropped packet counter.',
    ],
    expectedResult: 'DAI blocks ARP cache poisoning, protecting PC-Eng-01 and Gateway from MITM snooping.',
    verificationCmd: 'show ip arp inspection',
  },
  {
    id: 'sc-port-security',
    title: 'Port Security Violation & Err-Disabled Trigger',
    category: 'PORT_SECURITY',
    difficulty: 'Beginner',
    description: 'Port Security is enabled on Acc-SW-Eng Gi0/1 with maximum 1 MAC address (Sticky MAC of PC-Eng-01: 00:1B:44:11:3A:01). An unauthorized laptop with MAC FF:EE:DD:00:99 connects.',
    objective: 'Demonstrate Port Security violation mode "shutdown" automatically putting the port into err-disabled state.',
    initialStateDescription: 'Acc-SW-Eng Gi0/1 has sticky MAC learned. Violation action is shutdown.',
    steps: [
      'Click "Simulate Unauthorized Rogue Device Plug-In" on Acc-SW-Eng Gi0/1.',
      'A frame with foreign MAC arrives at Gi0/1.',
      'Switch port detects violation (>1 MAC address).',
      'Port Gi0/1 transitions to ERR-DISABLED (red alert), shutting down link immediately.',
      'Run "show port-security interface Gi0/1" to view violation count and status.',
      'Run "shutdown" then "no shutdown" in CLI to recover interface.',
    ],
    expectedResult: 'Port immediately err-disables, physically isolating unauthorized device from the corporate LAN.',
    verificationCmd: 'show port-security interface GigabitEthernet0/1',
  },
];
