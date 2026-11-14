import React from 'react';
import { Inbox, Plus, RefreshCw } from 'lucide-react';
import { AreaEventRecord } from '../types/device';
import {
  formatActionSummary,
  getTriggerLabel,
} from '../data/areaEventsData';

interface AreaEventsViewProps {
  events: AreaEventRecord[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddEvent: () => void;
  onEditEvent: (event: AreaEventRecord) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const AreaEventsView: React.FC<AreaEventsViewProps> = ({
  events,
  isRefreshing,
  onRefresh,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header matching Reference Image 1 */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900">
            区域事件管理
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            管理区域自动化事件，根据订单状态、人脸开门或AB门联动触发设备操作
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAddEvent}
            className="inline-flex items-center gap-1.5 h-8.5 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新增事件
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 h-8.5 px-4 text-[13px] font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            刷新
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-scroll overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[920px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[12.5px] font-semibold text-slate-600">
              <th className="py-3 px-4 text-center w-[72px]">序号</th>
              <th className="py-3 px-4 w-[200px]">事件名称</th>
              <th className="py-3 px-4 w-[160px]">所属区域</th>
              <th className="py-3 px-4 w-[260px]">触发条件</th>
              <th className="py-3 px-4">执行操作</th>
              <th className="py-3 px-4 text-center w-[130px]">操作</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-[13.5px] font-medium text-slate-800">
                    暂无区域事件
                  </p>
                  <p className="text-[12px] text-slate-500 mt-1">
                    点击右上角「新增事件」创建自动化联动规则
                  </p>
                </td>
              </tr>
            ) : (
              events.map((evt, idx) => (
                <tr
                  key={evt.id}
                  className="hover:bg-slate-50/90 transition-colors"
                >
                  <td className="py-3.5 px-4 text-center font-mono-tabular text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {evt.eventName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {evt.areaName}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">
                      {getTriggerLabel(evt.triggerType)}
                    </div>
                    {evt.triggerType === 'gym_face_open' &&
                      evt.triggerDeviceSn && (
                        <div className="mt-0.5 text-[11.5px] font-mono-tabular text-slate-500">
                          触发设备 SN: {evt.triggerDeviceSn}
                        </div>
                      )}
                    {evt.triggerType === 'ab_door_linkage' && (
                      <div className="mt-0.5 text-[11.5px] font-mono-tabular text-slate-500">
                        {evt.abDoorDeviceName} ({evt.abDoorDeviceSn}) ·{' '}
                        {evt.abCommand ?? 'ABReport'}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1 text-[12.5px] text-slate-700">
                      {evt.actions.map((act) => (
                        <div key={act.id} className="leading-snug">
                          {formatActionSummary(act, evt.triggerType)}
                          {act.delaySeconds > 0 && (
                            <span className="ml-1.5 text-[11.5px] font-mono-tabular text-slate-400">
                              (延时 {act.delaySeconds}s)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onEditEvent(evt)}
                        className="text-[12.5px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(evt.id)}
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
    </section>
  );
};
