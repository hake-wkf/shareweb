import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Info,
  Lock,
  Plus,
  Trash2,
  Type,
  Upload,
  UserCircle2,
  Volume2,
  X,
} from 'lucide-react';
import {
  AreaEventActionConfig,
  AreaEventDeviceActionType,
  AreaEventRecord,
  AreaEventTriggerType,
  DeviceRecord,
  QuickCoordinateKey,
} from '../types/device';
import {
  AB_DOOR_DEVICES,
  AREA_OPTIONS,
  createDefaultAction,
  DEFAULT_BUILTIN_EVENT_IMAGE,
  TRIGGER_CONDITION_OPTIONS,
} from '../data/areaEventsData';
import {
  GZDLS7_SCREEN_HEIGHT,
  GZDLS7_SCREEN_WIDTH,
  INITIAL_GZDLS7_AUDIOS,
  QUICK_COORDINATE_PRESETS,
} from '../data/gzdls7Data';

interface AreaEventModalProps {
  isOpen: boolean;
  editingEvent: AreaEventRecord | null;
  devices: DeviceRecord[];
  onClose: () => void;
  onSave: (event: AreaEventRecord) => void;
}

const TEXT_COLOR_SWATCHES = [
  '#FFFFFF',
  '#2563EB',
  '#16A34A',
  '#FACC15',
  '#EF4444',
  '#0F172A',
];

const BUILTIN_IMAGES = [
  {
    id: 'welcome-poster',
    name: '迎宾欢迎画面',
    url: DEFAULT_BUILTIN_EVENT_IMAGE,
  },
  {
    id: 'guide-banner',
    name: '门禁扫码提示图',
    url:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><rect width="240" height="120" rx="8" fill="#0F172A"/><circle cx="52" cy="60" r="24" fill="#2563EB"/><path d="M44 60l6 6 12-12" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="148" y="54" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">智能门禁已就绪</text><text x="148" y="76" fill="#94A3B8" font-family="sans-serif" font-size="11" text-anchor="middle">刷脸或扫码即可自动开锁</text></svg>`
      ),
  },
];

function getDeviceActionOptions(
  device: DeviceRecord | undefined
): { value: AreaEventDeviceActionType; label: string }[] {
  if (!device) return [];
  if (device.model === 'GZDLS7' || device.testMode === 'gzdls7') {
    return [
      { value: 'open_door', label: '开门' },
      { value: 'display_text', label: '下方显示文字' },
      { value: 'display_image', label: '下方显示图片' },
      { value: 'play_audio', label: '播放音频（设置音频文件）' },
    ];
  }
  if (device.testMode === 'lock') {
    return [
      { value: 'unlock', label: '开锁' },
      { value: 'lock', label: '关锁' },
    ];
  }
  if (device.model === 'GWXJS1') {
    return [
      { value: 'turn_on', label: '开' },
      { value: 'turn_off', label: '关' },
      { value: 'set_volume', label: '设置音量' },
    ];
  }
  return [
    { value: 'turn_on', label: '开' },
    { value: 'turn_off', label: '关' },
  ];
}

export const AreaEventModal: React.FC<AreaEventModalProps> = ({
  isOpen,
  editingEvent,
  devices,
  onClose,
  onSave,
}) => {
  const [eventName, setEventName] = useState('');
  const [areaName, setAreaName] = useState('测试改版新增');
  const [triggerType, setTriggerType] = useState<AreaEventTriggerType | ''>('');
  const [triggerDeviceSn, setTriggerDeviceSn] = useState('');
  const [abDoorDeviceId, setAbDoorDeviceId] = useState('');
  const [actions, setActions] = useState<AreaEventActionConfig[]>([
    createDefaultAction(1),
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    if (editingEvent) {
      setEventName(editingEvent.eventName);
      setAreaName(editingEvent.areaName);
      setTriggerType(editingEvent.triggerType);
      setTriggerDeviceSn(editingEvent.triggerDeviceSn ?? '');
      setAbDoorDeviceId(editingEvent.abDoorDeviceId ?? '');
      setActions(
        editingEvent.actions.length > 0
          ? editingEvent.actions.map((a) => ({ ...a }))
          : [createDefaultAction(1)]
      );
    } else {
      setEventName('');
      setAreaName('测试改版新增');
      setTriggerType('');
      setTriggerDeviceSn('');
      setAbDoorDeviceId('');
      setActions([createDefaultAction(1)]);
    }
  }, [isOpen, editingEvent]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const roomOptions = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.boundRoom) set.add(d.boundRoom);
    });
    return Array.from(set);
  }, [devices]);

  const gzdls7FirstDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      const aScore = a.model === 'GZDLS7' ? 0 : 1;
      const bScore = b.model === 'GZDLS7' ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return a.index - b.index;
    });
  }, [devices]);

  if (!isOpen) return null;

  const updateAction = (
    actionId: string,
    patch: Partial<AreaEventActionConfig>
  ) => {
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, ...patch } : a))
    );
  };

  const handleAddAction = () => {
    setActions((prev) => [...prev, createDefaultAction(prev.length + 1)]);
  };

  const handleRemoveAction = (actionId: string) => {
    if (actions.length <= 1) return;
    setActions((prev) => prev.filter((a) => a.id !== actionId));
  };

  const handleRoomChange = (actionId: string, nextRoom: string) => {
    updateAction(actionId, {
      roomName: nextRoom,
      deviceId: '',
      deviceName: '',
      deviceModel: '',
      deviceSn: '',
      actionType: '',
    });
  };

  const handleDeviceChange = (actionId: string, nextDeviceId: string) => {
    const dev = devices.find((d) => d.id === nextDeviceId);
    if (!dev) {
      updateAction(actionId, {
        deviceId: '',
        deviceName: '',
        deviceModel: '',
        deviceSn: '',
        actionType: '',
      });
      return;
    }
    const opts = getDeviceActionOptions(dev);
    updateAction(actionId, {
      roomName: dev.boundRoom || '',
      deviceId: dev.id,
      deviceName: dev.deviceName,
      deviceModel: dev.model,
      deviceSn: dev.macAddress,
      actionType: opts[0]?.value ?? '',
    });
  };

  const handleInsertVariableToText = (
    action: AreaEventActionConfig,
    token: string
  ) => {
    const next = action.textContent ? `${action.textContent}${token}` : token;
    updateAction(action.id, { textContent: next });
  };

  const handleApplyCoordPreset = (
    actionId: string,
    target: 'text' | 'image',
    presetKey: QuickCoordinateKey
  ) => {
    const found = QUICK_COORDINATE_PRESETS.find((p) => p.key === presetKey);
    if (!found) return;
    if (target === 'text') {
      updateAction(actionId, {
        textPreset: presetKey,
        textX: found.x,
        textY: found.y,
      });
    } else {
      updateAction(actionId, {
        imagePreset: presetKey,
        imageX: found.x,
        imageY: found.y,
      });
    }
  };

  const handleUploadActionImage = (
    actionId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateAction(actionId, {
          imageSourceMode: 'preset_or_upload',
          imageUrl: reader.result,
          imageName: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!eventName.trim()) {
      setFormError('请输入事件名称');
      return;
    }
    if (!areaName) {
      setFormError('请选择事件区域');
      return;
    }
    if (!triggerType) {
      setFormError('请选择触发条件');
      return;
    }
    if (triggerType === 'gym_face_open' && !triggerDeviceSn) {
      setFormError('请选择「健身房人脸开门」的触发设备 SN');
      return;
    }
    if (triggerType === 'ab_door_linkage' && !abDoorDeviceId) {
      setFormError('请选择联动 AB门设备');
      return;
    }

    for (let i = 0; i < actions.length; i++) {
      const act = actions[i];
      if (!act.deviceId || !act.actionType) {
        setFormError(`请完善「操作${i + 1}」的设备与设备操作`);
        return;
      }
      if (
        triggerType === 'ab_door_linkage' &&
        (act.actionType === 'display_text' || act.actionType === 'play_audio') &&
        act.abIconMatchMode === 'specific' &&
        !act.abIconIdValue.trim()
      ) {
        setFormError(`请在「操作${i + 1}」中输入指定的 ABIconId`);
        return;
      }
      if (
        act.actionType === 'display_text' &&
        (triggerType !== 'ab_door_linkage' || act.abTextSourceMode === 'custom') &&
        !act.textContent.trim()
      ) {
        setFormError(`请在「操作${i + 1}」中输入下发文字内容`);
        return;
      }
    }

    const selectedAbDevice = AB_DOOR_DEVICES.find((d) => d.id === abDoorDeviceId);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const updatedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    onSave({
      id: editingEvent?.id ?? `evt-${Date.now()}`,
      eventName: eventName.trim(),
      areaName,
      triggerType,
      triggerDeviceSn:
        triggerType === 'gym_face_open' ? triggerDeviceSn : undefined,
      abDoorDeviceId:
        triggerType === 'ab_door_linkage' ? selectedAbDevice?.id : undefined,
      abDoorDeviceSn:
        triggerType === 'ab_door_linkage' ? selectedAbDevice?.sn : undefined,
      abDoorDeviceName:
        triggerType === 'ab_door_linkage' ? selectedAbDevice?.name : undefined,
      abCommand: triggerType === 'ab_door_linkage' ? 'ABReport' : undefined,
      actions,
      updatedAt,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="area-event-modal-title"
    >
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[780px] max-h-[90vh] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <h2
            id="area-event-modal-title"
            className="text-[16px] font-semibold text-slate-900"
          >
            {editingEvent ? '编辑区域事件' : '新增'}
          </h2>
          <button
            type="button"
            aria-label="关闭弹窗"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* 事件名称 */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="evt-name"
              className="w-28 text-right text-[13px] font-medium text-slate-700 shrink-0"
            >
              <span className="text-rose-500 mr-1">*</span>事件名称:
            </label>
            <input
              id="evt-name"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="请输入事件名称"
              className="flex-1 h-9 px-3 text-[13px] text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 事件区域 */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="evt-area"
              className="w-28 text-right text-[13px] font-medium text-slate-700 shrink-0"
            >
              <span className="text-rose-500 mr-1">*</span>事件区域:
            </label>
            <select
              id="evt-area"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="flex-1 h-9 px-3 text-[13px] text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              {AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* 触发条件 */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="evt-trigger"
              className="w-28 text-right text-[13px] font-medium text-slate-700 shrink-0"
            >
              <span className="text-rose-500 mr-1">*</span>触发条件:
            </label>
            <select
              id="evt-trigger"
              value={triggerType}
              onChange={(e) =>
                setTriggerType(e.target.value as AreaEventTriggerType | '')
              }
              className="flex-1 h-9 px-3 text-[13px] text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="">请选择触发条件</option>
              {TRIGGER_CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Field: 健身房人脸开门 -> 触发设备（SN 与名称，对齐主表单行） */}
          {triggerType === 'gym_face_open' && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="evt-trigger-sn"
                className="w-28 text-right text-[13px] font-medium text-slate-700 shrink-0"
              >
                <span className="text-rose-500 mr-1">*</span>触发设备:
              </label>
              <select
                id="evt-trigger-sn"
                value={triggerDeviceSn}
                onChange={(e) => setTriggerDeviceSn(e.target.value)}
                className="flex-1 min-w-0 h-9 px-3 text-[13px] font-mono-tabular text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">请选择触发设备 SN</option>
                {gzdls7FirstDevices.map((dev) => (
                  <option key={dev.id} value={dev.macAddress}>
                    {dev.macAddress}（{dev.deviceName}）
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Fields: AB门联动 */}
          {triggerType === 'ab_door_linkage' && (
            <div className="ml-31 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="evt-ab-device"
                    className="block text-[12.5px] font-medium text-slate-700 mb-1"
                  >
                    <span className="text-rose-500 mr-1">*</span>选择 AB门设备:
                  </label>
                  <select
                    id="evt-ab-device"
                    value={abDoorDeviceId}
                    onChange={(e) => setAbDoorDeviceId(e.target.value)}
                    className="w-full h-9 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
                  >
                    <option value="">请选择 AB门设备</option>
                    {AB_DOOR_DEVICES.map((ab) => (
                      <option key={ab.id} value={ab.id}>
                        {ab.name}（SN: {ab.sn}）
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[12.5px] font-medium text-slate-700 mb-1">
                    选择联动 AB指令:
                  </span>
                  <div className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-between text-[13px] font-mono-tabular text-slate-800">
                    <span className="font-semibold">ABReport</span>
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
                      <Lock className="w-3 h-3" />
                      当前固定
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 bg-white border border-slate-200 rounded-md text-[12px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-800">指令描述：</span>
                  该指令是以 AB门上报作为联动数据，可支持数据为{' '}
                  <code className="px-1 py-0.5 bg-slate-100 rounded font-mono-tabular text-slate-800">
                    ABIconId
                  </code>{' '}
                  和{' '}
                  <code className="px-1 py-0.5 bg-slate-100 rounded font-mono-tabular text-slate-800">
                    ABText
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* 执行操作 Header */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[13.5px] font-medium text-slate-800">
              执行操作
            </span>
            <button
              type="button"
              onClick={handleAddAction}
              className="inline-flex items-center gap-1 h-8 px-3.5 text-[12.5px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              添加操作
            </button>
          </div>

          {/* Action Cards List */}
          <div className="space-y-3">
            {actions.map((action, idx) => {
              const roomDevices = action.roomName
                ? devices.filter((d) => d.boundRoom === action.roomName)
                : gzdls7FirstDevices;
              const selectedDevice = devices.find((d) => d.id === action.deviceId);
              const actionOptions = getDeviceActionOptions(selectedDevice);
              const isGzdls7 =
                selectedDevice?.model === 'GZDLS7' ||
                action.deviceModel === 'GZDLS7';

              return (
                <div
                  key={action.id}
                  className="p-4 bg-[#FAFAFB] border border-slate-200 rounded-lg space-y-3.5"
                >
                  {/* Card Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-800">
                        操作{idx + 1}
                      </span>
                      {selectedDevice && (
                        <span className="text-[11.5px] font-mono-tabular text-slate-500">
                          {selectedDevice.model} · {selectedDevice.macAddress}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={actions.length <= 1}
                      onClick={() => handleRemoveAction(action.id)}
                      className="inline-flex items-center gap-1 h-7 px-3 text-[12px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  </div>

                  {/* Base 4 Selectors (Matching Reference Image 2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <label className="w-24 text-right text-[12.5px] text-slate-600 shrink-0">
                        选择包间:
                      </label>
                      <select
                        value={action.roomName}
                        onChange={(e) =>
                          handleRoomChange(action.id, e.target.value)
                        }
                        className="flex-1 h-8.5 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 min-w-0"
                      >
                        <option value="">全部包间（不限）</option>
                        {roomOptions.map((rm) => (
                          <option key={rm} value={rm}>
                            {rm}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-24 text-right text-[12.5px] text-slate-600 shrink-0">
                        选择设备:
                      </label>
                      <select
                        value={action.deviceId}
                        onChange={(e) =>
                          handleDeviceChange(action.id, e.target.value)
                        }
                        className="flex-1 h-8.5 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 min-w-0"
                      >
                        <option value="">请选择设备</option>
                        {roomDevices.map((dev) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.deviceName} ({dev.model} · {dev.macAddress})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-24 text-right text-[12.5px] text-slate-600 shrink-0">
                        设备操作:
                      </label>
                      <select
                        value={action.actionType}
                        disabled={!selectedDevice}
                        onChange={(e) =>
                          updateAction(action.id, {
                            actionType: e.target
                              .value as AreaEventDeviceActionType | '',
                          })
                        }
                        className="flex-1 h-8.5 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 disabled:bg-slate-100 min-w-0"
                      >
                        <option value="">请选择设备操作</option>
                        {actionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-24 text-right text-[12.5px] text-slate-600 shrink-0">
                        延时时间（秒）:
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={action.delaySeconds}
                        onChange={(e) =>
                          updateAction(action.id, {
                            delaySeconds: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="flex-1 h-8.5 px-2.5 text-[12.5px] font-mono-tabular bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 min-w-0"
                      />
                    </div>
                  </div>

                  {/* GWXJS1 Volume Config */}
                  {action.actionType === 'set_volume' && (
                    <div className="p-3 bg-white border border-slate-200 rounded-md flex items-center gap-3">
                      <span className="text-[12.5px] font-medium text-slate-700 shrink-0">
                        目标音量 ({action.deviceVolume ?? 65}%):
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={action.deviceVolume ?? 65}
                        onChange={(e) =>
                          updateAction(action.id, {
                            deviceVolume: Number(e.target.value),
                          })
                        }
                        className="flex-1 accent-blue-600"
                      />
                    </div>
                  )}

                  {/* GZDLS7: 下方显示文字 */}
                  {isGzdls7 && action.actionType === 'display_text' && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800">
                        <Type className="w-3.5 h-3.5 text-blue-600" />
                        GZDLS7 下发文字配置
                      </div>

                      {/* AB门联动 rule for display_text */}
                      {triggerType === 'ab_door_linkage' ? (
                        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-md space-y-2.5">
                          <div className="text-[12px] font-semibold text-blue-900">
                            AB门联动文字下发规则
                          </div>

                          {/* ABIconId = all / 指定ABIconId */}
                          <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
                            <span className="text-slate-600 font-medium">
                              当 ABIconId:
                            </span>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`ab-txt-icon-${action.id}`}
                                checked={action.abIconMatchMode === 'all'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abIconMatchMode: 'all',
                                  })
                                }
                                className="accent-blue-600"
                              />
                              <span>all（全部图标）</span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`ab-txt-icon-${action.id}`}
                                checked={action.abIconMatchMode === 'specific'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abIconMatchMode: 'specific',
                                  })
                                }
                                className="accent-blue-600"
                              />
                              <span>指定 ABIconId</span>
                            </label>
                            {action.abIconMatchMode === 'specific' && (
                              <input
                                type="text"
                                value={action.abIconIdValue}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    abIconIdValue: e.target.value,
                                  })
                                }
                                placeholder="例如 ICON_01"
                                className="h-7 px-2 text-[12px] font-mono-tabular bg-white border border-slate-300 rounded w-36"
                              />
                            )}
                          </div>

                          {/* 播放文字内容: ABText 或指定文字 */}
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
                              <span className="text-slate-600 font-medium">
                                播放文字内容为:
                              </span>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`ab-txt-src-${action.id}`}
                                  checked={action.abTextSourceMode === 'ab_text'}
                                  onChange={() =>
                                    updateAction(action.id, {
                                      abTextSourceMode: 'ab_text',
                                    })
                                  }
                                  className="accent-blue-600"
                                />
                                <span>ABText（使用上报文本）</span>
                              </label>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`ab-txt-src-${action.id}`}
                                  checked={action.abTextSourceMode === 'custom'}
                                  onChange={() =>
                                    updateAction(action.id, {
                                      abTextSourceMode: 'custom',
                                    })
                                  }
                                  className="accent-blue-600"
                                />
                                <span>指定文字</span>
                              </label>
                            </div>
                            {action.abTextSourceMode === 'custom' && (
                              <input
                                type="text"
                                value={action.textContent}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    textContent: e.target.value,
                                  })
                                }
                                placeholder="请输入指定的播放文字内容"
                                className="w-full h-8 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[12px] font-medium text-slate-600">
                              显示文字内容:
                            </span>
                            {triggerType === 'gym_face_open' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500">
                                  插入变量：
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInsertVariableToText(
                                      action,
                                      '{{订单用户名字}}'
                                    )
                                  }
                                  className="h-6 px-2 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded cursor-pointer"
                                >
                                  + 订单用户名字
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInsertVariableToText(
                                      action,
                                      '{{订单用户头像}}'
                                    )
                                  }
                                  className="h-6 px-2 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded cursor-pointer"
                                >
                                  + 订单用户头像
                                </button>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={action.textContent}
                            onChange={(e) =>
                              updateAction(action.id, {
                                textContent: e.target.value,
                              })
                            }
                            placeholder="请输入设备下方显示文字"
                            className="w-full h-8.5 px-2.5 text-[12.5px] border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      {/* 位置 / 颜色 / 大小 / 消失时间 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="block text-[12px] font-medium text-slate-600 mb-1">
                            显示位置（快速坐标 {GZDLS7_SCREEN_WIDTH}×
                            {GZDLS7_SCREEN_HEIGHT}）:
                          </span>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {QUICK_COORDINATE_PRESETS.map((preset) => (
                              <button
                                key={preset.key}
                                type="button"
                                onClick={() =>
                                  handleApplyCoordPreset(
                                    action.id,
                                    'text',
                                    preset.key
                                  )
                                }
                                className={`h-6.5 px-2 text-[11.5px] font-medium border rounded cursor-pointer ${
                                  action.textPreset === preset.key
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[11.5px] text-slate-500">
                                X
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={GZDLS7_SCREEN_WIDTH}
                                value={action.textX}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    textPreset: 'custom',
                                    textX: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full h-7 px-2 text-[12px] font-mono-tabular border border-slate-300 rounded"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11.5px] text-slate-500">
                                Y
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={GZDLS7_SCREEN_HEIGHT}
                                value={action.textY}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    textPreset: 'custom',
                                    textY: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full h-7 px-2 text-[12px] font-mono-tabular border border-slate-300 rounded"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[12px] font-medium text-slate-600 mb-1">
                                字体颜色:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={action.textColor}
                                  onChange={(e) =>
                                    updateAction(action.id, {
                                      textColor: e.target.value,
                                    })
                                  }
                                  className="w-7 h-7 p-0.5 border border-slate-300 rounded cursor-pointer"
                                />
                                <div className="flex flex-wrap gap-1">
                                  {TEXT_COLOR_SWATCHES.map((hex) => (
                                    <button
                                      key={hex}
                                      type="button"
                                      onClick={() =>
                                        updateAction(action.id, {
                                          textColor: hex,
                                        })
                                      }
                                      className={`w-3.5 h-3.5 rounded border cursor-pointer ${
                                        action.textColor.toUpperCase() === hex
                                          ? 'ring-2 ring-blue-500'
                                          : 'border-slate-300'
                                      }`}
                                      style={{ backgroundColor: hex }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="block text-[12px] font-medium text-slate-600 mb-1">
                                字体大小 ({action.textFontSize}px):
                              </span>
                              <input
                                type="number"
                                min={12}
                                max={96}
                                value={action.textFontSize}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    textFontSize: Math.max(
                                      12,
                                      Number(e.target.value) || 12
                                    ),
                                  })
                                }
                                className="w-full h-7 px-2 text-[12px] font-mono-tabular border border-slate-300 rounded"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="block text-[12px] font-medium text-slate-600 mb-1">
                              文字消失时间:
                            </span>
                            <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`evt-txt-persist-${action.id}`}
                                  checked={action.textPersistMode === 'always'}
                                  onChange={() =>
                                    updateAction(action.id, {
                                      textPersistMode: 'always',
                                    })
                                  }
                                  className="accent-blue-600"
                                />
                                <span>一直显示</span>
                              </label>
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`evt-txt-persist-${action.id}`}
                                  checked={action.textPersistMode === 'seconds'}
                                  onChange={() =>
                                    updateAction(action.id, {
                                      textPersistMode: 'seconds',
                                    })
                                  }
                                  className="accent-blue-600"
                                />
                                <span>x秒后消失</span>
                              </label>
                              {action.textPersistMode === 'seconds' && (
                                <div className="inline-flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={1}
                                    value={action.textDurationSec}
                                    onChange={(e) =>
                                      updateAction(action.id, {
                                        textDurationSec: Math.max(
                                          1,
                                          Number(e.target.value) || 1
                                        ),
                                      })
                                    }
                                    className="w-12 h-6 px-1 text-center font-mono-tabular border border-slate-300 rounded"
                                  />
                                  <span className="text-slate-500">秒</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GZDLS7: 下方显示图片 */}
                  {isGzdls7 && action.actionType === 'display_image' && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          GZDLS7 下方显示图片配置
                        </div>
                        {triggerType === 'gym_face_open' && (
                          <div className="flex items-center gap-1.5 text-[11px] text-blue-700">
                            <span>可用变量：</span>
                            <code className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded">
                              {'{{订单用户头像}}'}
                            </code>
                            <code className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded">
                              {'{{订单用户名字}}'}
                            </code>
                          </div>
                        )}
                      </div>

                      {/* Image Source Selection */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {triggerType === 'gym_face_open' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateAction(action.id, {
                                  imageSourceMode: 'order_user_avatar',
                                  imageName: '{{订单用户头像}}',
                                })
                              }
                              className={`inline-flex items-center gap-1.5 h-7.5 px-2.5 text-[12px] font-medium border rounded cursor-pointer ${
                                action.imageSourceMode === 'order_user_avatar'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              <UserCircle2 className="w-3.5 h-3.5" />
                              变量：订单用户头像
                            </button>
                          )}

                          {BUILTIN_IMAGES.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() =>
                                updateAction(action.id, {
                                  imageSourceMode: 'preset_or_upload',
                                  imageName: img.name,
                                  imageUrl: img.url,
                                })
                              }
                              className={`h-7.5 px-2.5 text-[12px] font-medium border rounded cursor-pointer ${
                                action.imageSourceMode === 'preset_or_upload' &&
                                action.imageName === img.name
                                  ? 'bg-blue-50 text-blue-700 border-blue-400'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {img.name}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              imageInputRefs.current[action.id]?.click()
                            }
                            className="inline-flex items-center gap-1 h-7.5 px-2.5 text-[12px] font-medium border border-dashed border-slate-400 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            上传图片
                          </button>
                          <input
                            ref={(el) => {
                              imageInputRefs.current[action.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadActionImage(action.id, e)}
                            className="hidden"
                          />
                        </div>

                        {action.imageSourceMode === 'order_user_avatar' ? (
                          <div className="p-2.5 bg-slate-900 rounded-md flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center shrink-0">
                              <UserCircle2 className="w-6 h-6 text-blue-200" />
                            </div>
                            <div className="text-[12px]">
                              <div className="font-medium text-blue-100">
                                动态变量图片：{'{{订单用户头像}}'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                人脸识别开门触发时，自动下发当前订单用户的头像（可配合{' '}
                                {'{{订单用户名字}}'} 展示）
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-900 rounded-md flex items-center justify-center">
                            <img
                              src={action.imageUrl}
                              alt={action.imageName}
                              referrerPolicy="no-referrer"
                              className="h-14 object-contain rounded"
                            />
                          </div>
                        )}
                      </div>

                      {/* Image Coords & Persist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="block text-[12px] font-medium text-slate-600 mb-1">
                            显示坐标（快速坐标）:
                          </span>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {QUICK_COORDINATE_PRESETS.map((preset) => (
                              <button
                                key={preset.key}
                                type="button"
                                onClick={() =>
                                  handleApplyCoordPreset(
                                    action.id,
                                    'image',
                                    preset.key
                                  )
                                }
                                className={`h-6.5 px-2 text-[11.5px] font-medium border rounded cursor-pointer ${
                                  action.imagePreset === preset.key
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[11.5px] text-slate-500">
                                X
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={GZDLS7_SCREEN_WIDTH}
                                value={action.imageX}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    imagePreset: 'custom',
                                    imageX: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full h-7 px-2 text-[12px] font-mono-tabular border border-slate-300 rounded"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11.5px] text-slate-500">
                                Y
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={GZDLS7_SCREEN_HEIGHT}
                                value={action.imageY}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    imagePreset: 'custom',
                                    imageY: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full h-7 px-2 text-[12px] font-mono-tabular border border-slate-300 rounded"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="block text-[12px] font-medium text-slate-600 mb-1.5">
                            图片消失时间:
                          </span>
                          <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`evt-img-persist-${action.id}`}
                                checked={action.imagePersistMode === 'always'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    imagePersistMode: 'always',
                                  })
                                }
                                className="accent-blue-600"
                              />
                              <span>一直显示</span>
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`evt-img-persist-${action.id}`}
                                checked={action.imagePersistMode === 'seconds'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    imagePersistMode: 'seconds',
                                  })
                                }
                                className="accent-blue-600"
                              />
                              <span>x秒后消失</span>
                            </label>
                            {action.imagePersistMode === 'seconds' && (
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={action.imageDurationSec}
                                  onChange={(e) =>
                                    updateAction(action.id, {
                                      imageDurationSec: Math.max(
                                        1,
                                        Number(e.target.value) || 1
                                      ),
                                    })
                                  }
                                  className="w-12 h-6 px-1 text-center font-mono-tabular border border-slate-300 rounded"
                                />
                                <span className="text-slate-500">秒</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GZDLS7: 播放音频 */}
                  {isGzdls7 && action.actionType === 'play_audio' && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800">
                        <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                        GZDLS7 播放音频配置
                      </div>

                      {/* AB门联动 rule for play_audio */}
                      {triggerType === 'ab_door_linkage' && (
                        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-md space-y-2">
                          <div className="text-[12px] font-semibold text-blue-900">
                            AB门联动播放音频规则
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
                            <span className="text-slate-600 font-medium">
                              当 ABIconId:
                            </span>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`ab-aud-icon-${action.id}`}
                                checked={action.abIconMatchMode === 'all'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abIconMatchMode: 'all',
                                  })
                                }
                                className="accent-blue-600"
                              />
                              <span>all（全部图标）</span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`ab-aud-icon-${action.id}`}
                                checked={action.abIconMatchMode === 'specific'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abIconMatchMode: 'specific',
                                  })
                                }
                                className="accent-blue-600"
                              />
                              <span>指定 ABIconId</span>
                            </label>
                            {action.abIconMatchMode === 'specific' && (
                              <input
                                type="text"
                                value={action.abIconIdValue}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    abIconIdValue: e.target.value,
                                  })
                                }
                                placeholder="例如 ICON_01"
                                className="h-7 px-2 text-[12px] font-mono-tabular bg-white border border-slate-300 rounded w-36"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[12px] font-medium text-slate-600 mb-1">
                            {triggerType === 'ab_door_linkage'
                              ? '播放音频为（指定音频 .mps）:'
                              : '选择音频文件（.mps）:'}
                          </label>
                          <select
                            value={action.audioFileName}
                            onChange={(e) => {
                              const found = INITIAL_GZDLS7_AUDIOS.find(
                                (af) => af.fileName === e.target.value
                              );
                              updateAction(action.id, {
                                audioFileName: e.target.value,
                                audioDisplayName: found?.name ?? e.target.value,
                              });
                            }}
                            className="w-full h-8.5 px-2.5 text-[12.5px] font-mono-tabular bg-white border border-slate-300 rounded-md"
                          >
                            {INITIAL_GZDLS7_AUDIOS.map((af) => (
                              <option key={af.id} value={af.fileName}>
                                {af.name}（{af.fileName}）
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[12px] font-medium text-slate-600 mb-1">
                            <span>播放音量</span>
                            <span className="font-mono-tabular text-slate-900">
                              {action.audioVolume}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={action.audioVolume}
                            onChange={(e) =>
                              updateAction(action.id, {
                                audioVolume: Number(e.target.value),
                              })
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {formError && (
            <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-md text-[12.5px] font-medium text-rose-700">
              {formError}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-4 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
          >
            取消
          </button>
          <button
            type="submit"
            className="h-8.5 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
          >
            确定
          </button>
        </div>
      </form>
    </div>
  );
};
