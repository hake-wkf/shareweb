import React, { useState } from 'react';
import { AlertTriangle, Send, X } from 'lucide-react';
import { DevicePurpose, DeviceRecord } from '../types/device';
import { PURPOSE_OPTIONS } from '../data/mockDevices';

interface PurposeModalProps {
  device: DeviceRecord | null;
  onClose: () => void;
  onSave: (deviceId: string, purpose: DevicePurpose) => void;
}

export const DevicePurposeModal: React.FC<PurposeModalProps> = ({
  device,
  onClose,
  onSave,
}) => {
  const [selected, setSelected] = useState<DevicePurpose>(
    device?.purpose ?? '普通设备'
  );

  React.useEffect(() => {
    if (device) setSelected(device.purpose);
  }, [device]);

  if (!device) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[400px] bg-white border border-slate-200 rounded-lg shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-900">设置设备用处</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-[13px] text-slate-600">
            设备：<span className="font-medium text-slate-900">{device.deviceName}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-mono-tabular text-slate-500">{device.macAddress}</span>
          </div>

          <div className="space-y-2">
            {PURPOSE_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex items-center justify-between px-3.5 py-2.5 border rounded-md cursor-pointer transition-colors ${
                  selected === opt
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-[13px] font-medium">{opt}</span>
                <input
                  type="radio"
                  name="device-purpose"
                  checked={selected === opt}
                  onChange={() => setSelected(opt)}
                  className="accent-blue-600"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(device.id, selected);
              onClose();
            }}
            className="h-8 px-4 text-[13px] font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

interface CommandModalProps {
  device: DeviceRecord | null;
  onClose: () => void;
  onSendCommand: (deviceId: string, commandName: string) => void;
}

const PRESET_COMMANDS = [
  { code: 'SYNC_STATE', label: '同步设备最新状态' },
  { code: 'REBOOT_NODE', label: '远程重启设备节点' },
  { code: 'CHECK_FIRMWARE', label: '查询固件版本信息' },
  { code: 'CALIBRATE_CLOCK', label: '校准本地时钟' },
];

export const CommandModal: React.FC<CommandModalProps> = ({
  device,
  onClose,
  onSendCommand,
}) => {
  const [selectedCmd, setSelectedCmd] = useState(PRESET_COMMANDS[0].label);
  const [customPayload, setCustomPayload] = useState('');

  if (!device) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmdText = customPayload.trim()
      ? `自定义指令 (${customPayload.trim()})`
      : selectedCmd;
    onSendCommand(device.id, cmdText);
    setCustomPayload('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-slate-900/35" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[440px] bg-white border border-slate-200 rounded-lg shadow-xl"
      >
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-900">下发指令操作</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-[13px] text-slate-600">
            目标设备：<span className="font-medium text-slate-900">{device.deviceName}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-mono-tabular text-slate-500">{device.gatewaySn}</span>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-2">
              选择预设指令
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_COMMANDS.map((cmd) => (
                <button
                  key={cmd.code}
                  type="button"
                  onClick={() => setSelectedCmd(cmd.label)}
                  className={`px-3 py-2 text-left text-[12px] font-medium border rounded-md transition-colors cursor-pointer ${
                    selectedCmd === cmd.label && !customPayload.trim()
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-hex-cmd"
              className="block text-[12px] font-medium text-slate-600 mb-1.5"
            >
              自定义协议报文（可选，十六进制）
            </label>
            <input
              id="custom-hex-cmd"
              type="text"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              placeholder="例如：AA 55 01 03 FF"
              className="w-full h-9 px-3 text-[13px] font-mono-tabular border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            取消
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 h-8 px-4 text-[13px] font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            发送指令
          </button>
        </div>
      </form>
    </div>
  );
};

interface DeleteConfirmModalProps {
  device: DeviceRecord | null;
  onClose: () => void;
  onConfirm: (deviceId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  device,
  onClose,
  onConfirm,
}) => {
  if (!device) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[380px] bg-white border border-slate-200 rounded-lg shadow-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-slate-900">确认删除设备</h3>
            <p className="mt-1.5 text-[13px] text-slate-600 leading-relaxed">
              确定要从列表中移除设备「<span className="font-medium text-slate-900">{device.deviceName}</span>」
              （Mac: <span className="font-mono-tabular">{device.macAddress}</span>）吗？此操作将解除其与包厢「{device.boundRoom}」的关联。
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(device.id);
              onClose();
            }}
            className="h-8 px-4 text-[13px] font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 cursor-pointer"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};
