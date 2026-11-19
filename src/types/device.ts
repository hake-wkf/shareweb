export type DeviceOnlineStatus = '在线' | '离线';
export type SwitchState = '开' | '关';
export type DevicePurpose = '普通设备' | '计费设备' | '门禁设备' | '照明控制' | '音响播控';
export type DeviceTestMode = 'switch' | 'lock' | 'gzdls7' | 'gzirb56' | 'none';

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

export type WorkspaceTabKey =
  | 'gateways'
  | 'devices'
  | 'rooms'
  | 'events'
  | 'roomEvents';

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

// GZIRB56 (点歌机) specialized types
export type Gzirb56PanelTab = 'open_order' | 'renew_order' | 'activity';

export interface Gzirb56Config {
  welcomeText: string;
  // 续费下单 fixed fields
  renewalTipMode: '距离当前订单结束时长';
  renewalQrMode: '绑定包间下单二维码';
  // 活动内容 fields
  activityName: string;
  activityDesc: string;
  activityTime: string;
  activityContent: string;
  activityDiscount: string;
  discountDesc: string;
}

// Area Event Management types
export type AreaEventTriggerType =
  | 'any_order_active'
  | 'no_orders'
  | 'gym_face_open'
  | 'ab_door_linkage';

export type AreaEventDeviceActionType =
  | 'open_door'
  | 'display_text'
  | 'display_image'
  | 'play_audio'
  | 'turn_on'
  | 'turn_off'
  | 'unlock'
  | 'lock'
  | 'set_volume'
  | 'open_order_welcome'
  | 'renew_order'
  | 'activity_content';

export type AbIconMatchMode = 'all' | 'specific';
export type AbTextSourceMode = 'ab_text' | 'custom';
export type ImageSourceMode = 'order_user_avatar' | 'preset_or_upload';

export interface AbDoorDeviceOption {
  id: string;
  sn: string;
  name: string;
  areaName: string;
}

export interface AreaEventActionConfig {
  id: string;
  roomName: string;
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  deviceSn: string;
  actionType: AreaEventDeviceActionType | '';
  delaySeconds: number;
  // GZDLS7 display_text config
  textContent: string;
  textPreset: QuickCoordinateKey | 'custom';
  textX: number;
  textY: number;
  textColor: string;
  textFontSize: number;
  textPersistMode: 'always' | 'seconds';
  textDurationSec: number;
  // GZDLS7 display_image config
  imageSourceMode: ImageSourceMode;
  imageName: string;
  imageUrl: string;
  imagePreset: QuickCoordinateKey | 'custom';
  imageX: number;
  imageY: number;
  imagePersistMode: 'always' | 'seconds';
  imageDurationSec: number;
  // GZDLS7 play_audio config
  audioFileName: string;
  audioDisplayName: string;
  audioVolume: number;
  // AB door linkage config
  abIconMatchMode: AbIconMatchMode;
  abIconIdValue: string;
  abTextSourceMode: AbTextSourceMode;
  // Non-GZDLS7 optional volume
  deviceVolume?: number;
}

export interface AreaEventRecord {
  id: string;
  eventName: string;
  areaName: string;
  triggerType: AreaEventTriggerType;
  triggerDeviceSn?: string;
  abDoorDeviceId?: string;
  abDoorDeviceSn?: string;
  abDoorDeviceName?: string;
  abCommand?: 'ABReport';
  actions: AreaEventActionConfig[];
  updatedAt: string;
}

// Room Event Management (事件管理: 针对包间的事件列表 & 单个事件设备动作)
export interface RoomEventDeviceAction {
  id: string;
  executionOrder: number;
  actionType: 'Command' | 'Scene';
  deviceId: string;
  deviceSn: string;
  deviceName: string;
  deviceModel: string;
  operation: string;
  operationLabel: string;
  params: string;
  delayMs: number;
  gzirb56Config?: Gzirb56Config;
}

export interface RoomEventItem {
  id: string;
  roomName: string;
  eventKey: string;
  eventName: string;
  triggerCondition: string;
  actions: RoomEventDeviceAction[];
}
