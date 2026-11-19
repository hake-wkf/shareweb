import React, { useMemo, useRef, useState } from 'react';
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

interface MiniProgramAreaEventFormProps {
  editingEvent: AreaEventRecord | null;
  devices: DeviceRecord[];
  onCancel: () => void;
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
  if (device.model === 'GZIRB56' || device.testMode === 'gzirb56') {
    return [
      { value: 'open_order_welcome', label: '开门下单' },
      { value: 'renew_order', label: '续费下单' },
      { value: 'activity_content', label: '活动内容' },
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

export const MiniProgramAreaEventForm: React.FC<
  MiniProgramAreaEventFormProps
> = ({ editingEvent, devices, onCancel, onSave }) => {
  const [eventName, setEventName] = useState(editingEvent?.eventName ?? '');
  const [areaName, setAreaName] = useState(
    editingEvent?.areaName ?? '测试改版新增'
  );
  const [triggerType, setTriggerType] = useState<AreaEventTriggerType | ''>(
    editingEvent?.triggerType ?? ''
  );
  const [triggerDeviceSn, setTriggerDeviceSn] = useState(
    editingEvent?.triggerDeviceSn ?? ''
  );
  const [abDoorDeviceId, setAbDoorDeviceId] = useState(
    editingEvent?.abDoorDeviceId ?? ''
  );
  const [actions, setActions] = useState<AreaEventActionConfig[]>(() =>
    editingEvent && editingEvent.actions.length > 0
      ? editingEvent.actions.map((a) => ({ ...a }))
      : [createDefaultAction(1)]
  );
  const [formError, setFormError] = useState<string | null>(null);
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

    const selectedAbDevice = AB_DOOR_DEVICES.find(
      (d) => d.id === abDoorDeviceId
    );
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
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
      <div className="p-3.5 space-y-3 flex-1">
        {/* Basic Settings Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div>
            <label
              htmlFor="mp-evt-name"
              className="block text-[12px] font-medium text-slate-700 mb-1"
            >
              <span className="text-rose-500 mr-1">*</span>事件名称
            </label>
            <input
              id="mp-evt-name"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="请输入事件名称"
              className="w-full h-9 px-3 text-[13px] text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
            />
          </div>

          <div>
            <label
              htmlFor="mp-evt-area"
              className="block text-[12px] font-medium text-slate-700 mb-1"
            >
              <span className="text-rose-500 mr-1">*</span>事件区域
            </label>
            <select
              id="mp-evt-area"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="w-full h-9 px-3 text-[13px] text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
            >
              {AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mp-evt-trigger"
              className="block text-[12px] font-medium text-slate-700 mb-1"
            >
              <span className="text-rose-500 mr-1">*</span>触发条件
            </label>
            <select
              id="mp-evt-trigger"
              value={triggerType}
              onChange={(e) =>
                setTriggerType(e.target.value as AreaEventTriggerType | '')
              }
              className="w-full h-9 px-3 text-[13px] text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
            >
              <option value="">请选择触发条件</option>
              {TRIGGER_CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 健身房人脸开门 -> 触发设备 (仅SN与名称，对齐样式，无额外提示) */}
          {triggerType === 'gym_face_open' && (
            <div>
              <label
                htmlFor="mp-evt-trigger-sn"
                className="block text-[12px] font-medium text-slate-700 mb-1"
              >
                <span className="text-rose-500 mr-1">*</span>触发设备
              </label>
              <select
                id="mp-evt-trigger-sn"
                value={triggerDeviceSn}
                onChange={(e) => setTriggerDeviceSn(e.target.value)}
                className="w-full h-9 px-3 text-[12.5px] font-mono-tabular text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
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

          {/* AB门联动 */}
          {triggerType === 'ab_door_linkage' && (
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div>
                <label
                  htmlFor="mp-evt-ab-device"
                  className="block text-[12px] font-medium text-slate-700 mb-1"
                >
                  <span className="text-rose-500 mr-1">*</span>选择 AB门设备
                </label>
                <select
                  id="mp-evt-ab-device"
                  value={abDoorDeviceId}
                  onChange={(e) => setAbDoorDeviceId(e.target.value)}
                  className="w-full h-9 px-3 text-[12.5px] text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
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
                <span className="block text-[12px] font-medium text-slate-700 mb-1">
                  选择联动 AB指令
                </span>
                <div className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-[12.5px] font-mono-tabular text-slate-800">
                  <span className="font-semibold">ABReport</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Lock className="w-3 h-3" />
                    当前固定
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11.5px] text-slate-600 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-[#4B996E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-800">指令描述：</span>
                  该指令是以 AB门上报作为联动数据，可支持数据为{' '}
                  <code className="px-1 bg-white border border-slate-200 rounded font-mono-tabular text-slate-800">
                    ABIconId
                  </code>{' '}
                  和{' '}
                  <code className="px-1 bg-white border border-slate-200 rounded font-mono-tabular text-slate-800">
                    ABText
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section Header */}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[13px] font-semibold text-slate-900">
            执行操作（{actions.length}）
          </span>
          <button
            type="button"
            onClick={handleAddAction}
            className="h-8 px-3 inline-flex items-center gap-1 text-[12px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            添加操作
          </button>
        </div>

        {/* Action Cards */}
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
                className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold text-slate-900">
                      操作 {idx + 1}
                    </span>
                    {selectedDevice && (
                      <div className="text-[11px] font-mono-tabular text-slate-400 truncate">
                        {selectedDevice.model} · {selectedDevice.macAddress}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={actions.length <= 1}
                    onClick={() => handleRemoveAction(action.id)}
                    className="h-7 px-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-md disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>

                {/* Base 4 Mobile Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11.5px] text-slate-600 mb-1">
                      选择包间
                    </label>
                    <select
                      value={action.roomName}
                      onChange={(e) =>
                        handleRoomChange(action.id, e.target.value)
                      }
                      className="w-full h-8.5 px-2 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4B996E]"
                    >
                      <option value="">全部包间</option>
                      {roomOptions.map((rm) => (
                        <option key={rm} value={rm}>
                          {rm}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] text-slate-600 mb-1">
                      选择设备
                    </label>
                    <select
                      value={action.deviceId}
                      onChange={(e) =>
                        handleDeviceChange(action.id, e.target.value)
                      }
                      className="w-full h-8.5 px-2 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4B996E]"
                    >
                      <option value="">请选择设备</option>
                      {roomDevices.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.deviceName} ({dev.model})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] text-slate-600 mb-1">
                      设备操作
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
                      className="w-full h-8.5 px-2 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4B996E] disabled:opacity-60"
                    >
                      <option value="">请选择操作</option>
                      {actionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] text-slate-600 mb-1">
                      延时时间（秒）
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={action.delaySeconds}
                      onChange={(e) =>
                        updateAction(action.id, {
                          delaySeconds: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full h-8.5 px-2.5 text-[12.5px] font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4B996E]"
                    />
                  </div>
                </div>

                {/* GWXJS1 Volume */}
                {action.actionType === 'set_volume' && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-600">目标音量</span>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {action.deviceVolume ?? 65}%
                      </span>
                    </div>
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
                      className="w-full accent-[#4B996E]"
                    />
                  </div>
                )}

                {/* GZDLS7: 下方显示文字 */}
                {isGzdls7 && action.actionType === 'display_text' && (
                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                      <Type className="w-3.5 h-3.5 text-[#4B996E]" />
                      GZDLS7 下发文字配置
                    </div>

                    {triggerType === 'ab_door_linkage' ? (
                      <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
                        <div className="text-[11.5px] font-semibold text-[#2F7551]">
                          AB门联动文字下发规则
                        </div>

                        <div className="space-y-1.5 text-[12px]">
                          <div className="text-slate-600 font-medium">
                            当 ABIconId:
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`mp-ab-txt-icon-${action.id}`}
                                checked={action.abIconMatchMode === 'all'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abIconMatchMode: 'all',
                                  })
                                }
                                className="accent-[#4B996E]"
                              />
                              <span>all</span>
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`mp-ab-txt-icon-${action.id}`}
                                checked={action.abIconMatchMode === 'specific'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abIconMatchMode: 'specific',
                                  })
                                }
                                className="accent-[#4B996E]"
                              />
                              <span>指定 ABIconId</span>
                            </label>
                          </div>
                          {action.abIconMatchMode === 'specific' && (
                            <input
                              type="text"
                              value={action.abIconIdValue}
                              onChange={(e) =>
                                updateAction(action.id, {
                                  abIconIdValue: e.target.value,
                                })
                              }
                              placeholder="请输入指定 ABIconId，如 ICON_01"
                              className="w-full h-8 px-2.5 text-[12px] font-mono-tabular bg-white border border-slate-300 rounded"
                            />
                          )}
                        </div>

                        <div className="space-y-1.5 text-[12px]">
                          <div className="text-slate-600 font-medium">
                            播放文字内容为:
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`mp-ab-txt-src-${action.id}`}
                                checked={action.abTextSourceMode === 'ab_text'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abTextSourceMode: 'ab_text',
                                  })
                                }
                                className="accent-[#4B996E]"
                              />
                              <span>ABText</span>
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`mp-ab-txt-src-${action.id}`}
                                checked={action.abTextSourceMode === 'custom'}
                                onChange={() =>
                                  updateAction(action.id, {
                                    abTextSourceMode: 'custom',
                                  })
                                }
                                className="accent-[#4B996E]"
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
                              placeholder="请输入指定文字"
                              className="w-full h-8 px-2.5 text-[12px] bg-white border border-slate-300 rounded"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-[11.5px] font-medium text-slate-600">
                          显示文字内容
                        </div>
                        {triggerType === 'gym_face_open' && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleInsertVariableToText(
                                  action,
                                  '{{订单用户名字}}'
                                )
                              }
                              className="h-6 px-2 text-[11px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 rounded cursor-pointer"
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
                              className="h-6 px-2 text-[11px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 rounded cursor-pointer"
                            >
                              + 订单用户头像
                            </button>
                          </div>
                        )}
                        <input
                          type="text"
                          value={action.textContent}
                          onChange={(e) =>
                            updateAction(action.id, {
                              textContent: e.target.value,
                            })
                          }
                          placeholder="请输入显示文字内容"
                          className="w-full h-8.5 px-2.5 text-[12.5px] bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    )}

                    {/* Quick Coords */}
                    <div>
                      <span className="block text-[11.5px] font-medium text-slate-600 mb-1">
                        快速坐标（{GZDLS7_SCREEN_WIDTH}×{GZDLS7_SCREEN_HEIGHT}）
                      </span>
                      <div className="grid grid-cols-3 gap-1">
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
                            className={`h-7 text-[11px] font-medium border rounded cursor-pointer ${
                              action.textPreset === preset.key
                                ? 'bg-[#4B996E] text-white border-[#4B996E]'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[11.5px] text-slate-500">X</span>
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
                            className="w-full h-7.5 px-2 text-[12px] font-mono-tabular bg-white border border-slate-200 rounded"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11.5px] text-slate-500">Y</span>
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
                            className="w-full h-7.5 px-2 text-[12px] font-mono-tabular bg-white border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color & Size */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <span className="block text-[11.5px] font-medium text-slate-600 mb-1">
                          字体颜色
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
                            className="w-7 h-7 p-0.5 border border-slate-200 rounded bg-white cursor-pointer"
                          />
                          <div className="flex flex-wrap gap-1">
                            {TEXT_COLOR_SWATCHES.map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() =>
                                  updateAction(action.id, { textColor: hex })
                                }
                                className={`w-3.5 h-3.5 rounded border cursor-pointer ${
                                  action.textColor.toUpperCase() === hex
                                    ? 'ring-2 ring-[#4B996E]'
                                    : 'border-slate-300'
                                }`}
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11.5px] font-medium text-slate-600 mb-1">
                          字体大小 ({action.textFontSize}px)
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
                          className="w-full h-7.5 px-2 text-[12px] font-mono-tabular bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>

                    {/* Persist Time */}
                    <div>
                      <span className="block text-[11.5px] font-medium text-slate-600 mb-1">
                        文字消失时间
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`mp-evt-txt-persist-${action.id}`}
                            checked={action.textPersistMode === 'always'}
                            onChange={() =>
                              updateAction(action.id, {
                                textPersistMode: 'always',
                              })
                            }
                            className="accent-[#4B996E]"
                          />
                          <span>一直显示</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`mp-evt-txt-persist-${action.id}`}
                            checked={action.textPersistMode === 'seconds'}
                            onChange={() =>
                              updateAction(action.id, {
                                textPersistMode: 'seconds',
                              })
                            }
                            className="accent-[#4B996E]"
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
                              className="w-12 h-6.5 px-1 text-center font-mono-tabular bg-white border border-slate-200 rounded"
                            />
                            <span className="text-slate-500">秒</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* GZDLS7: 下方显示图片 */}
                {isGzdls7 && action.actionType === 'display_image' && (
                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                      <ImageIcon className="w-3.5 h-3.5 text-[#4B996E]" />
                      GZDLS7 下方显示图片配置
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {triggerType === 'gym_face_open' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateAction(action.id, {
                              imageSourceMode: 'order_user_avatar',
                              imageName: '{{订单用户头像}}',
                            })
                          }
                          className={`inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium border rounded cursor-pointer ${
                            action.imageSourceMode === 'order_user_avatar'
                              ? 'bg-[#4B996E] text-white border-[#4B996E]'
                              : 'bg-emerald-50 text-[#2F7551] border-emerald-200'
                          }`}
                        >
                          <UserCircle2 className="w-3 h-3" />
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
                          className={`h-7 px-2 text-[11px] font-medium border rounded cursor-pointer ${
                            action.imageSourceMode === 'preset_or_upload' &&
                            action.imageName === img.name
                              ? 'bg-emerald-50 text-[#2F7551] border-[#4B996E]'
                              : 'bg-white text-slate-700 border-slate-200'
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
                        className="inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium border border-dashed border-slate-400 rounded bg-white text-slate-700 cursor-pointer"
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
                      <div className="p-2.5 bg-slate-900 rounded-lg flex items-center gap-2.5 text-white">
                        <div className="w-9 h-9 rounded-full bg-emerald-600/30 border border-emerald-400 flex items-center justify-center shrink-0">
                          <UserCircle2 className="w-5 h-5 text-emerald-200" />
                        </div>
                        <div className="text-[11.5px]">
                          <div className="font-medium text-emerald-100">
                            动态变量：{'{{订单用户头像}}'}
                          </div>
                          <div className="text-[10.5px] text-slate-400">
                            开门后自动下发订单用户头像（支持配合 {'{{订单用户名字}}'}）
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-center">
                        <img
                          src={action.imageUrl}
                          alt={action.imageName}
                          referrerPolicy="no-referrer"
                          className="h-14 object-contain rounded"
                        />
                      </div>
                    )}

                    {/* Image Coords */}
                    <div>
                      <span className="block text-[11.5px] font-medium text-slate-600 mb-1">
                        快速坐标
                      </span>
                      <div className="grid grid-cols-3 gap-1">
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
                            className={`h-7 text-[11px] font-medium border rounded cursor-pointer ${
                              action.imagePreset === preset.key
                                ? 'bg-[#4B996E] text-white border-[#4B996E]'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[11.5px] text-slate-500">X</span>
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
                            className="w-full h-7.5 px-2 text-[12px] font-mono-tabular bg-white border border-slate-200 rounded"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11.5px] text-slate-500">Y</span>
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
                            className="w-full h-7.5 px-2 text-[12px] font-mono-tabular bg-white border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image Persist */}
                    <div>
                      <span className="block text-[11.5px] font-medium text-slate-600 mb-1">
                        图片消失时间
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`mp-evt-img-persist-${action.id}`}
                            checked={action.imagePersistMode === 'always'}
                            onChange={() =>
                              updateAction(action.id, {
                                imagePersistMode: 'always',
                              })
                            }
                            className="accent-[#4B996E]"
                          />
                          <span>一直显示</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`mp-evt-img-persist-${action.id}`}
                            checked={action.imagePersistMode === 'seconds'}
                            onChange={() =>
                              updateAction(action.id, {
                                imagePersistMode: 'seconds',
                              })
                            }
                            className="accent-[#4B996E]"
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
                              className="w-12 h-6.5 px-1 text-center font-mono-tabular bg-white border border-slate-200 rounded"
                            />
                            <span className="text-slate-500">秒</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* GZDLS7: 播放音频 */}
                {isGzdls7 && action.actionType === 'play_audio' && (
                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                      <Volume2 className="w-3.5 h-3.5 text-[#4B996E]" />
                      GZDLS7 播放音频配置
                    </div>

                    {triggerType === 'ab_door_linkage' && (
                      <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5 text-[12px]">
                        <div className="font-semibold text-[#2F7551]">
                          AB门联动播放音频规则
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-slate-600 font-medium">
                            当 ABIconId:
                          </span>
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`mp-ab-aud-icon-${action.id}`}
                              checked={action.abIconMatchMode === 'all'}
                              onChange={() =>
                                updateAction(action.id, {
                                  abIconMatchMode: 'all',
                                })
                              }
                              className="accent-[#4B996E]"
                            />
                            <span>all</span>
                          </label>
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`mp-ab-aud-icon-${action.id}`}
                              checked={action.abIconMatchMode === 'specific'}
                              onChange={() =>
                                updateAction(action.id, {
                                  abIconMatchMode: 'specific',
                                })
                              }
                              className="accent-[#4B996E]"
                            />
                            <span>指定 ABIconId</span>
                          </label>
                        </div>
                        {action.abIconMatchMode === 'specific' && (
                          <input
                            type="text"
                            value={action.abIconIdValue}
                            onChange={(e) =>
                              updateAction(action.id, {
                                abIconIdValue: e.target.value,
                              })
                            }
                            placeholder="请输入指定 ABIconId，如 ICON_01"
                            className="w-full h-8 px-2.5 text-[12px] font-mono-tabular bg-white border border-slate-300 rounded"
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
                        {triggerType === 'ab_door_linkage'
                          ? '播放音频为（指定音频 .mps）'
                          : '选择音频文件（.mps）'}
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
                        className="w-full h-8.5 px-2.5 text-[12px] font-mono-tabular bg-white border border-slate-200 rounded-md"
                      >
                        {INITIAL_GZDLS7_AUDIOS.map((af) => (
                          <option key={af.id} value={af.fileName}>
                            {af.name}（{af.fileName}）
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11.5px] text-slate-600 mb-1">
                        <span>播放音量</span>
                        <span className="font-mono-tabular font-medium text-slate-900">
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
                        className="w-full accent-[#4B996E]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {formError && (
          <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[12px] font-medium text-rose-700">
            {formError}
          </div>
        )}
      </div>

      {/* App Sticky Footer */}
      <div className="bg-white border-t border-slate-200 px-3.5 py-2.5 grid grid-cols-2 gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
        >
          取消
        </button>
        <button
          type="submit"
          className="h-9 text-[13px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
        >
          确定
        </button>
      </div>
    </form>
  );
};
