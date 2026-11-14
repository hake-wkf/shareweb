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
import { DeviceRecord } from '../types/device';

interface DeviceMoreDrawerProps {
  device: DeviceRecord | null;
  onClose: () => void;
  onQuerySignal: (deviceId: string) => Promise<void>;
  onRefreshAllDetails: (deviceId: string) => Promise<void>;
  onAdjustVolume: (deviceId: string, nextVolume: number) => void;
}

function getSignalDescriptor(signal: number): {
  label: string;
  toneClass: string;
} {
  if (signal === 0) {
    return { label: '未上报', toneClass: 'text-slate-500' };
  }
  if (signal >= -50) {
    return { label: '信号极佳', toneClass: 'text-emerald-700' };
  }
  if (signal >= -65) {
    return { label: '信号良好', toneClass: 'text-blue-700' };
  }
  return { label: '信号较弱', toneClass: 'text-amber-700' };
}

export const DeviceMoreDrawer: React.FC<DeviceMoreDrawerProps> = ({
  device,
  onClose,
  onQuerySignal,
  onRefreshAllDetails,
  onAdjustVolume,
}) => {
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [isQueryingSignal, setIsQueryingSignal] = useState(false);

  useEffect(() => {
    if (!device) return;
    setIsFetchingAll(true);
    const timer = window.setTimeout(() => {
      setIsFetchingAll(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [device?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && device) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [device, onClose]);

  if (!device) return null;

  const signalInfo = getSignalDescriptor(device.signalStrength);
  const isLowBattery = device.batteryLevel !== null && device.batteryLevel <= 20;

  const handleRefreshAll = async () => {
    setIsFetchingAll(true);
    await onRefreshAllDetails(device.id);
    setIsFetchingAll(false);
  };

  const handleSignalQuery = async () => {
    setIsQueryingSignal(true);
    await onQuerySignal(device.id);
    setIsQueryingSignal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-device-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative z-10 w-full max-w-[460px] bg-white h-full border-l border-slate-200 shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2
                id="drawer-device-title"
                className="text-[16px] font-semibold text-slate-900 truncate"
              >
                {device.deviceName}
              </h2>
              <span
                className={`text-[12px] font-medium whitespace-nowrap ${
                  device.status === '在线' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                · {device.status}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
              <span className="font-mono-tabular">{device.model}</span>
              <span aria-hidden="true">·</span>
              <span>包厢 {device.boundRoom}</span>
              <span aria-hidden="true">·</span>
              <span>{device.storeName}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭更多详情"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Device identification summary */}
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
            <div className="px-4 py-2.5 flex items-center justify-between text-[13px]">
              <span className="text-slate-500">网关 SN</span>
              <span className="font-mono-tabular text-slate-800">{device.gatewaySn}</span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Mac 地址</span>
              <span className="font-mono-tabular text-slate-800">{device.macAddress}</span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between text-[13px]">
              <span className="text-slate-500">加盟商</span>
              <span className="text-slate-800">{device.franchisee}</span>
            </div>
          </div>

          {/* 6 Requested Parameters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-slate-900">
                设备扩展状态与诊断
              </h3>
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isFetchingAll}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetchingAll ? 'animate-spin' : ''}`}
                />
                {isFetchingAll ? '获取中...' : '刷新状态'}
              </button>
            </div>

            {isFetchingAll ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-[78px] rounded-lg border border-slate-200 bg-slate-50 animate-pulse ${
                      idx === 4 ? 'col-span-2' : ''
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* 1. 设备开关状态 */}
                <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between text-[12px] text-slate-500">
                    <span>设备开关状态</span>
                    <Power className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className={`text-[18px] font-semibold ${
                        device.switchState === '开'
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {device.switchState}
                    </span>
                    <span className="text-[12px] text-slate-400">
                      {device.switchState === '开' ? '通电运行中' : '已断开输出'}
                    </span>
                  </div>
                </div>

                {/* 2. 设备电量 */}
                <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between text-[12px] text-slate-500">
                    <span>设备电量</span>
                    {isLowBattery ? (
                      <BatteryWarning className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Battery className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    {device.batteryLevel !== null ? (
                      <>
                        <span
                          className={`text-[18px] font-semibold font-mono-tabular ${
                            isLowBattery ? 'text-amber-700' : 'text-slate-900'
                          }`}
                        >
                          {device.batteryLevel}%
                        </span>
                        <span
                          className={`text-[12px] ${
                            isLowBattery ? 'text-amber-600 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {isLowBattery ? '电量偏低' : '电量正常'}
                        </span>
                      </>
                    ) : (
                      <span className="text-[14px] font-medium text-slate-500">
                        外接供电 / 无电池
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. 门锁 */}
                <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between text-[12px] text-slate-500">
                    <span>门锁</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="mt-2">
                    {device.doorLockId ? (
                      <span className="text-[14px] font-semibold font-mono-tabular text-slate-900 break-all">
                        {device.doorLockId}
                      </span>
                    ) : (
                      <span className="text-[14px] font-medium text-slate-400">
                        未绑定门锁
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. 音量 */}
                <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between text-[12px] text-slate-500">
                    <span>音量</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {device.volume !== null ? (
                      <>
                        <span className="text-[18px] font-semibold font-mono-tabular text-slate-900">
                          {device.volume}%
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onAdjustVolume(device.id, Math.max(0, device.volume! - 5))
                            }
                            aria-label="降低音量"
                            className="w-6 h-6 text-[13px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onAdjustVolume(device.id, Math.min(100, device.volume! + 5))
                            }
                            aria-label="增大音量"
                            className="w-6 h-6 text-[13px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-[14px] font-medium text-slate-400">
                        不支持音量
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. 设备信号 & 6. 设备信号查询 */}
                <div className="col-span-2 p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span>设备信号</span>
                    </div>
                    <span className={`text-[12px] font-medium ${signalInfo.toneClass}`}>
                      {signalInfo.label}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[20px] font-semibold font-mono-tabular text-slate-900">
                        {device.signalStrength === 0
                          ? '0'
                          : `${device.signalStrength} dBm`}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400 font-mono-tabular">
                        最近查询：{device.lastSignalQueryTime}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignalQuery}
                      disabled={isQueryingSignal}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isQueryingSignal ? 'animate-spin' : ''}`}
                      />
                      {isQueryingSignal ? '信号查询中...' : '设备信号查询'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
