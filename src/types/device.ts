export type DeviceOnlineStatus = '在线' | '离线';
export type SwitchState = '开' | '关';
export type DevicePurpose = '普通设备' | '计费设备' | '门禁设备' | '照明控制' | '音响播控';
export type DeviceTestMode = 'switch' | 'lock' | 'gzdls7' | 'none';

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
  // Mini-program metadata
  sortOrder: number;
  enabled: boolean;
  roomCategory: string;
}

export type PlatformMode = 'web' | 'miniapp';

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

// GZDLS7 specialized types
export type Gzdls7PanelTab =
  | 'personnel'
  | 'info'
  | 'attendance'
  | 'text'
  | 'image'
  | 'audio';

export type QuickCoordinateKey =
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-right';

export interface Gzdls7DeviceInfo {
  model: string;
  firmwareVersion: string;
  deviceIp: string;
  userCount: number;
  attendanceCount: number;
  faceCount: number;
}

export interface Gzdls7Personnel {
  id: string;
  name: string;
  employeeNo: string;
  faceEnrolled: boolean;
  faceId: string | null;
  faceEnrolledAt: string | null;
  faceQuality: number | null;
  faceQueried: boolean;
}

export interface Gzdls7AttendanceRecord {
  id: string;
  name: string;
  employeeNo: string;
  checkInTime: string;
}

export interface Gzdls7AudioFile {
  id: string;
  name: string;
  fileName: string;
  sizeText: string;
  durationSec: number;
  uploadedAt: string;
}
