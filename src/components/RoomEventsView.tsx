import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  GripVertical,
  Inbox,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  DeviceRecord,
  RoomEventDeviceAction,
  RoomEventItem,
} from '../types/device';
import { RoomEventActionModal } from './RoomEventActionModal';

interface RoomEventsViewProps {
  selectedRoom: string;
  roomOptions: string[];
  events: RoomEventItem[];
  devices: DeviceRecord[];
  isRefreshing: boolean;
  onSelectRoom: (roomName: string) => void;
  onRefresh: () => void;
  onInitRoomEvents: (roomName: string) => void;
  onJumpToAreaEvents: () => void;
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

export const RoomEventsView: React.FC<RoomEventsViewProps> = ({
  selectedRoom,
  roomOptions,
  events,
  devices,
  isRefreshing,
  onSelectRoom,
  onRefresh,
  onInitRoomEvents,
  onJumpToAreaEvents,
  onAddRoomEvent,
  onDeleteRoomEvent,
  onSaveAction,
  onDeleteAction,
  onReorderActions,
}) => {
  // Active event ID when drilled into 图二 (单个事件操作)
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Add Room Event Modal state
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEventKey, setNewEventKey] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newTriggerCond, setNewTriggerCond] = useState('');

  // Add / Edit Device Action Modal state (图三)
  const [actionModalState, setActionModalState] = useState<{
    open: boolean;
    editing: RoomEventDeviceAction | null;
  }>({ open: false, editing: null });

  // Drag state for row reordering in 图二
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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

  const handleDropAction = (targetIdx: number) => {
    if (!activeEvent || dragIndex === null || dragIndex === targetIdx) {
      setDragIndex(null);
      return;
    }
    const next = [...activeEvent.actions];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIdx, 0, moved);
    const normalized = next.map((item, i) => ({
      ...item,
      executionOrder: i + 1,
    }));
    setDragIndex(null);
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
  // LEVEL 2: 图二 — 单个事件操作 (Device Actions List + Quick Sort + Edit)
  // =========================================================================
  if (activeEvent) {
    return (
      <>
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setActiveEventId(null)}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                返回
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[16px] font-semibold text-slate-900 truncate">
                    {activeEvent.roomName} · {activeEvent.eventName}
                  </h2>
                  <span className="text-[12px] font-mono-tabular text-slate-500">
                    ({activeEvent.eventKey})
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  触发条件：{activeEvent.triggerCondition} · 支持拖拽行或点击「↑ / ↓」快捷调整执行顺序
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 h-8.5 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                刷新
              </button>
              <button
                type="button"
                onClick={() =>
                  setActionModalState({ open: true, editing: null })
                }
                className="inline-flex items-center gap-1.5 h-8.5 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                新增设备
              </button>
            </div>
          </div>

          <div className="table-scroll overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[960px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-600">
                  <th className="py-3 px-4 w-[148px]">执行顺序（快捷排序）</th>
                  <th className="py-3 px-4 w-[100px]">动作类型</th>
                  <th className="py-3 px-4 w-[176px]">设备SN/场景ID</th>
                  <th className="py-3 px-4 w-[150px]">名称</th>
                  <th className="py-3 px-4 w-[170px]">操作</th>
                  <th className="py-3 px-4">参数</th>
                  <th className="py-3 px-4 text-right w-[100px]">延迟(ms)</th>
                  <th className="py-3 px-4 text-center w-[130px]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                {activeEvent.actions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <p className="text-[13.5px] font-medium text-slate-800">
                        当前事件暂未绑定设备动作
                      </p>
                      <p className="text-[12px] text-slate-500 mt-1">
                        点击右上角「新增设备」添加执行动作（支持 GZIRB56 点歌机及门锁开关设备）
                      </p>
                    </td>
                  </tr>
                ) : (
                  activeEvent.actions.map((act, idx) => (
                    <tr
                      key={act.id}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropAction(idx)}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        dragIndex === idx ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            title="拖拽排序"
                            className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <span className="w-6 text-center font-mono-tabular font-semibold text-slate-800">
                            {act.executionOrder}
                          </span>
                          <div className="inline-flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveAction(idx, -1)}
                              title="上移"
                              aria-label="上移顺序"
                              className="w-6 h-6 inline-flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === activeEvent.actions.length - 1}
                              onClick={() => handleMoveAction(idx, 1)}
                              title="下移"
                              aria-label="下移顺序"
                              className="w-6 h-6 inline-flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-slate-600">
                        {act.actionType}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-[12.5px] text-slate-700">
                        {act.deviceSn}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div>{act.deviceName}</div>
                        <div className="text-[11px] font-mono-tabular text-slate-400">
                          {act.deviceModel}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {act.operationLabel}
                      </td>
                      <td className="py-3 px-4 text-[12.5px] text-slate-600 max-w-[240px] truncate" title={act.params}>
                        {act.params ? (
                          <span className="font-mono-tabular">{act.params}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular text-slate-700">
                        {act.delayMs}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setActionModalState({ open: true, editing: act })
                            }
                            className="text-[12.5px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAction(activeEvent.id, act.id)}
                            className="text-[12.5px] font-medium text-rose-500 hover:text-rose-600 cursor-pointer"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-[12.5px] text-slate-500">
            <span className="font-mono-tabular">
              共 {activeEvent.actions.length} 项设备动作
            </span>
            <span>点击「编辑」可修改单个设备操作，拖拽或使用箭头可快捷排序</span>
          </div>
        </section>

        <RoomEventActionModal
          isOpen={actionModalState.open}
          roomName={activeEvent.roomName}
          devices={devices}
          editingAction={actionModalState.editing}
          defaultStep={activeEvent.actions.length + 1}
          variant="web"
          onClose={() => setActionModalState({ open: false, editing: null })}
          onSave={(savedAction) => {
            onSaveAction(activeEvent.id, savedAction);
            setActionModalState({ open: false, editing: null });
          }}
        />
      </>
    );
  }

  // =========================================================================
  // LEVEL 1: 图一 — 针对包间的事件列表
  // =========================================================================
  return (
    <>
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-slate-900">
                事件管理
              </h2>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                针对包间的触发事件配置与设备联动执行顺序管理
              </p>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-[12.5px] text-slate-500 whitespace-nowrap">
                当前包间：
              </span>
              <select
                aria-label="选择事件管理包间"
                value={selectedRoom}
                onChange={(e) => {
                  onSelectRoom(e.target.value);
                  setActiveEventId(null);
                }}
                className="h-8.5 px-3 text-[13px] font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
              >
                {roomOptions.map((rm) => (
                  <option key={rm} value={rm}>
                    {rm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onInitRoomEvents(selectedRoom)}
              className="inline-flex items-center gap-1.5 h-8.5 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              初始化事件配置
            </button>
            <button
              type="button"
              onClick={onJumpToAreaEvents}
              className="inline-flex items-center gap-1.5 h-8.5 px-3.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              区域事件
            </button>
            <button
              type="button"
              onClick={() => setAddEventOpen(true)}
              className="inline-flex items-center gap-1.5 h-8.5 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              新增事件
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 h-8.5 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              刷新
            </button>
          </div>
        </div>

        <div className="table-scroll overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[840px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[12.5px] font-semibold text-slate-600">
                <th className="py-3 px-4 w-[220px]">事件</th>
                <th className="py-3 px-4 w-[240px]">事件名称</th>
                <th className="py-3 px-4">事件触发条件</th>
                <th className="py-3 px-4 text-center w-[110px]">配置动作</th>
                <th className="py-3 px-4 text-center w-[160px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
              {roomEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-[13.5px] font-medium text-slate-800">
                      包间「{selectedRoom}」暂无事件配置
                    </p>
                    <p className="text-[12px] text-slate-500 mt-1">
                      点击「初始化事件配置」或「新增事件」开始配置
                    </p>
                  </td>
                </tr>
              ) : (
                roomEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-50/90 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono-tabular font-medium text-slate-800">
                      {evt.eventKey}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {evt.eventName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {evt.triggerCondition}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-tabular text-slate-600">
                      {evt.actions.length} 项
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveEventId(evt.id)}
                          className="h-7 px-3 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                        >
                          编辑动作
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRoomEvent(evt.id)}
                          className="h-7 px-2.5 text-[12px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-[12.5px] text-slate-500">
          <span className="font-mono-tabular">
            共 {roomEvents.length} 条 · 当前包间 {selectedRoom}
          </span>
        </div>
      </section>

      {/* 新增包间事件 Modal */}
      {addEventOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setAddEventOpen(false)}
          />
          <form
            onSubmit={handleCreateEventSubmit}
            className="relative z-10 w-full max-w-[460px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">
                新增包间事件（{selectedRoom}）
              </h3>
              <button
                type="button"
                onClick={() => setAddEventOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                  事件标识
                </label>
                <input
                  type="text"
                  required
                  value={newEventKey}
                  onChange={(e) => setNewEventKey(e.target.value)}
                  placeholder="如：CustomWelcomeEvent"
                  className="w-full h-9 px-3 text-[13px] font-mono-tabular border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                  事件名称
                </label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="如：包厢迎宾联动事件"
                  className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                  事件触发条件
                </label>
                <input
                  type="text"
                  required
                  value={newTriggerCond}
                  onChange={(e) => setNewTriggerCond(e.target.value)}
                  placeholder="如：用户首次刷脸进入包间时"
                  className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddEventOpen(false)}
                className="h-8.5 px-4 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="h-8.5 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
              >
                确认新增
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
