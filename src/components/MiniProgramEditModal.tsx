import React, { useEffect, useState } from 'react';
import {
  Battery,
  BatteryWarning,
  Lock,
  Power,
  Radio,
  RefreshCw,
  Volume2,
  X,
} from 'lucide-react';
import { DevicePurpose, DeviceRecord } from '../types/device';
import { PURPOSE_OPTIONS } from '../data/mockDevices';

interface MiniProgramEditModalProps {
  device: DeviceRecord | null;
  onClose: () => void;
  onSave: (
    deviceId: string,
    updates: {
      deviceName: string;
      sortOrder: number;
      enabled: boolean;
      boundRoom: string;
      purpose: DevicePurpose;
    }
  ) => void;
  onQuerySignal: (deviceId: string) => Promise<void>;
  onAdjustVolume: (deviceId: string, nextVolume: number) => void;
}

function getSignalLabel(signal: number): { text: string; cls: string } {
  if (signal === 0) return { text: '未上报', cls: 'text-slate-500' };
  if (signal >= -50) return { text: '信号极佳', cls: 'text-emerald-700' };
  if (signal >= -65) return { text: '信号良好', cls: 'text-blue-700' };
  return { text: '信号较弱', cls: 'text-amber-700' };
}

export const MiniProgramEditModal: React.FC<MiniProgramEditModalProps> = ({
  device,
  onClose,
  onSave,
  onQuerySignal,
  onAdjustVolume,
}) => {
  const [deviceName, setDeviceName] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [boundRoom, setBoundRoom] = useState('');
  const [purpose, setPurpose] = useState<DevicePurpose>('普通设备');
  const [isQueryingSignal, setIsQueryingSignal] = useState(false);

  useEffect(() => {
    if (!device) return;
    setDeviceName(device.deviceName);
    setSortOrder(device.sortOrder);
    setEnabled(device.enabled);
    setBoundRoom(device.boundRoom);
    setPurpose(device.purpose);
  }, [device?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && device) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [device, onClose]);

  if (!device) return null;

  const signalMeta = getSignalLabel(device.signalStrength);
  const isLowBattery = device.batteryLevel !== null && device.batteryLevel <= 20;

  const handleSignalQuery = async () => {
    setIsQueryingSignal(true);
    await onQuerySignal(device.id);
    setIsQueryingSignal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(device.id, {
      deviceName: deviceName.trim() || device.deviceName,
      sortOrder: Math.max(1, sortOrder),
      enabled,
      boundRoom: boundRoom.trim(),
      purpose,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mp-edit-title"
    >
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[410px] max-h-[88vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                id="mp-edit-title"
                className="text-[16px] font-semibold text-slate-900"
              >
                编辑与设备详情
              </h2>
              <span className="font-mono-tabular text-[12px] text-slate-500">
                {device.model}
              </span>
              <span
                className={`text-[12px] font-medium ${
                  device.status === '在线' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                · {device.status}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] font-mono-tabular text-slate-500">
              DevSN: {device.macAddress}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭编辑弹窗"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Basic Editable Settings */}
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <label
                htmlFor="mp-dev-name"
                className="text-[13px] font-medium text-slate-600 shrink-0 w-20"
              >
                设备名称
              </label>
              <input
                id="mp-dev-name"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="flex-1 h-8 px-2.5 text-[13px] text-slate-900 border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <label
                htmlFor="mp-dev-sort"
                className="text-[13px] font-medium text-slate-600 shrink-0 w-20"
              >
                设备排序
              </label>
              <input
                id="mp-dev-sort"
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 1)}
                className="flex-1 h-8 px-2.5 text-[13px] font-mono-tabular text-slate-900 border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="px-4 py-2.5 flex items-center gap-4">
              <span className="text-[13px] font-medium text-slate-600 shrink-0 w-20">
                是否启用
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-[13px] text-slate-700">
                  {enabled ? '已启用' : '已停用'}
                </span>
              </label>
            </div>

            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <span className="text-[13px] font-medium text-slate-600 shrink-0 w-20">
                绑定包间
              </span>
              <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                <input
                  type="text"
                  value={boundRoom}
                  onChange={(e) => setBoundRoom(e.target.value)}
                  placeholder="未绑定包间"
                  className="flex-1 h-8 px-2.5 text-[13px] text-slate-900 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 min-w-0"
                />
                {boundRoom ? (
                  <button
                    type="button"
                    onClick={() => setBoundRoom('')}
                    className="h-8 px-3 text-[12px] font-medium text-white bg-[#3B8B62] hover:bg-[#2F7551] rounded whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    解绑
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBoundRoom(`台球桌[${device.storeName}]`)}
                    className="h-8 px-3 text-[12px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    快速绑定
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <label
                htmlFor="mp-dev-purpose"
                className="text-[13px] font-medium text-slate-600 shrink-0 w-20"
              >
                设备用处
              </label>
              <select
                id="mp-dev-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as DevicePurpose)}
                className="flex-1 h-8 px-2.5 text-[13px] text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* "更多" Extended State & Signal Diagnostics (6 required items) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[13.5px] font-semibold text-slate-900">
                更多（设备扩展状态获取）
              </h3>
              <span className="text-[11.5px] font-mono-tabular text-slate-400">
                最近查询：{device.lastSignalQueryTime}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. 设备开关状态 */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  <span>设备开关状态</span>
                  <Power className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span
                    className={`text-[16px] font-semibold ${
                      device.switchState === '开'
                        ? 'text-emerald-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {device.switchState}
                  </span>
                  <span className="text-[11.5px] text-slate-400">
                    {device.switchState === '开' ? '通电运行' : '已断开'}
                  </span>
                </div>
              </div>

              {/* 2. 设备电量 */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  <span>设备电量</span>
                  {isLowBattery ? (
                    <BatteryWarning className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <div className="mt-1.5">
                  {device.batteryLevel !== null ? (
                    <span
                      className={`text-[16px] font-semibold font-mono-tabular ${
                        isLowBattery ? 'text-amber-700' : 'text-slate-900'
                      }`}
                    >
                      {device.batteryLevel}%
                      {isLowBattery && (
                        <span className="ml-1.5 text-[11px] font-normal">
                          低电量
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium text-slate-600">
                      外接供电 / 无电池
                    </span>
                  )}
                </div>
              </div>

              {/* 3. 门锁 */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  <span>门锁</span>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="mt-1.5">
                  {device.doorLockId ? (
                    <span className="text-[13px] font-semibold font-mono-tabular text-slate-900 break-all">
                      {device.doorLockId}
                    </span>
                  ) : (
                    <span className="text-[13px] text-slate-400">未绑定门锁</span>
                  )}
                </div>
              </div>

              {/* 4. 音量 */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  <span>音量</span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  {device.volume !== null ? (
                    <>
                      <span className="text-[16px] font-semibold font-mono-tabular text-slate-900">
                        {device.volume}%
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onAdjustVolume(device.id, Math.max(0, device.volume! - 5))
                          }
                          className="w-6 h-6 text-[13px] font-medium bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAdjustVolume(device.id, Math.min(100, device.volume! + 5))
                          }
                          className="w-6 h-6 text-[13px] font-medium bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-[13px] text-slate-400">不支持音量</span>
                  )}
                </div>
              </div>

              {/* 5. 设备信号 & 6. 设备信号查询 */}
              <div className="col-span-2 p-3.5 border border-slate-200 rounded-lg bg-white flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    <span>设备信号</span>
                    <span className={`font-medium ${signalMeta.cls}`}>
                      · {signalMeta.text}
                    </span>
                  </div>
                  <div className="mt-1 text-[17px] font-semibold font-mono-tabular text-slate-900">
                    {device.signalStrength === 0
                      ? '0'
                      : `${device.signalStrength} dBm`}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isQueryingSignal}
                  onClick={handleSignalQuery}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[12.5px] font-medium text-white bg-[#3B8B62] hover:bg-[#2F7551] disabled:opacity-60 rounded-md whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isQueryingSignal ? 'animate-spin' : ''}`}
                  />
                  {isQueryingSignal ? '查询中...' : '设备信号查询'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer"
          >
            关闭
          </button>
          <button
            type="submit"
            className="h-9 text-[13px] font-medium text-white bg-[#3B8B62] hover:bg-[#2F7551] rounded-md cursor-pointer"
          >
            确定
          </button>
        </div>
      </form>
    </div>
  );
};
