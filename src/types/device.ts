export type DeviceOnlineStatus = '在线' | '离线';
export type SwitchState = '开' | '关';
export type DevicePurpose = '普通设备' | '计费设备' | '门禁设备' | '照明控制' | '音响播控';
export type DeviceTestMode = 'switch' | 'lock' | 'none';

export interface DeviceRecord {
  id: string;
  index: number;
  franchisee: string;
  storeName: string;
  gatewaySn: string;
  macAddress: string;
  model: string;
  deviceName: string;
  boundRoom: string;
  status: DeviceOnlineStatus;
  purpose: DevicePurpose;
  testMode: DeviceTestMode;
  // Extended fields moved into "更多" panel
  switchState: SwitchState;
  batteryLevel: number | null; // null means AC powered / N/A
  doorLockId: string | null;
  volume: number | null; // 0-100 or null if not audio device
  signalStrength: number; // e.g., -44, -56, 0
  lastSignalQueryTime: string;
}

export interface DeviceFilterState {
  franchisee: string;
  storeName: string;
  roomName: string;
  gatewaySn: string;
  macAddress: string;
  deviceName: string;
  deviceStatus: '' | DeviceOnlineStatus;
  batteryFilter: '' | 'normal' | 'low' | 'wired';
}

export interface GatewayRecord {
  id: string;
  gatewaySn: string;
  franchisee: string;
  storeName: string;
  ipAddress: string;
  firmware: string;
  boundDevices: number;
  status: DeviceOnlineStatus;
  lastHeartbeat: string;
}

export interface RoomRecord {
  id: string;
  roomName: string;
  storeName: string;
  franchisee: string;
  roomType: string;
  deviceCount: number;
  powerStatus: '通电中' | '已断电';
  roomStatus: '使用中' | '空闲' | '维护中';
}

export type WorkspaceTabKey = 'gateways' | 'devices' | 'rooms';
