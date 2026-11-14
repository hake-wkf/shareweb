import React from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { DeviceFilterState } from '../types/device';
import { FRANCHISEE_OPTIONS } from '../data/mockDevices';

interface FilterBarProps {
  draftFilter: DeviceFilterState;
  onChange: (next: DeviceFilterState) => void;
  onSearch: () => void;
  onReset: () => void;
  activeFilterCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  draftFilter,
  onChange,
  onSearch,
  onReset,
  activeFilterCount,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const updateField = <K extends keyof DeviceFilterState>(
    key: K,
    value: DeviceFilterState[K]
  ) => {
    onChange({ ...draftFilter, [key]: value });
  };

  return (
    <section
      aria-label="设备筛选条件"
      className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5"
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-3.5"
        onKeyDown={handleKeyDown}
      >
        {/* 加盟商 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-franchisee"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            加盟商
          </label>
          <select
            id="filter-franchisee"
            value={draftFilter.franchisee}
            onChange={(e) => updateField('franchisee', e.target.value)}
            className="w-full h-9 px-3 text-[13px] text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          >
            <option value="">全部加盟商</option>
            {FRANCHISEE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* 店铺名称 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-store"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            店铺名称
          </label>
          <input
            id="filter-store"
            type="text"
            value={draftFilter.storeName}
            onChange={(e) => updateField('storeName', e.target.value)}
            placeholder="请输入店铺名称"
            className="w-full h-9 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>

        {/* 包厢名称 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-room"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            包厢名称
          </label>
          <input
            id="filter-room"
            type="text"
            value={draftFilter.roomName}
            onChange={(e) => updateField('roomName', e.target.value)}
            placeholder="请输入包厢名称"
            className="w-full h-9 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>

        {/* 网关SN */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-gateway"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            网关SN
          </label>
          <input
            id="filter-gateway"
            type="text"
            value={draftFilter.gatewaySn}
            onChange={(e) => updateField('gatewaySn', e.target.value)}
            placeholder="请输入网关SN"
            className="w-full h-9 px-3 text-[13px] font-mono-tabular text-slate-900 placeholder:font-sans placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>

        {/* Mac地址 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-mac"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            Mac地址
          </label>
          <input
            id="filter-mac"
            type="text"
            value={draftFilter.macAddress}
            onChange={(e) => updateField('macAddress', e.target.value)}
            placeholder="请输入Mac地址"
            className="w-full h-9 px-3 text-[13px] font-mono-tabular text-slate-900 placeholder:font-sans placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>

        {/* 设备名称 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-device-name"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            设备名称
          </label>
          <input
            id="filter-device-name"
            type="text"
            value={draftFilter.deviceName}
            onChange={(e) => updateField('deviceName', e.target.value)}
            placeholder="请输入设备名称"
            className="w-full h-9 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>

        {/* 设备状态 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-status"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            设备状态
          </label>
          <select
            id="filter-status"
            value={draftFilter.deviceStatus}
            onChange={(e) =>
              updateField('deviceStatus', e.target.value as DeviceFilterState['deviceStatus'])
            }
            className="w-full h-9 px-3 text-[13px] text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          >
            <option value="">全部设备状态</option>
            <option value="在线">在线</option>
            <option value="离线">离线</option>
          </select>
        </div>

        {/* 设备电量 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <label
            htmlFor="filter-battery"
            className="w-[68px] shrink-0 text-right text-[13px] font-medium text-slate-600 whitespace-nowrap"
          >
            设备电量
          </label>
          <select
            id="filter-battery"
            value={draftFilter.batteryFilter}
            onChange={(e) =>
              updateField('batteryFilter', e.target.value as DeviceFilterState['batteryFilter'])
            }
            className="w-full h-9 px-3 text-[13px] text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          >
            <option value="">全部电量状态</option>
            <option value="normal">电量正常 (&gt;20%)</option>
            <option value="low">低电量预警 (≤20%)</option>
            <option value="wired">外接供电 / 无电池</option>
          </select>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12px] text-slate-500">
          {activeFilterCount > 0
            ? `已启用 ${activeFilterCount} 项筛选条件`
            : '支持按网关SN、Mac地址或设备名称模糊查询'}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            重置
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex items-center gap-1.5 h-9 px-5 text-[13px] font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            查询
          </button>
        </div>
      </div>
    </section>
  );
};
