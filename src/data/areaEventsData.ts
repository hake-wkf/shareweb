import {
  AbDoorDeviceOption,
  AreaEventActionConfig,
  AreaEventRecord,
  AreaEventTriggerType,
} from '../types/device';
import { INITIAL_GZDLS7_AUDIOS } from './gzdls7Data';

export const AREA_OPTIONS = [
  '测试改版新增',
  '区域2',
  '储物柜001',
  '健身房主入口',
  '01',
  '毒牙台球④',
  '乔氏台球①',
  '棋牌泡茶③',
  'VIP黑八包间',
];

export const TRIGGER_CONDITION_OPTIONS: {
  value: AreaEventTriggerType;
  label: string;
}[] = [
  { value: 'any_order_active', label: '区域内存在任意订单进行中' },
  { value: 'no_orders', label: '区域内不存在订单' },
  { value: 'gym_face_open', label: '健身房人脸开门' },
  { value: 'ab_door_linkage', label: 'AB门联动' },
];

export const AB_DOOR_DEVICES: AbDoorDeviceOption[] = [
  {
    id: 'ab-1',
    sn: '18523DAB000101',
    name: '健身房AB门控制器-A门',
    areaName: '健身房主入口',
  },
  {
    id: 'ab-2',
    sn: '18523DAB000102',
    name: '健身房AB门控制器-B门',
    areaName: '健身房主入口',
  },
  {
    id: 'ab-3',
    sn: '18523DAB000208',
    name: '储物区AB联动闸机01',
    areaName: '储物柜001',
  },
  {
    id: 'ab-4',
    sn: '18523DAB000315',
    name: 'VIP通道AB互锁门禁',
    areaName: 'VIP黑八包间',
  },
];

export const DEFAULT_BUILTIN_EVENT_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><rect width="240" height="120" rx="8" fill="#1E3A8A"/><rect x="8" y="8" width="224" height="104" rx="6" fill="none" stroke="#93C5FD" stroke-width="1.5" stroke-dasharray="4 3"/><text x="120" y="54" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">欢迎光临</text><text x="120" y="80" fill="#BFDBFE" font-family="sans-serif" font-size="12" text-anchor="middle">请正对屏幕完成识别通行</text></svg>`
  );

export function createDefaultAction(seed?: number): AreaEventActionConfig {
  const defaultAudio = INITIAL_GZDLS7_AUDIOS[0];
  return {
    id: `act-${Date.now()}-${seed ?? Math.floor(Math.random() * 10000)}`,
    roomName: '',
    deviceId: '',
    deviceName: '',
    deviceModel: '',
    deviceSn: '',
    actionType: '',
    delaySeconds: 0,
    textContent: '欢迎光临，{{订单用户名字}}',
    textPreset: 'bottom-left',
    textX: 32,
    textY: 1140,
    textColor: '#FFFFFF',
    textFontSize: 28,
    textPersistMode: 'seconds',
    textDurationSec: 5,
    imageSourceMode: 'order_user_avatar',
    imageName: '订单用户头像',
    imageUrl: DEFAULT_BUILTIN_EVENT_IMAGE,
    imagePreset: 'center',
    imageX: 280,
    imageY: 600,
    imagePersistMode: 'seconds',
    imageDurationSec: 5,
    audioFileName: defaultAudio?.fileName ?? 'welcome_guest.mps',
    audioDisplayName: defaultAudio?.name ?? '迎宾欢迎语音',
    audioVolume: 80,
    abIconMatchMode: 'all',
    abIconIdValue: '',
    abTextSourceMode: 'ab_text',
    deviceVolume: 65,
  };
}

export function getTriggerLabel(triggerType: AreaEventTriggerType): string {
  return (
    TRIGGER_CONDITION_OPTIONS.find((t) => t.value === triggerType)?.label ??
    triggerType
  );
}

export function formatActionSummary(
  action: AreaEventActionConfig,
  triggerType: AreaEventTriggerType
): string {
  const room = action.roomName || '未指定区域';
  const dev = action.deviceName || '未选设备';
  const iconCond =
    action.abIconMatchMode === 'all'
      ? 'ABIconId=all'
      : `ABIconId=${action.abIconIdValue || '?'}`;

  switch (action.actionType) {
    case 'turn_on':
      return `${room}-${dev}-开`;
    case 'turn_off':
      return `${room}-${dev}-关`;
    case 'unlock':
      return `${room}-${dev}-开锁`;
    case 'lock':
      return `${room}-${dev}-关锁`;
    case 'open_door':
      return `${room}-${dev}-开门`;
    case 'display_text': {
      if (triggerType === 'ab_door_linkage') {
        const textDesc =
          action.abTextSourceMode === 'ab_text'
            ? 'ABText'
            : action.textContent || '指定文字';
        return `${room}-${dev}-下发文字(${iconCond} · ${textDesc})`;
      }
      return `${room}-${dev}-下方显示文字(${action.textContent || '自定义文字'})`;
    }
    case 'display_image':
      return `${room}-${dev}-下方显示图片(${
        action.imageSourceMode === 'order_user_avatar'
          ? '{{订单用户头像}}'
          : action.imageName || '图片'
      })`;
    case 'play_audio':
      if (triggerType === 'ab_door_linkage') {
        return `${room}-${dev}-播放音频(${iconCond} · ${action.audioFileName} · ${action.audioVolume}%)`;
      }
      return `${room}-${dev}-播放音频(${action.audioFileName} · ${action.audioVolume}%)`;
    case 'set_volume':
      return `${room}-${dev}-音量${action.deviceVolume ?? 65}%`;
    case 'open_order_welcome':
      return `${room}-${dev}-开门下单`;
    case 'renew_order':
      return `${room}-${dev}-续费下单`;
    case 'activity_content':
      return `${room}-${dev}-活动内容`;
    default:
      return `${room}-${dev}-未配置操作`;
  }
}

export const INITIAL_AREA_EVENTS: AreaEventRecord[] = [
  {
    id: 'evt-1',
    eventName: '区域2',
    areaName: '区域2',
    triggerType: 'any_order_active',
    actions: [
      {
        ...createDefaultAction(1),
        id: 'act-seed-1',
        roomName: '毒牙台球④',
        deviceId: 'dev-3',
        deviceName: '台球桌顶灯',
        deviceModel: 'GZSO31',
        deviceSn: '18523D000001261001',
        actionType: 'turn_on',
        delaySeconds: 0,
      },
      {
        ...createDefaultAction(2),
        id: 'act-seed-2',
        roomName: '毒牙台球④',
        deviceId: 'dev-2',
        deviceName: '音乐主机',
        deviceModel: 'GWXJS1',
        deviceSn: '000018523D73020201',
        actionType: 'set_volume',
        deviceVolume: 65,
        delaySeconds: 0,
      },
    ],
    updatedAt: '2026-11-13 18:20:10',
  },
  {
    id: 'evt-2',
    eventName: '区域2全部订单关闭',
    areaName: '区域2',
    triggerType: 'no_orders',
    actions: [
      {
        ...createDefaultAction(3),
        id: 'act-seed-3',
        roomName: '毒牙台球④',
        deviceId: 'dev-2',
        deviceName: '音乐主机',
        deviceModel: 'GWXJS1',
        deviceSn: '000018523D73020201',
        actionType: 'turn_off',
        delaySeconds: 0,
      },
    ],
    updatedAt: '2026-11-13 18:25:44',
  },
  {
    id: 'evt-3',
    eventName: '健身房会员人脸迎宾',
    areaName: '健身房主入口',
    triggerType: 'gym_face_open',
    triggerDeviceSn: '18523D000005A99A01',
    actions: [
      {
        ...createDefaultAction(4),
        id: 'act-seed-4',
        roomName: '01',
        deviceId: 'dev-1',
        deviceName: '6',
        deviceModel: 'GZDLS7',
        deviceSn: '18523D000005A99A01',
        actionType: 'display_text',
        textContent: '欢迎 {{订单用户名字}} 莅临健身',
        textPreset: 'bottom-left',
        textX: 32,
        textY: 1140,
        textColor: '#FFFFFF',
        textFontSize: 28,
        textPersistMode: 'seconds',
        textDurationSec: 5,
        delaySeconds: 0,
      },
      {
        ...createDefaultAction(5),
        id: 'act-seed-5',
        roomName: '01',
        deviceId: 'dev-1',
        deviceName: '6',
        deviceModel: 'GZDLS7',
        deviceSn: '18523D000005A99A01',
        actionType: 'display_image',
        imageSourceMode: 'order_user_avatar',
        imageName: '订单用户头像',
        imagePreset: 'center',
        imageX: 280,
        imageY: 600,
        imagePersistMode: 'seconds',
        imageDurationSec: 5,
        delaySeconds: 0,
      },
    ],
    updatedAt: '2026-11-14 01:12:08',
  },
  {
    id: 'evt-4',
    eventName: 'AB门互锁状态屏幕联动播报',
    areaName: '储物柜001',
    triggerType: 'ab_door_linkage',
    abDoorDeviceId: 'ab-3',
    abDoorDeviceSn: '18523DAB000208',
    abDoorDeviceName: '储物区AB联动闸机01',
    abCommand: 'ABReport',
    actions: [
      {
        ...createDefaultAction(6),
        id: 'act-seed-6',
        roomName: 'VIP黑八包间',
        deviceId: 'dev-12',
        deviceName: '门禁考勤终端',
        deviceModel: 'GZDLS7',
        deviceSn: '18523D00003044',
        actionType: 'display_text',
        abIconMatchMode: 'all',
        abIconIdValue: '',
        abTextSourceMode: 'ab_text',
        textContent: 'AB门状态变更提醒',
        textPreset: 'center',
        textX: 280,
        textY: 600,
        textColor: '#FACC15',
        textFontSize: 32,
        textPersistMode: 'seconds',
        textDurationSec: 6,
        delaySeconds: 0,
      },
      {
        ...createDefaultAction(7),
        id: 'act-seed-7',
        roomName: 'VIP黑八包间',
        deviceId: 'dev-12',
        deviceName: '门禁考勤终端',
        deviceModel: 'GZDLS7',
        deviceSn: '18523D00003044',
        actionType: 'play_audio',
        abIconMatchMode: 'specific',
        abIconIdValue: 'ICON_01',
        audioFileName: 'door_open_tip.mps',
        audioDisplayName: '门禁开锁提示音',
        audioVolume: 85,
        delaySeconds: 0,
      },
    ],
    updatedAt: '2026-11-14 01:40:25',
  },
];
