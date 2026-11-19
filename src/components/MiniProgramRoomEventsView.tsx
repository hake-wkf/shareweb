import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Inbox,
  Plus,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  DeviceRecord,
  RoomEventDeviceAction,
  RoomEventItem,
} from '../types/device';
import { RoomEventActionModal } from './RoomEventActionModal';

interface MiniProgramRoomEventsViewProps {
  selectedRoom: string;
  roomOptions: string[];
  events: RoomEventItem[];
  devices: DeviceRecord[];
  activeEventId: string | null;
  onSelectEventId: (eventId: string | null) => void;
  onSelectRoom: (roomName: string) => void;
  onRefresh: () => void;
  onInitRoomEvents: (roomName: string) => void;
  onAddRoomEvent: (payload: {
    roomName: string;
    eventKey: string;
    eventName: string;
    triggerCondition: string;
  }) => void;
  onDeleteRoomEvent: (eventId: string) => void;
  onSaveAction: (eventId: string, action: RoomEventDeviceAction) => void;
  onDeleteAction: (eventId: string, actionId: string) => void;
  onReorderActions: (
    eventId: string,
    nextActions: RoomEventDeviceAction[]
  ) => void;
}

export const MiniProgramRoomEventsView: React.FC<
  MiniProgramRoomEventsViewProps
> = ({
  selectedRoom,
  roomOptions,
  events,
  devices,
  activeEventId,
  onSelectEventId,
  onSelectRoom,
  onRefresh,
  onInitRoomEvents,
  onAddRoomEvent,
  onDeleteRoomEvent,
  onSaveAction,
  onDeleteAction,
  onReorderActions,
}) => {
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEventKey, setNewEventKey] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newTriggerCond, setNewTriggerCond] = useState('');

  const [actionModalState, setActionModalState] = useState<{
    open: boolean;
    editing: RoomEventDeviceAction | null;
  }>({ open: false, editing: null });

  const roomEvents = useMemo(
    () => events.filter((e) => e.roomName === selectedRoom),
    [events, selectedRoom]
  );

  const activeEvent = useMemo(
    () => roomEvents.find((e) => e.id === activeEventId) ?? null,
    [roomEvents, activeEventId]
  );

  const handleMoveAction = (index: number, direction: -1 | 1) => {
    if (!activeEvent) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= activeEvent.actions.length) return;
    const next = [...activeEvent.actions];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    const normalized = next.map((item, i) => ({
      ...item,
      executionOrder: i + 1,
    }));
    onReorderActions(activeEvent.id, normalized);
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventKey.trim() || !newEventName.trim() || !newTriggerCond.trim()) {
      return;
    }
    onAddRoomEvent({
      roomName: selectedRoom,
      eventKey: newEventKey.trim(),
      eventName: newEventName.trim(),
      triggerCondition: newTriggerCond.trim(),
    });
    setNewEventKey('');
    setNewEventName('');
    setNewTriggerCond('');
    setAddEventOpen(false);
  };

  // =========================================================================
  // LEVEL 2 (App 版 图二): 单个事件操作卡片列表 + 快捷排序 + 单个操作编辑
  // =========================================================================
  if (activeEvent) {
    return (
      <div className="p-3.5 space-y-3">
        {/* Event Summary & Top Action Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-slate-900 truncate">
                {activeEvent.eventName}
              </div>
              <div className="mt-0.5 text-[11.5px] font-mono-tabular text-slate-500 truncate">
                {activeEvent.roomName} · {activeEvent.eventKey}
              </div>
              <div className="mt-0.5 text-[11.5px] text-slate-500">
                触发条件：{activeEvent.triggerCondition}
              </div>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="刷新动作列表"
              className="w-8 h-8 inline-flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActionModalState({ open: true, editing: null })}
            className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新增设备
          </button>
        </div>

        {/* Device Actions List */}
        {activeEvent.actions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-10 px-4 text-center">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
              <Inbox className="w-4 h-4" />
            </div>
            <p className="text-[13px] font-medium text-slate-800">
              暂无绑定设备操作
            </p>
            <p className="text-[11.5px] text-slate-500 mt-1">
              点击上方「新增设备」添加执行动作
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeEvent.actions.map((act, idx) => (
              <article
                key={act.id}
                className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5"
              >
                {/* Top Row: Step Order + Quick Sort Buttons */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11.5px] font-mono-tabular font-semibold text-[#2F7551] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      步骤 {act.executionOrder}
                    </span>
                    <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                      {act.deviceName}
                    </span>
                    <span className="text-[11px] font-mono-tabular text-slate-400 shrink-0">
                      {act.deviceModel}
                    </span>
                  </div>

                  {/* Quick Sort Controls */}
                  <div className="inline-flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveAction(idx, -1)}
                      aria-label="上移"
                      className="w-6.5 h-6.5 inline-flex items-center justify-center border border-slate-200 rounded text-slate-500 hover:text-[#2F7551] hover:border-emerald-300 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === activeEvent.actions.length - 1}
                      onClick={() => handleMoveAction(idx, 1)}
                      aria-label="下移"
                      className="w-6.5 h-6.5 inline-flex items-center justify-center border border-slate-200 rounded text-slate-500 hover:text-[#2F7551] hover:border-emerald-300 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">设备SN</span>
                    <span className="font-mono-tabular text-slate-700 truncate">
                      {act.deviceSn}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">执行操作</span>
                    <span className="font-medium text-slate-900">
                      {act.operationLabel}
                    </span>
                  </div>
                  {act.params && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 shrink-0">参数</span>
                      <span className="font-mono-tabular text-slate-600 text-right break-all">
                        {act.params}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">延迟</span>
                    <span className="font-mono-tabular text-slate-700">
                      {act.delayMs} ms
                    </span>
                  </div>
                </div>

                {/* Bottom Actions: 单个操作编辑 + 删除 */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActionModalState({ open: true, editing: act })
                    }
                    className="h-8 inline-flex items-center justify-center text-[12px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md cursor-pointer"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAction(activeEvent.id, act.id)}
                    className="h-8 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <RoomEventActionModal
          isOpen={actionModalState.open}
          roomName={activeEvent.roomName}
          devices={devices}
          editingAction={actionModalState.editing}
          defaultStep={activeEvent.actions.length + 1}
          variant="app"
          onClose={() => setActionModalState({ open: false, editing: null })}
          onSave={(savedAction) => {
            onSaveAction(activeEvent.id, savedAction);
            setActionModalState({ open: false, editing: null });
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // LEVEL 1 (App 版 图一): 针对包间的事件列表
  // =========================================================================
  return (
    <div className="p-3.5 space-y-3">
      {/* Room Selector & App Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-medium text-slate-600 shrink-0">
            选择包间
          </span>
          <select
            aria-label="小程序选择事件管理包间"
            value={selectedRoom}
            onChange={(e) => {
              onSelectRoom(e.target.value);
              onSelectEventId(null);
            }}
            className="flex-1 h-8.5 px-2.5 text-[12.5px] font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4B996E]"
          >
            {roomOptions.map((rm) => (
              <option key={rm} value={rm}>
                {rm}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onInitRoomEvents(selectedRoom)}
            className="h-8 inline-flex items-center justify-center gap-1 text-[11.5px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            初始化
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="h-8 inline-flex items-center justify-center gap-1 text-[11.5px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            刷新
          </button>
          <button
            type="button"
            onClick={() => setAddEventOpen(true)}
            className="h-8 inline-flex items-center justify-center gap-1 text-[11.5px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            新增事件
          </button>
        </div>
      </div>

      {/* Room Events Cards */}
      {roomEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 px-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-[13.5px] font-medium text-slate-800">
            包间「{selectedRoom}」暂无事件
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {roomEvents.map((evt) => (
            <article
              key={evt.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-slate-900 truncate">
                    {evt.eventName}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] font-mono-tabular text-slate-500 truncate">
                    {evt.eventKey}
                  </p>
                </div>
                <span className="text-[11px] font-mono-tabular text-[#2F7551] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                  {evt.actions.length} 项动作
                </span>
              </div>

              <div className="text-[12px] text-slate-600">
                触发条件：{evt.triggerCondition}
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectEventId(evt.id)}
                  className="h-8 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  编辑动作
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRoomEvent(evt.id)}
                  className="h-8 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-md cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* App-styled 新增包间事件 Modal */}
      {addEventOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/45"
            onClick={() => setAddEventOpen(false)}
          />
          <form
            onSubmit={handleCreateEventSubmit}
            className="relative z-10 w-full max-w-[430px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-[#4B996E] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="text-[14.5px] font-semibold">
                新增包间事件（{selectedRoom}）
              </h3>
              <button
                type="button"
                onClick={() => setAddEventOpen(false)}
                className="p-1 text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  事件标识
                </label>
                <input
                  type="text"
                  required
                  value={newEventKey}
                  onChange={(e) => setNewEventKey(e.target.value)}
                  placeholder="如：CustomWelcomeEvent"
                  className="w-full h-9 px-3 text-[13px] font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  事件名称
                </label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="如：包厢迎宾联动事件"
                  className="w-full h-9 px-3 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  事件触发条件
                </label>
                <input
                  type="text"
                  required
                  value={newTriggerCond}
                  onChange={(e) => setNewTriggerCond(e.target.value)}
                  placeholder="如：用户首次刷脸进入包间时"
                  className="w-full h-9 px-3 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 bg-white grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAddEventOpen(false)}
                className="h-9 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="h-9 text-[13px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
              >
                确认新增
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
