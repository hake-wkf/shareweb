import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Eye, Lock, QrCode, Sparkles, X } from 'lucide-react';
import {
  DeviceRecord,
  Gzirb56Config,
  Gzirb56PanelTab,
  RoomEventDeviceAction,
} from '../types/device';
import { createInitialGzirb56Config } from '../data/gzirb56Data';
import { getRoomEventOperationsByDevice } from '../data/roomEventsData';
import { Gzirb56PreviewModal } from './Gzirb56Previews';

interface RoomEventActionModalProps {
  isOpen: boolean;
  roomName: string;
  devices: DeviceRecord[];
  editingAction: RoomEventDeviceAction | null;
  defaultStep: number;
  variant?: 'web' | 'app';
  onClose: () => void;
  onSave: (action: RoomEventDeviceAction) => void;
}

export const RoomEventActionModal: React.FC<RoomEventActionModalProps> = ({
  isOpen,
  roomName,
  devices,
  editingAction,
  defaultStep,
  variant = 'web',
  onClose,
  onSave,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [operation, setOperation] = useState('');
  const [paramPreset, setParamPreset] = useState('');
  const [customParam, setCustomParam] = useState('');
  const [delayMs, setDelayMs] = useState(0);
  const [executionOrder, setExecutionOrder] = useState(1);
  const [gzirb56Config, setGzirb56Config] = useState<Gzirb56Config>(
    createInitialGzirb56Config
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isApp = variant === 'app';

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      const score = (d: DeviceRecord) =>
        d.model === 'GZIRB56'
          ? 0
          : d.boundRoom === roomName
          ? 1
          : d.model === 'GZDLS7'
          ? 2
          : 3;
      const diff = score(a) - score(b);
      return diff !== 0 ? diff : a.index - b.index;
    });
  }, [devices, roomName]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId),
    [devices, selectedDeviceId]
  );

  const operationOptions = useMemo(
    () => getRoomEventOperationsByDevice(selectedDevice),
    [selectedDevice]
  );

  const currentOpMeta = useMemo(
    () => operationOptions.find((o) => o.value === operation),
    [operationOptions, operation]
  );

  const isGzirb56 =
    selectedDevice?.model === 'GZIRB56' ||
    selectedDevice?.testMode === 'gzirb56';

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setPreviewOpen(false);
    if (editingAction) {
      const matched =
        devices.find((d) => d.id === editingAction.deviceId) ??
        devices.find((d) => d.macAddress === editingAction.deviceSn);
      setSelectedDeviceId(matched?.id ?? '');
      setOperation(editingAction.operation);
      setParamPreset(editingAction.params || '默认参数（无）');
      setCustomParam(editingAction.params);
      setDelayMs(editingAction.delayMs);
      setExecutionOrder(editingAction.executionOrder);
      setGzirb56Config(
        editingAction.gzirb56Config
          ? { ...editingAction.gzirb56Config }
          : createInitialGzirb56Config()
      );
    } else {
      setSelectedDeviceId('');
      setOperation('');
      setParamPreset('');
      setCustomParam('');
      setDelayMs(0);
      setExecutionOrder(defaultStep);
      setGzirb56Config(createInitialGzirb56Config());
    }
  }, [isOpen, editingAction, defaultStep, devices]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !previewOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, previewOpen, onClose]);

  if (!isOpen) return null;

  const handleDeviceSelect = (nextId: string) => {
    setSelectedDeviceId(nextId);
    setErrorMsg(null);
    const dev = devices.find((d) => d.id === nextId);
    if (!dev) {
      setOperation('');
      setParamPreset('');
      setCustomParam('');
      return;
    }
    const ops = getRoomEventOperationsByDevice(dev);
    const firstOp = ops[0];
    setOperation(firstOp?.value ?? '');
    const firstPreset = firstOp?.paramPresets[0] ?? '默认参数（无）';
    setParamPreset(firstPreset);
    setCustomParam(firstPreset === '默认参数（无）' ? '' : firstPreset);
  };

  const handleOpSelect = (nextOp: string) => {
    setOperation(nextOp);
    const found = operationOptions.find((o) => o.value === nextOp);
    const firstPreset = found?.paramPresets[0] ?? '默认参数（无）';
    setParamPreset(firstPreset);
    setCustomParam(firstPreset === '默认参数（无）' ? '' : firstPreset);
  };

  const gzirb56PreviewTab: Gzirb56PanelTab =
    operation === 'renew_order'
      ? 'renew_order'
      : operation === 'activity_content'
      ? 'activity'
      : 'open_order';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) {
      setErrorMsg('请选择设备SN/场景ID');
      return;
    }
    if (!operation) {
      setErrorMsg('请选择操作指令');
      return;
    }

    let finalParams = '';
    if (isGzirb56) {
      if (operation === 'open_order_welcome') {
        finalParams = `欢迎文字：${gzirb56Config.welcomeText || '欢迎光临'}`;
      } else if (operation === 'renew_order') {
        finalParams = '距离当前订单结束时长 · 绑定包间下单二维码';
      } else if (operation === 'activity_content') {
        finalParams = `${gzirb56Config.activityName || '活动'}（${
          gzirb56Config.activityDiscount || '特惠'
        }）`;
      }
    } else {
      const trimmedCustom = customParam.trim();
      finalParams =
        trimmedCustom && trimmedCustom !== '默认参数（无）'
          ? trimmedCustom
          : paramPreset && paramPreset !== '默认参数（无）'
          ? paramPreset
          : '';
    }

    const opLabel = currentOpMeta?.label ?? operation;

    onSave({
      id: editingAction?.id ?? `rea-${Date.now()}`,
      executionOrder: Math.max(0, Number(executionOrder) || 0),
      actionType: 'Command',
      deviceId: selectedDevice.id,
      deviceSn: selectedDevice.macAddress,
      deviceName: selectedDevice.deviceName,
      deviceModel: selectedDevice.model,
      operation,
      operationLabel: opLabel,
      params: finalParams,
      delayMs: Math.max(0, Number(delayMs) || 0),
      ...(isGzirb56 ? { gzirb56Config: { ...gzirb56Config } } : {}),
    });
  };

  const focusClass = isApp
    ? 'focus:outline-none focus:border-[#4B996E]'
    : 'focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15';

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex justify-center ${
          isApp ? 'items-end sm:items-center p-0 sm:p-4' : 'items-center p-4'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-event-action-modal-title"
      >
        <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} />

        <form
          onSubmit={handleSubmit}
          className={`relative z-10 w-full bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden ${
            isApp
              ? 'max-w-[430px] max-h-[88vh] rounded-t-2xl sm:rounded-2xl'
              : 'max-w-[560px] max-h-[90vh] rounded-xl'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between shrink-0 ${
              isApp
                ? 'bg-[#4B996E] px-4 py-3 text-white'
                : 'px-6 py-4 border-b border-slate-200'
            }`}
          >
            <h3
              id="room-event-action-modal-title"
              className={`font-semibold ${
                isApp ? 'text-[14.5px] text-white' : 'text-[15.5px] text-slate-900'
              }`}
            >
              {editingAction ? '编辑事件设备操作' : '事件设备新增'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭弹窗"
              className={`p-1 rounded-md cursor-pointer ${
                isApp
                  ? 'text-emerald-100 hover:text-white hover:bg-white/10'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div
            className={`flex-1 overflow-y-auto space-y-4 ${
              isApp ? 'p-4' : 'px-6 py-5'
            }`}
          >
            {errorMsg && (
              <div className="px-3 py-2 text-[12.5px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
                {errorMsg}
              </div>
            )}

            {/* 1. 设备SN/场景ID */}
            <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-1.5 sm:gap-3 sm:items-center">
              <label
                htmlFor="rea-device"
                className="text-[13px] font-medium text-slate-700 sm:text-right"
              >
                <span className="text-rose-500 mr-0.5">*</span>
                设备SN/场景ID
              </label>
              <select
                id="rea-device"
                value={selectedDeviceId}
                onChange={(e) => handleDeviceSelect(e.target.value)}
                className={`w-full h-9.5 px-3 text-[13px] bg-white border border-slate-300 rounded-md ${focusClass}`}
              >
                <option value="">请选择设备</option>
                {sortedDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.macAddress} · {d.deviceName} ({d.model})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. 操作 (Dynamically matches device model, including GZIRB56) */}
            <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-1.5 sm:gap-3 sm:items-center">
              <label
                htmlFor="rea-op"
                className="text-[13px] font-medium text-slate-700 sm:text-right"
              >
                <span className="text-rose-500 mr-0.5">*</span>
                操作
              </label>
              <select
                id="rea-op"
                disabled={!selectedDevice}
                value={operation}
                onChange={(e) => handleOpSelect(e.target.value)}
                className={`w-full h-9.5 px-3 text-[13px] bg-white border border-slate-300 rounded-md disabled:bg-slate-100 disabled:text-slate-400 ${focusClass}`}
              >
                <option value="">
                  {selectedDevice ? '请选择操作' : '请先选择设备'}
                </option>
                {operationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. 参数 */}
            <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-1.5 sm:gap-3 sm:items-center">
              <label
                htmlFor="rea-param"
                className="text-[13px] font-medium text-slate-700 sm:text-right"
              >
                参数
              </label>
              <select
                id="rea-param"
                disabled={!operation}
                value={paramPreset}
                onChange={(e) => {
                  setParamPreset(e.target.value);
                  setCustomParam(
                    e.target.value === '默认参数（无）' ? '' : e.target.value
                  );
                }}
                className={`w-full h-9.5 px-3 text-[13px] bg-white border border-slate-300 rounded-md disabled:bg-slate-100 disabled:text-slate-400 ${focusClass}`}
              >
                <option value="">请选择参数</option>
                {(currentOpMeta?.paramPresets ?? []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* GZIRB56 Specialized Parameter Fields & Preview */}
            {isGzirb56 && operation && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-slate-800">
                    GZIRB56 点歌机参数配置 · {currentOpMeta?.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className={`inline-flex items-center gap-1 h-7 px-2.5 text-[11.5px] font-medium rounded border cursor-pointer ${
                      isApp
                        ? 'text-[#2F7551] bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    预览样式
                  </button>
                </div>

                {operation === 'open_order_welcome' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-slate-600">
                        欢迎文字
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setGzirb56Config((prev) => ({
                            ...prev,
                            welcomeText: prev.welcomeText
                              ? `${prev.welcomeText}{{包间名称}}`
                              : '欢迎光临 {{包间名称}}',
                          }))
                        }
                        className={`inline-flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded border cursor-pointer ${
                          isApp
                            ? 'text-[#2F7551] bg-emerald-50 border-emerald-200'
                            : 'text-blue-700 bg-blue-50 border-blue-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        + 包间名称
                      </button>
                    </div>
                    <input
                      type="text"
                      value={gzirb56Config.welcomeText}
                      onChange={(e) =>
                        setGzirb56Config((prev) => ({
                          ...prev,
                          welcomeText: e.target.value,
                        }))
                      }
                      placeholder="请输入欢迎文字，可插入 {{包间名称}}"
                      className={`w-full h-8.5 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded ${focusClass}`}
                    />
                  </div>
                )}

                {operation === 'renew_order' && (
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11.5px] text-slate-600 mb-1">
                        <span>提示时长</span>
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Lock className="w-3 h-3" />
                          不可编辑
                        </span>
                      </div>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={gzirb56Config.renewalTipMode}
                          readOnly
                          disabled
                          className="w-full h-8 pl-8 pr-2.5 text-[12px] text-slate-600 bg-slate-100 border border-slate-200 rounded cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11.5px] text-slate-600 mb-1">
                        <span>续单二维码</span>
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Lock className="w-3 h-3" />
                          不可编辑
                        </span>
                      </div>
                      <div className="relative">
                        <QrCode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={`${gzirb56Config.renewalQrMode}（${roomName}）`}
                          readOnly
                          disabled
                          className="w-full h-8 pl-8 pr-2.5 text-[12px] text-slate-600 bg-slate-100 border border-slate-200 rounded cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {operation === 'activity_content' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={gzirb56Config.activityName}
                      onChange={(e) =>
                        setGzirb56Config((p) => ({
                          ...p,
                          activityName: e.target.value,
                        }))
                      }
                      placeholder="活动名称"
                      className={`h-8 px-2.5 text-[12px] bg-white border border-slate-300 rounded ${focusClass}`}
                    />
                    <input
                      type="text"
                      value={gzirb56Config.activityTime}
                      onChange={(e) =>
                        setGzirb56Config((p) => ({
                          ...p,
                          activityTime: e.target.value,
                        }))
                      }
                      placeholder="活动时间"
                      className={`h-8 px-2.5 text-[12px] font-mono-tabular bg-white border border-slate-300 rounded ${focusClass}`}
                    />
                    <input
                      type="text"
                      value={gzirb56Config.activityDesc}
                      onChange={(e) =>
                        setGzirb56Config((p) => ({
                          ...p,
                          activityDesc: e.target.value,
                        }))
                      }
                      placeholder="活动描述"
                      className={`sm:col-span-2 h-8 px-2.5 text-[12px] bg-white border border-slate-300 rounded ${focusClass}`}
                    />
                    <input
                      type="text"
                      value={gzirb56Config.activityContent}
                      onChange={(e) =>
                        setGzirb56Config((p) => ({
                          ...p,
                          activityContent: e.target.value,
                        }))
                      }
                      placeholder="活动内容"
                      className={`sm:col-span-2 h-8 px-2.5 text-[12px] bg-white border border-slate-300 rounded ${focusClass}`}
                    />
                    <input
                      type="text"
                      value={gzirb56Config.activityDiscount}
                      onChange={(e) =>
                        setGzirb56Config((p) => ({
                          ...p,
                          activityDiscount: e.target.value,
                        }))
                      }
                      placeholder="活动折扣（如 8.8折）"
                      className={`h-8 px-2.5 text-[12px] font-mono-tabular bg-white border border-slate-300 rounded ${focusClass}`}
                    />
                    <input
                      type="text"
                      value={gzirb56Config.discountDesc}
                      onChange={(e) =>
                        setGzirb56Config((p) => ({
                          ...p,
                          discountDesc: e.target.value,
                        }))
                      }
                      placeholder="折扣描述（如 指定套餐）"
                      className={`h-8 px-2.5 text-[12px] bg-white border border-slate-300 rounded ${focusClass}`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. 延迟 (ms) */}
            <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-1.5 sm:gap-3 sm:items-center">
              <label
                htmlFor="rea-delay"
                className="text-[13px] font-medium text-slate-700 sm:text-right"
              >
                延迟 (ms)
              </label>
              <input
                id="rea-delay"
                type="number"
                min={0}
                step={100}
                value={delayMs}
                onChange={(e) =>
                  setDelayMs(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="请输入延迟毫秒数"
                className={`w-full h-9.5 px-3 text-[13px] font-mono-tabular bg-white border border-slate-300 rounded-md ${focusClass}`}
              />
            </div>

            {/* 5. 触发步骤 */}
            <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-1.5 sm:gap-3 sm:items-center">
              <label
                htmlFor="rea-step"
                className="text-[13px] font-medium text-slate-700 sm:text-right"
              >
                触发步骤
              </label>
              <input
                id="rea-step"
                type="number"
                min={0}
                value={executionOrder}
                onChange={(e) =>
                  setExecutionOrder(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="请输入触发步骤序号"
                className={`w-full h-9.5 px-3 text-[13px] font-mono-tabular bg-white border border-slate-300 rounded-md ${focusClass}`}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className={`border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2.5 shrink-0 ${
              isApp ? 'px-4 py-3' : 'px-6 py-3.5'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className={`h-9 px-5 text-[13px] font-medium text-white rounded-md cursor-pointer ${
                isApp
                  ? 'bg-[#4B996E] hover:bg-[#3B825B]'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              确认
            </button>
          </div>
        </form>
      </div>

      {/* GZIRB56 Preview Modal */}
      {isGzirb56 && (
        <Gzirb56PreviewModal
          isOpen={previewOpen}
          tab={gzirb56PreviewTab}
          roomName={roomName}
          config={gzirb56Config}
          variant={variant}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
};
