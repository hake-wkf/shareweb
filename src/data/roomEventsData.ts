import {
  DeviceRecord,
  RoomEventDeviceAction,
  RoomEventItem,
} from '../types/device';
import { createInitialGzirb56Config } from './gzirb56Data';

export interface RoomEventOperationOption {
  value: string;
  label: string;
  paramPresets: string[];
}

export const STANDARD_ROOM_EVENT_TEMPLATES: {
  eventKey: string;
  eventName: string;
  triggerCondition: string;
}[] = [
  {
    eventKey: 'ArrivalRoomEvent',
    eventName: '包厢开门事件',
    triggerCondition: '用户首次点击开门',
  },
  {
    eventKey: 'OrderWillExpiredEvent',
    eventName: '订单结束前15分钟语音事件',
    triggerCondition: '用户订单结束前15分钟',
  },
  {
    eventKey: 'OrderExpiredEvent',
    eventName: '订单到期结束事件',
    triggerCondition: '订单到期结束事件',
  },
  {
    eventKey: 'ContinueOrderEvent',
    eventName: '订单续费事件',
    triggerCondition: '出现续费订单时',
  },
  {
    eventKey: 'LeaveRoomEvent',
    eventName: '离开包厢事件',
    triggerCondition: '用户订单结束',
  },
  {
    eventKey: 'LeaveShopEvent',
    eventName: '保洁离开包厢事件',
    triggerCondition: '保洁每次点击打扫完成时',
  },
  {
    eventKey: 'ArrivalShopEvent',
    eventName: '保洁包厢开门事件',
    triggerCondition: '保洁每次点击开门时',
  },
  {
    eventKey: 'ArrivalLookDoorEvent',
    eventName: '订单操作页开门',
    triggerCondition: '订单操作页开门',
  },
];

export function getRoomEventOperationsByDevice(
  device: DeviceRecord | undefined
): RoomEventOperationOption[] {
  if (!device) return [];

  if (device.model === 'GZIRB56' || device.testMode === 'gzirb56') {
    return [
      {
        value: 'open_order_welcome',
        label: '开门下单',
        paramPresets: ['下发迎宾欢迎页', '自定义欢迎文字（支持{{包间名称}}）'],
      },
      {
        value: 'renew_order',
        label: '续费下单',
        paramPresets: ['固定：距离当前订单结束时长 + 绑定包间下单二维码'],
      },
      {
        value: 'activity_content',
        label: '活动内容',
        paramPresets: ['下发活动公告卡片', '自定义活动折扣内容'],
      },
    ];
  }

  if (device.model === 'GZDLS7' || device.testMode === 'gzdls7') {
    return [
      {
        value: 'UnlockDoor',
        label: '开门',
        paramPresets: ['默认参数（无）', '{"Duration":5}'],
      },
      {
        value: 'DisplayText',
        label: '下方显示文字',
        paramPresets: ['欢迎光临', '订单即将结束，请及时续费'],
      },
      {
        value: 'DisplayImage',
        label: '下方显示图片',
        paramPresets: ['迎宾欢迎画面', '门禁扫码提示图'],
      },
      {
        value: 'PlayAudio',
        label: '播放音频',
        paramPresets: ['welcome_guest.mps', 'order_expiring_15m.mps'],
      },
    ];
  }

  if (device.testMode === 'lock') {
    return [
      {
        value: 'UnlockDoor',
        label: 'UnlockDoor（开锁）',
        paramPresets: ['默认参数（无）', '{"AutoLockSec":5}'],
      },
      {
        value: 'LockDoor',
        label: 'LockDoor（关锁）',
        paramPresets: ['默认参数（无）'],
      },
    ];
  }

  if (device.model === 'GWXJS1') {
    return [
      {
        value: 'On',
        label: 'On（开启）',
        paramPresets: ['默认参数（无）'],
      },
      {
        value: 'Off',
        label: 'Off（关闭）',
        paramPresets: ['默认参数（无）'],
      },
      {
        value: 'KTVDevcieGeneralCmd_Volume',
        label: 'KTVDevcieGeneralCmd_Volume（音量）',
        paramPresets: [
          '{"CommandValue":12}',
          '{"CommandValue":40}',
          '{"CommandValue":65}',
          '{"CommandValue":80}',
        ],
      },
    ];
  }

  return [
    {
      value: 'On',
      label: 'On（开启）',
      paramPresets: ['默认参数（无）', '{"DelayOff":0}'],
    },
    {
      value: 'Off',
      label: 'Off（关闭）',
      paramPresets: ['默认参数（无）'],
    },
  ];
}

function buildSeedActionsForA08(eventKey: string): RoomEventDeviceAction[] {
  const baseConfig = createInitialGzirb56Config();

  if (eventKey === 'ArrivalRoomEvent') {
    return [
      {
        id: 'rea-a08-1',
        executionOrder: 1,
        actionType: 'Command',
        deviceId: 'dev-3',
        deviceSn: '588E81959823250A01',
        deviceName: '入门灯',
        deviceModel: 'GZSO31',
        operation: 'On',
        operationLabel: 'On',
        params: '',
        delayMs: 0,
      },
      {
        id: 'rea-a08-2',
        executionOrder: 1,
        actionType: 'Command',
        deviceId: 'dev-4',
        deviceSn: '588E81959823A88101',
        deviceName: '门牌灯',
        deviceModel: 'GZSO31',
        operation: 'On',
        operationLabel: 'On',
        params: '',
        delayMs: 0,
      },
      {
        id: 'rea-a08-3',
        executionOrder: 1,
        actionType: 'Command',
        deviceId: 'dev-7',
        deviceSn: '588E8195982298E701',
        deviceName: '门锁',
        deviceModel: 'GZIRB52',
        operation: 'UnlockDoor',
        operationLabel: 'UnlockDoor',
        params: '',
        delayMs: 0,
      },
      {
        id: 'rea-a08-4',
        executionOrder: 2,
        actionType: 'Command',
        deviceId: 'dev-ktv-1',
        deviceSn: '18523D000056A081',
        deviceName: 'KTV智能点歌机',
        deviceModel: 'GZIRB56',
        operation: 'open_order_welcome',
        operationLabel: '开门下单',
        params: '欢迎文字：欢迎光临 {{包间名称}}',
        delayMs: 2000,
        gzirb56Config: {
          ...baseConfig,
          welcomeText: '欢迎光临 {{包间名称}}',
        },
      },
      {
        id: 'rea-a08-5',
        executionOrder: 2,
        actionType: 'Command',
        deviceId: 'dev-2',
        deviceSn: '000018523D00B46E01',
        deviceName: 'KTV功放机',
        deviceModel: 'GWXJS1',
        operation: 'On',
        operationLabel: 'On',
        params: '',
        delayMs: 0,
      },
      {
        id: 'rea-a08-6',
        executionOrder: 4,
        actionType: 'Command',
        deviceId: 'dev-2',
        deviceSn: '000018523D00B46E01',
        deviceName: 'KTV功放机',
        deviceModel: 'GWXJS1',
        operation: 'KTVDevcieGeneralCmd_Volume',
        operationLabel: 'KTVDevcieGeneralCmd_Volume',
        params: '{"CommandValue":12}',
        delayMs: 6000,
      },
    ];
  }

  if (eventKey === 'OrderWillExpiredEvent') {
    return [
      {
        id: 'rea-a08-exp-1',
        executionOrder: 1,
        actionType: 'Command',
        deviceId: 'dev-ktv-1',
        deviceSn: '18523D000056A081',
        deviceName: 'KTV智能点歌机',
        deviceModel: 'GZIRB56',
        operation: 'renew_order',
        operationLabel: '续费下单',
        params: '距离当前订单结束时长 · 绑定包间下单二维码',
        delayMs: 0,
        gzirb56Config: { ...baseConfig },
      },
    ];
  }

  if (eventKey === 'ContinueOrderEvent') {
    return [
      {
        id: 'rea-a08-cont-1',
        executionOrder: 1,
        actionType: 'Command',
        deviceId: 'dev-ktv-1',
        deviceSn: '18523D000056A081',
        deviceName: 'KTV智能点歌机',
        deviceModel: 'GZIRB56',
        operation: 'activity_content',
        operationLabel: '活动内容',
        params: `${baseConfig.activityName}（${baseConfig.activityDiscount}）`,
        delayMs: 0,
        gzirb56Config: { ...baseConfig },
      },
    ];
  }

  if (eventKey === 'LeaveRoomEvent' || eventKey === 'OrderExpiredEvent') {
    return [
      {
        id: `rea-a08-${eventKey}-1`,
        executionOrder: 1,
        actionType: 'Command',
        deviceId: 'dev-3',
        deviceSn: '588E81959823250A01',
        deviceName: '入门灯',
        deviceModel: 'GZSO31',
        operation: 'Off',
        operationLabel: 'Off',
        params: '',
        delayMs: 0,
      },
      {
        id: `rea-a08-${eventKey}-2`,
        executionOrder: 2,
        actionType: 'Command',
        deviceId: 'dev-2',
        deviceSn: '000018523D00B46E01',
        deviceName: 'KTV功放机',
        deviceModel: 'GWXJS1',
        operation: 'Off',
        operationLabel: 'Off',
        params: '',
        delayMs: 1000,
      },
    ];
  }

  return [];
}

export function createRoomEventsForRoom(roomName: string): RoomEventItem[] {
  return STANDARD_ROOM_EVENT_TEMPLATES.map((tpl, idx) => ({
    id: `re-${roomName}-${tpl.eventKey}-${idx}`,
    roomName,
    eventKey: tpl.eventKey,
    eventName: tpl.eventName,
    triggerCondition: tpl.triggerCondition,
    actions:
      roomName === 'A08'
        ? buildSeedActionsForA08(tpl.eventKey)
        : idx === 0
        ? [
            {
              id: `rea-${roomName}-default-1`,
              executionOrder: 1,
              actionType: 'Command',
              deviceId: 'dev-5',
              deviceSn: '18523D000001555601',
              deviceName: '包间主照明开关',
              deviceModel: 'GZSO31',
              operation: 'On',
              operationLabel: 'On',
              params: '',
              delayMs: 0,
            },
          ]
        : [],
  }));
}

export const INITIAL_ROOM_EVENTS: RoomEventItem[] = [
  ...createRoomEventsForRoom('A08'),
  ...createRoomEventsForRoom('VIP黑八包间'),
  ...createRoomEventsForRoom('毒牙台球④'),
  ...createRoomEventsForRoom('乔氏台球①'),
  ...createRoomEventsForRoom('棋牌泡茶③'),
];
