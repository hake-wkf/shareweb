import {
  Gzdls7AttendanceRecord,
  Gzdls7AudioFile,
  Gzdls7DeviceInfo,
  Gzdls7Personnel,
  QuickCoordinateKey,
} from '../types/device';

export const GZDLS7_SCREEN_WIDTH = 800;
export const GZDLS7_SCREEN_HEIGHT = 1280;

export const QUICK_COORDINATE_PRESETS: {
  key: QuickCoordinateKey;
  label: string;
  x: number;
  y: number;
}[] = [
  { key: 'top-left', label: '左上角', x: 32, y: 40 },
  { key: 'top-right', label: '右上角', x: 560, y: 40 },
  { key: 'center', label: '中间', x: 280, y: 600 },
  { key: 'bottom-left', label: '左下角', x: 32, y: 1140 },
  { key: 'bottom-right', label: '右下角', x: 560, y: 1140 },
];

export function createInitialGzdls7Info(deviceId: string): Gzdls7DeviceInfo {
  const numSeed = parseInt(deviceId.replace(/\D/g, ''), 10) || 1;
  return {
    model: 'GZDLS7',
    firmwareVersion: 'v4.2.18-GZDLS7',
    deviceIp: `192.168.10.${100 + (numSeed % 120)}`,
    userCount: 128 + (numSeed % 20),
    attendanceCount: 1462 + numSeed * 7,
    faceCount: 119 + (numSeed % 15),
  };
}

export const INITIAL_GZDLS7_PERSONNEL: Gzdls7Personnel[] = [
  {
    id: 'per-1',
    name: '张伟',
    employeeNo: 'EMP1001',
    faceEnrolled: true,
    faceId: 'FACE-GZDLS7-001A',
    faceEnrolledAt: '2026-10-18 14:22:09',
    faceQuality: 98,
    faceQueried: false,
  },
  {
    id: 'per-2',
    name: '李敏',
    employeeNo: 'EMP1002',
    faceEnrolled: true,
    faceId: 'FACE-GZDLS7-002B',
    faceEnrolledAt: '2026-10-20 09:15:44',
    faceQuality: 96,
    faceQueried: false,
  },
  {
    id: 'per-3',
    name: '王强',
    employeeNo: 'EMP1003',
    faceEnrolled: false,
    faceId: null,
    faceEnrolledAt: null,
    faceQuality: null,
    faceQueried: false,
  },
  {
    id: 'per-4',
    name: '陈静',
    employeeNo: 'EMP1004',
    faceEnrolled: true,
    faceId: 'FACE-GZDLS7-004D',
    faceEnrolledAt: '2026-11-01 11:08:31',
    faceQuality: 99,
    faceQueried: false,
  },
  {
    id: 'per-5',
    name: '刘洋',
    employeeNo: 'EMP1005',
    faceEnrolled: true,
    faceId: 'FACE-GZDLS7-005E',
    faceEnrolledAt: '2026-11-03 16:40:15',
    faceQuality: 94,
    faceQueried: false,
  },
  {
    id: 'per-6',
    name: '赵雪',
    employeeNo: 'EMP1006',
    faceEnrolled: false,
    faceId: null,
    faceEnrolledAt: null,
    faceQuality: null,
    faceQueried: false,
  },
  {
    id: 'per-7',
    name: '孙磊',
    employeeNo: 'EMP1007',
    faceEnrolled: true,
    faceId: 'FACE-GZDLS7-007G',
    faceEnrolledAt: '2026-11-09 10:12:58',
    faceQuality: 97,
    faceQueried: false,
  },
  {
    id: 'per-8',
    name: '周婷',
    employeeNo: 'EMP1008',
    faceEnrolled: true,
    faceId: 'FACE-GZDLS7-008H',
    faceEnrolledAt: '2026-11-11 18:05:27',
    faceQuality: 95,
    faceQueried: false,
  },
];

export const INITIAL_GZDLS7_ATTENDANCE: Gzdls7AttendanceRecord[] = [
  { id: 'att-1', name: '张伟', employeeNo: 'EMP1001', checkInTime: '2026-11-13 08:52:14' },
  { id: 'att-2', name: '李敏', employeeNo: 'EMP1002', checkInTime: '2026-11-13 08:57:03' },
  { id: 'att-3', name: '陈静', employeeNo: 'EMP1004', checkInTime: '2026-11-13 09:01:49' },
  { id: 'att-4', name: '刘洋', employeeNo: 'EMP1005', checkInTime: '2026-11-13 13:18:22' },
  { id: 'att-5', name: '孙磊', employeeNo: 'EMP1007', checkInTime: '2026-11-13 18:04:11' },
  { id: 'att-6', name: '周婷', employeeNo: 'EMP1008', checkInTime: '2026-11-13 20:32:45' },
  { id: 'att-7', name: '张伟', employeeNo: 'EMP1001', checkInTime: '2026-11-12 08:49:38' },
  { id: 'att-8', name: '李敏', employeeNo: 'EMP1002', checkInTime: '2026-11-12 09:03:17' },
  { id: 'att-9', name: '陈静', employeeNo: 'EMP1004', checkInTime: '2026-11-12 17:58:02' },
  { id: 'att-10', name: '刘洋', employeeNo: 'EMP1005', checkInTime: '2026-11-11 08:55:19' },
  { id: 'att-11', name: '孙磊', employeeNo: 'EMP1007', checkInTime: '2026-11-10 09:10:04' },
  { id: 'att-12', name: '周婷', employeeNo: 'EMP1008', checkInTime: '2026-11-08 14:22:30' },
];

export const INITIAL_GZDLS7_AUDIOS: Gzdls7AudioFile[] = [
  {
    id: 'aud-1',
    name: '迎宾欢迎语音',
    fileName: 'welcome_guest.mps',
    sizeText: '142 KB',
    durationSec: 4,
    uploadedAt: '2026-11-02 10:15:00',
  },
  {
    id: 'aud-2',
    name: '门禁开锁提示音',
    fileName: 'door_open_tip.mps',
    sizeText: '86 KB',
    durationSec: 2,
    uploadedAt: '2026-11-05 15:42:18',
  },
  {
    id: 'aud-3',
    name: '包厢计费开始播报',
    fileName: 'vip_greeting.mps',
    sizeText: '198 KB',
    durationSec: 6,
    uploadedAt: '2026-11-08 11:20:09',
  },
  {
    id: 'aud-4',
    name: '离店结算提醒',
    fileName: 'checkout_remind.mps',
    sizeText: '164 KB',
    durationSec: 5,
    uploadedAt: '2026-11-10 19:08:45',
  },
];
