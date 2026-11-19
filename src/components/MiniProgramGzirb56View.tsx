import React, { useEffect, useState } from 'react';
import { Clock, Eye, Lock, QrCode, Send, Sparkles } from 'lucide-react';
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

interface MiniProgramGzirb56ViewProps {
  device: DeviceRecord;
  initialTab?: Gzirb56PanelTab;
  config?: Gzirb56Config;
  onUpdateConfig?: (deviceId: string, next: Gzirb56Config) => void;
  onNotify: (message: string) => void;
}

const FEATURE_TABS: { key: Gzirb56PanelTab; label: string }[] = [
  { key: 'open_order', label: '开门下单' },
  { key: 'renew_order', label: '续费下单' },
  { key: 'activity', label: '活动内容' },
];

export const MiniProgramGzirb56View: React.FC<MiniProgramGzirb56ViewProps> = ({
  device,
  initialTab = 'open_order',
  config: externalConfig,
  onUpdateConfig,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<Gzirb56PanelTab>(initialTab);
  const [localConfig, setLocalConfig] = useState<Gzirb56Config>(
    createInitialGzirb56Config
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, device.id]);

  const config = externalConfig ?? localConfig;
  const roomName = device.boundRoom || 'A08';

  const patchConfig = (patch: Partial<Gzirb56Config>) => {
    const next = { ...config, ...patch };
    if (onUpdateConfig) {
      onUpdateConfig(device.id, next);
    } else {
      setLocalConfig(next);
    }
  };

  const handleInsertRoomVar = () => {
    const token = '{{包间名称}}';
    const current = config.welcomeText;
    const next = current ? `${current}${token}` : `欢迎来到${token}`;
    patchConfig({ welcomeText: next });
  };

  const handleSaveOpenOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.welcomeText.trim()) {
      onNotify('请输入欢迎文字');
      return;
    }
    const resolved = resolveWelcomeText(config.welcomeText, roomName);
    onNotify(`已保存开门下单配置：${resolved}`);
  };

  const handleSaveRenewOrder = () => {
    onNotify(`已确认「${device.deviceName}」续费下单配置（包间 ${roomName}）`);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.activityName.trim()) {
      onNotify('请输入活动名称');
      return;
    }
    onNotify(`已保存活动内容「${config.activityName}」`);
  };

  return (
    <div className="flex flex-col">
      {/* Flush Single-Page Feature Switcher (Matches App Underline Tabs) */}
      <div className="bg-white border-b border-slate-200 grid grid-cols-3">
        {FEATURE_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 text-[12.5px] border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#4B996E] text-[#2F7551] font-semibold bg-emerald-50/30'
                  : 'border-transparent text-slate-600 font-medium hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Feature Body */}
      <div className="p-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3.5">
          {/* Device Quick Meta */}
          <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between text-[11.5px] text-slate-500">
            <span className="truncate font-medium text-slate-700">
              {device.deviceName} · {device.model}
            </span>
            <span className="font-mono-tabular shrink-0">包间 {roomName}</span>
          </div>

          {/* 1. 开门下单 */}
          {activeTab === 'open_order' && (
            <form onSubmit={handleSaveOpenOrder} className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="mp-gzirb56-welcome"
                    className="text-[12.5px] font-medium text-slate-700"
                  >
                    欢迎文字
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertRoomVar}
                    className="inline-flex items-center gap-1 h-6.5 px-2 text-[11px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 rounded cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    + 插入变量：包间名称
                  </button>
                </div>

                <input
                  id="mp-gzirb56-welcome"
                  type="text"
                  value={config.welcomeText}
                  onChange={(e) => patchConfig({ welcomeText: e.target.value })}
                  placeholder="请输入欢迎文字"
                  className="w-full h-9 px-3 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  可插入{' '}
                  <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-700 font-mono-tabular">
                    {'{{包间名称}}'}
                  </code>
                  ，预览时将自动渲染为当前包间「{roomName}」。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览样式
                </button>
                <button
                  type="submit"
                  className="h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  保存并下发
                </button>
              </div>
            </form>
          )}

          {/* 2. 续费下单 */}
          {activeTab === 'renew_order' && (
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12.5px] font-medium text-slate-700">
                    提示时长
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3" />
                    不可编辑
                  </span>
                </div>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={config.renewalTipMode}
                    readOnly
                    disabled
                    className="w-full h-9 pl-8 pr-3 text-[12.5px] text-slate-600 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12.5px] font-medium text-slate-700">
                    续单二维码
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3" />
                    不可编辑
                  </span>
                </div>
                <div className="relative">
                  <QrCode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={`${config.renewalQrMode}（${roomName}）`}
                    readOnly
                    disabled
                    className="w-full h-9 pl-8 pr-3 text-[12.5px] text-slate-600 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="h-9 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览样式
                </button>
                <button
                  type="button"
                  onClick={handleSaveRenewOrder}
                  className="h-9 inline-flex items-center justify-center gap-1 text-[12.5px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  确认下发
                </button>
              </div>
            </div>
          )}

          {/* 3. 活动内容 */}
          {activeTab === 'activity' && (
            <form onSubmit={handleSaveActivity} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  活动名称
                </label>
                <input
                  type="text"
                  value={config.activityName}
                  onChange={(e) => patchConfig({ activityName: e.target.value })}
                  placeholder="请输入活动名称"
                  className="w-full h-8.5 px-2.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  活动描述
                </label>
                <input
                  type="text"
                  value={config.activityDesc}
                  onChange={(e) => patchConfig({ activityDesc: e.target.value })}
                  placeholder="请输入活动描述"
                  className="w-full h-8.5 px-2.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  活动时间
                </label>
                <input
                  type="text"
                  value={config.activityTime}
                  onChange={(e) => patchConfig({ activityTime: e.target.value })}
                  placeholder="请输入活动时间"
                  className="w-full h-8.5 px-2.5 text-[12.5px] font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  活动内容
                </label>
                <textarea
                  rows={2}
                  value={config.activityContent}
                  onChange={(e) =>
                    patchConfig({ activityContent: e.target.value })
                  }
                  placeholder="请输入活动详细内容"
                  className="w-full px-2.5 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    活动折扣
                  </label>
                  <input
                    type="text"
                    value={config.activityDiscount}
                    onChange={(e) =>
                      patchConfig({ activityDiscount: e.target.value })
                    }
                    placeholder="如：7.8折"
                    className="w-full h-8.5 px-2.5 text-[12.5px] font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    折扣描述
                  </label>
                  <input
                    type="text"
                    value={config.discountDesc}
                    onChange={(e) =>
                      patchConfig({ discountDesc: e.target.value })
                    }
                    placeholder="折扣说明"
                    className="w-full h-8.5 px-2.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="h-9 inline-flex items-center justify-center gap-1 text-[12.5px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览样式
                </button>
                <button
                  type="submit"
                  className="h-9 inline-flex items-center justify-center gap-1 text-[12.5px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  保存并下发
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* App-styled Preview Modal */}
      <Gzirb56PreviewModal
        isOpen={previewOpen}
        tab={activeTab}
        roomName={roomName}
        config={config}
        variant="app"
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
