import React from 'react';
import { CalendarClock, Inbox, MapPin, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AreaEventRecord } from '../types/device';
import { formatActionSummary, getTriggerLabel } from '../data/areaEventsData';

interface MiniProgramAreaEventsViewProps {
  events: AreaEventRecord[];
  onRefresh: () => void;
  onAddEvent: () => void;
  onEditEvent: (event: AreaEventRecord) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const MiniProgramAreaEventsView: React.FC<
  MiniProgramAreaEventsViewProps
> = ({ events, onRefresh, onAddEvent, onEditEvent, onDeleteEvent }) => {
  return (
    <div className="p-3.5 space-y-3">
      {/* App Top Action Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-slate-900">
            区域事件管理
          </div>
          <div className="text-[11.5px] text-slate-500 mt-0.5">
            自动化触发联动 · 共{' '}
            <span className="font-mono-tabular font-medium text-slate-700">
              {events.length}
            </span>{' '}
            条
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            aria-label="刷新区域事件"
            className="h-8 w-8 inline-flex items-center justify-center text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onAddEvent}
            className="h-8 px-3 inline-flex items-center gap-1 text-[12px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新增事件
          </button>
        </div>
      </div>

      {/* App Event Cards List */}
      {events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 px-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-[13.5px] font-medium text-slate-800">
            暂无区域事件
          </p>
          <p className="text-[12px] text-slate-500 mt-1">
            点击右上角「新增事件」配置区域自动化联动
          </p>
          <button
            type="button"
            onClick={onAddEvent}
            className="mt-3 h-8 px-4 text-[12px] font-medium text-white bg-[#4B996E] rounded-lg cursor-pointer"
          >
            立即新增
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((evt, idx) => (
            <article
              key={evt.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5"
            >
              {/* Title & Area */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      #{idx + 1}
                    </span>
                    <h3 className="text-[14px] font-semibold text-slate-900 truncate">
                      {evt.eventName}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 rounded-md whitespace-nowrap shrink-0">
                  <MapPin className="w-3 h-3" />
                  {evt.areaName}
                </span>
              </div>

              {/* Trigger Condition Block */}
              <div className="px-2.5 py-2 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-800">
                  <CalendarClock className="w-3.5 h-3.5 text-[#4B996E] shrink-0" />
                  <span>{getTriggerLabel(evt.triggerType)}</span>
                </div>
                {evt.triggerType === 'gym_face_open' && evt.triggerDeviceSn && (
                  <div className="text-[11px] font-mono-tabular text-slate-500 pl-5 truncate">
                    触发设备 SN: {evt.triggerDeviceSn}
                  </div>
                )}
                {evt.triggerType === 'ab_door_linkage' && (
                  <div className="text-[11px] font-mono-tabular text-slate-500 pl-5 break-all">
                    {evt.abDoorDeviceName} ({evt.abDoorDeviceSn}) ·{' '}
                    {evt.abCommand ?? 'ABReport'}
                  </div>
                )}
              </div>

              {/* Execution Actions */}
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-slate-400">
                  执行操作（{evt.actions.length}项）
                </div>
                <div className="space-y-1">
                  {evt.actions.map((act) => (
                    <div
                      key={act.id}
                      className="text-[12px] text-slate-700 leading-snug bg-slate-50/60 px-2.5 py-1.5 rounded border border-slate-100"
                    >
                      {formatActionSummary(act, evt.triggerType)}
                      {act.delaySeconds > 0 && (
                        <span className="ml-1.5 text-[11px] font-mono-tabular text-slate-400">
                          (延时 {act.delaySeconds}s)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Bottom Buttons */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onEditEvent(evt)}
                  className="h-8 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(evt.id)}
                  className="h-8 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-rose-600 bg-rose-50/70 border border-rose-200 hover:bg-rose-100 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
