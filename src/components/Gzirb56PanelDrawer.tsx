import React, { useEffect, useState } from 'react';
import {
  Clock,
  Eye,
  Lock,
  Music2,
  QrCode,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DeviceRecord,
  Gzirb56Config,
  Gzirb56PanelTab,
} from '../types/device';
import {
  createInitialGzirb56Config,
  resolveWelcomeText,
} from '../data/gzirb56Data';
import { Gzirb56PreviewModal } from './Gzirb56Previews';

interface Gzirb56PanelDrawerProps {
  device: DeviceRecord | null;
  initialTab: Gzirb56PanelTab;
  config?: Gzirb56Config;
  onUpdateConfig?: (deviceId: string, next: Gzirb56Config) => void;
  onClose: () => void;
  onNotify: (message: string) => void;
}

const OP_TITLES: Record<Gzirb56PanelTab, string> = {
  open_order: '开门下单',
  renew_order: '续费下单',
  activity: '活动内容',
};

export const Gzirb56PanelDrawer: React.FC<Gzirb56PanelDrawerProps> = ({
  device,
  initialTab,
  config: externalConfig,
  onUpdateConfig,
  onClose,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<Gzirb56PanelTab>(initialTab);
  const [localConfig, setLocalConfig] = useState<Gzirb56Config>(
    createInitialGzirb56Config
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const config = externalConfig ?? localConfig;

  const patchConfig = (patch: Partial<Gzirb56Config>) => {
    const next = { ...config, ...patch };
    if (device && onUpdateConfig) {
      onUpdateConfig(device.id, next);
    } else {
      setLocalConfig(next);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
    setPreviewOpen(false);
  }, [initialTab, device?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && device && !previewOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [device, previewOpen, onClose]);

  if (!device) return null;

  const roomName = device.boundRoom || 'A08';

  const handleInsertRoomVar = () => {
    const token = '{{包间名称}}';
    const current = config.welcomeText;
    const next = current ? `${current}${token}` : `欢迎来到${token}`;
    patchConfig({ welcomeText: next });
  };

  const handleSaveOpenOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.welcomeText.trim()) {
      onNotify('请输入开门下单欢迎文字');
      return;
    }
    const resolved = resolveWelcomeText(config.welcomeText, roomName);
    onNotify(
      `已下发「${device.deviceName}」开门下单欢迎页配置（预览文本：${resolved}）`
    );
  };

  const handleSaveRenewOrder = () => {
    onNotify(
      `已确认「${device.deviceName}」续费下单配置（提示时长：距离当前订单结束时长，二维码：绑定包间 ${roomName} 下单二维码）`
    );
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.activityName.trim()) {
      onNotify('请输入活动名称');
      return;
    }
    onNotify(`已下发「${device.deviceName}」活动内容：${config.activityName}`);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gzirb56-drawer-title"
      >
        <div
          className="fixed inset-0 bg-slate-900/35 transition-opacity"
          onClick={onClose}
        />

        <div className="relative z-10 w-full max-w-[680px] bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Top Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <Music2 className="w-4 h-4" />
                </span>
                <h2
                  id="gzirb56-drawer-title"
                  className="text-[16px] font-semibold text-slate-900 truncate"
                >
                  {device.deviceName} · {OP_TITLES[activeTab]}
                </h2>
                <span
                  className={`text-[12px] font-medium whitespace-nowrap ${
                    device.status === '在线'
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  · {device.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-slate-500">
                <span className="font-mono-tabular">SN: {device.gatewaySn}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">Mac: {device.macAddress}</span>
                <span aria-hidden="true">·</span>
                <span>绑定包厢 {roomName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="关闭点歌机操作台"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* TAB 1: 开门下单 */}
            {activeTab === 'open_order' && (
              <form onSubmit={handleSaveOpenOrder} className="space-y-5">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="gzirb56-welcome-text"
                      className="text-[13px] font-semibold text-slate-800"
                    >
                      欢迎文字
                    </label>
                    <button
                      type="button"
                      onClick={handleInsertRoomVar}
                      className="inline-flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      + 插入变量：包间名称
                    </button>
                  </div>

                  <input
                    id="gzirb56-welcome-text"
                    type="text"
                    value={config.welcomeText}
                    onChange={(e) =>
                      patchConfig({ welcomeText: e.target.value })
                    }
                    placeholder="请输入欢迎文字，例如：欢迎光临 {{包间名称}}"
                    className="w-full h-9.5 px-3 text-[13.5px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[12px] text-slate-500">
                    <span>
                      变量{' '}
                      <code className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono-tabular">
                        {'{{包间名称}}'}
                      </code>{' '}
                      将在点歌机屏幕自动替换为当前包间「
                      <span className="font-mono-tabular font-semibold text-slate-800">
                        {roomName}
                      </span>
                      」
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    预览样式
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 h-9 px-5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    保存并下发配置
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: 续费下单 */}
            {activeTab === 'renew_order' && (
              <div className="space-y-5">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-4">
                  {/* Fixed Field 1: 提示时长 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="gzirb56-renew-tip"
                        className="text-[13px] font-semibold text-slate-800"
                      >
                        提示时长
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
                        <Lock className="w-3 h-3" />
                        固定参数 · 不可编辑
                      </span>
                    </div>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="gzirb56-renew-tip"
                        type="text"
                        value={config.renewalTipMode}
                        readOnly
                        disabled
                        className="w-full h-9.5 pl-9 pr-3 text-[13px] font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-md cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* Fixed Field 2: 续单二维码 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="gzirb56-renew-qr"
                        className="text-[13px] font-semibold text-slate-800"
                      >
                        续单二维码
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
                        <Lock className="w-3 h-3" />
                        固定参数 · 不可编辑
                      </span>
                    </div>
                    <div className="relative">
                      <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="gzirb56-renew-qr"
                        type="text"
                        value={`${config.renewalQrMode}（${roomName}）`}
                        readOnly
                        disabled
                        className="w-full h-9.5 pl-9 pr-3 text-[13px] font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-md cursor-not-allowed select-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    预览样式（提醒 + 续单成功）
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveRenewOrder}
                    className="inline-flex items-center gap-1.5 h-9 px-5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    确认下发续费规则
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: 活动内容 */}
            {activeTab === 'activity' && (
              <form onSubmit={handleSaveActivity} className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="gzirb56-act-name"
                        className="block text-[12.5px] font-medium text-slate-700 mb-1"
                      >
                        活动名称
                      </label>
                      <input
                        id="gzirb56-act-name"
                        type="text"
                        value={config.activityName}
                        onChange={(e) =>
                          patchConfig({ activityName: e.target.value })
                        }
                        placeholder="请输入活动名称"
                        className="w-full h-9 px-3 text-[13px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gzirb56-act-time"
                        className="block text-[12.5px] font-medium text-slate-700 mb-1"
                      >
                        活动时间
                      </label>
                      <input
                        id="gzirb56-act-time"
                        type="text"
                        value={config.activityTime}
                        onChange={(e) =>
                          patchConfig({ activityTime: e.target.value })
                        }
                        placeholder="例如：每日 18:00 - 02:00"
                        className="w-full h-9 px-3 text-[13px] font-mono-tabular bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="gzirb56-act-desc"
                      className="block text-[12.5px] font-medium text-slate-700 mb-1"
                    >
                      活动描述
                    </label>
                    <input
                      id="gzirb56-act-desc"
                      type="text"
                      value={config.activityDesc}
                      onChange={(e) =>
                        patchConfig({ activityDesc: e.target.value })
                      }
                      placeholder="请输入活动简要描述"
                      className="w-full h-9 px-3 text-[13px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gzirb56-act-content"
                      className="block text-[12.5px] font-medium text-slate-700 mb-1"
                    >
                      活动内容
                    </label>
                    <textarea
                      id="gzirb56-act-content"
                      rows={3}
                      value={config.activityContent}
                      onChange={(e) =>
                        patchConfig({ activityContent: e.target.value })
                      }
                      placeholder="请输入活动详细规则或权益内容"
                      className="w-full px-3 py-2 text-[13px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="gzirb56-act-discount"
                        className="block text-[12.5px] font-medium text-slate-700 mb-1"
                      >
                        活动折扣
                      </label>
                      <input
                        id="gzirb56-act-discount"
                        type="text"
                        value={config.activityDiscount}
                        onChange={(e) =>
                          patchConfig({ activityDiscount: e.target.value })
                        }
                        placeholder="例如：7.8折 / 减50元"
                        className="w-full h-9 px-3 text-[13px] font-mono-tabular bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gzirb56-act-discount-desc"
                        className="block text-[12.5px] font-medium text-slate-700 mb-1"
                      >
                        折扣描述
                      </label>
                      <input
                        id="gzirb56-act-discount-desc"
                        type="text"
                        value={config.discountDesc}
                        onChange={(e) =>
                          patchConfig({ discountDesc: e.target.value })
                        }
                        placeholder="请输入折扣适用说明"
                        className="w-full h-9 px-3 text-[13px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    预览样式
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 h-9 px-5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    保存并下发活动
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Gzirb56PreviewModal
        isOpen={previewOpen}
        tab={activeTab}
        roomName={roomName}
        config={config}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
};
