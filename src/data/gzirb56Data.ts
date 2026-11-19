import { Gzirb56Config } from '../types/device';

export function createInitialGzirb56Config(): Gzirb56Config {
  return {
    welcomeText: '欢迎光临',
    renewalTipMode: '距离当前订单结束时长',
    renewalQrMode: '绑定包间下单二维码',
    activityName: '欢唱畅饮夜',
    activityDesc: '黄金时段欢唱套餐 · 限时放送',
    activityTime: '每周五至周日 · 20:00—24:00',
    activityContent: '活动详情请咨询服务人员',
    activityDiscount: '8.8折',
    discountDesc: '指定套餐',
  };
}

export function resolveWelcomeText(template: string, roomName: string): string {
  const room = roomName.trim() || 'A08';
  const raw = template.trim() || '欢迎光临';
  return raw.replace(/\{\{\s*包间名称\s*\}\}/g, room);
}
