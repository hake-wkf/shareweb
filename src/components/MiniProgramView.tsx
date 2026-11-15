import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  DoorOpen,
  Inbox,
  Lightbulb,
  Lock,
  RotateCcw,
  ScanFace,
  Search,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react';
import {
  AreaEventRecord,
  DeviceFilterState,
  DeviceRecord,
} from '../types/device';
import { FRANCHISEE_OPTIONS } from '../data/mockDevices';
import { MiniProgramGzdls7View } from './MiniProgramGzdls7View';
import { MiniProgramAreaEventsView } from './MiniProgramAreaEventsView';
import { MiniProgramAreaEventForm } from './MiniProgramAreaEventForm';

interface MiniProgramViewProps {
  devices: DeviceRecord[];
  draftFilter: DeviceFilterState;
  appliedFilter: DeviceFilterState;
  onChangeFilter: (next: DeviceFilterState) => void;
  onSearch: () => void;
  onReset: () => void;
  onDeviceTest: (
    device: DeviceRecord,
    action: '开启' | '关闭' | '开锁' | '关锁' | '开门'
  ) => void;
  onOpenEditMore: (device: DeviceRecord) => void;
  onNotify: (message: string) => void;
  areaEvents: AreaEventRecord[];
  onSaveAreaEvent: (event: AreaEventRecord) => void;
  onDeleteAreaEvent: (eventId: string) => void;
  onRefreshAreaEvents: () => void;
}

function renderDeviceIcon(device: DeviceRecord) {
  if (device.model === 'GZDLS7') {
    return (
      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#4B996E] shrink-0">
        <ScanFace className="w-4 h-4" />
      </div>
    );
  }
  if (device.testMode === 'lock' || device.model === 'GZIRB52') {
    return (
      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
        <Lock className="w-4 h-4" />
      </div>
    );
  }
  if (device.model === 'GWXJS1') {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
        <Volume2 className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
      <Lightbulb className="w-4 h-4" />
    </div>
  );
}

export const MiniProgramView: React.FC<MiniProgramViewProps> = ({
  devices,
  draftFilter,
  appliedFilter,
  onChangeFilter,
  onSearch,
  onReset,
  onDeviceTest,
  onOpenEditMore,
  onNotify,
  areaEvents,
  onSaveAreaEvent,
  onDeleteAreaEvent,
  onRefreshAreaEvents,
}) => {
  const [appSection, setAppSection] = useState<'devices' | 'events'>('devices');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('全部门店');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部包间');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // In-app single subpage for GZDLS7 specialized controls
  const [activeGzdls7Id, setActiveGzdls7Id] = useState<string | null>(null);
  // In-app subpage for Area Event Add / Edit
  const [eventFormState, setEventFormState] = useState<{
    open: boolean;
    editing: AreaEventRecord | null;
  }>({ open: false, editing: null });

  const activeGzdls7Device = useMemo(
    () => devices.find((d) => d.id === activeGzdls7Id) ?? null,
    [devices, activeGzdls7Id]
  );

  const storeOptions = useMemo(() => {
    const ordered = [
      '全部门店',
      '测试一店',
      '测试八店',
      '测试九店',
      '测试十店',
      '谷家智能',
      '星曜台球高新旗舰店',
      '聚友自助台球万达店',
      '壹号棋牌茶社滨江店',
    ];
    const extras = Array.from(new Set(devices.map((d) => d.storeName))).filter(
      (s) => !ordered.includes(s)
    );
    return [...ordered, ...extras];
  }, [devices]);

  const filteredCards = useMemo(() => {
    return devices
      .filter((item) => {
        if (selectedStore !== '全部门店' && item.storeName !== selectedStore) {
          return false;
        }
        if (
          selectedCategory !== '全部包间' &&
          item.roomCategory !== selectedCategory
        ) {
          return false;
        }
        if (
          appliedFilter.franchisee &&
          item.franchisee !== appliedFilter.franchisee
        ) {
          return false;
        }
        if (
          appliedFilter.macAddress.trim() &&
          !item.macAddress
            .toLowerCase()
            .includes(appliedFilter.macAddress.trim().toLowerCase()) &&
          !item.gatewaySn
            .toLowerCase()
            .includes(appliedFilter.macAddress.trim().toLowerCase()) &&
          !item.deviceName
            .toLowerCase()
            .includes(appliedFilter.macAddress.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          appliedFilter.roomName.trim() &&
          !item.boundRoom
            .toLowerCase()
            .includes(appliedFilter.roomName.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          appliedFilter.deviceStatus &&
          item.status !== appliedFilter.deviceStatus
        ) {
          return false;
        }
        if (appliedFilter.batteryFilter === 'normal') {
          if (item.batteryLevel === null || item.batteryLevel <= 20) return false;
        } else if (appliedFilter.batteryFilter === 'low') {
          if (item.batteryLevel === null || item.batteryLevel > 20) return false;
        } else if (appliedFilter.batteryFilter === 'wired') {
          if (item.batteryLevel !== null) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (selectedStore === '全部门店') {
          const aScore = a.model === 'GZDLS7' ? 0 : a.storeName === '测试一店' ? 1 : 2;
          const bScore = b.model === 'GZDLS7' ? 0 : b.storeName === '测试一店' ? 1 : 2;
          if (aScore !== bScore) return aScore - bScore;
        }
        return a.sortOrder - b.sortOrder;
      });
  }, [devices, selectedStore, selectedCategory, appliedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedCards = filteredCards.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="w-full flex justify-center">
      {/* Mobile App Proportion Container (430px max width) */}
      <div className="relative w-full max-w-[430px] bg-[#F5F6F8] border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[720px]">
        {/* App Green Navigation Bar */}
        <div className="bg-[#4B996E] px-4 h-12 text-white flex items-center justify-between shrink-0">
          <div className="w-16 flex items-center">
            {activeGzdls7Device ? (
              <button
                type="button"
                onClick={() => setActiveGzdls7Id(null)}
                className="inline-flex items-center gap-0.5 text-[13px] font-medium text-white hover:text-emerald-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                返回
              </button>
            ) : eventFormState.open ? (
              <button
                type="button"
                onClick={() =>
                  setEventFormState({ open: false, editing: null })
                }
                className="inline-flex items-center gap-0.5 text-[13px] font-medium text-white hover:text-emerald-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                返回
              </button>
            ) : (
              <span className="text-[12px] text-emerald-100 whitespace-nowrap">
                小程序
              </span>
            )}
          </div>

          <h1 className="text-[15px] font-semibold tracking-tight truncate text-center">
            {activeGzdls7Device
              ? 'GZDLS7 操作'
              : eventFormState.open
              ? eventFormState.editing
                ? '编辑区域事件'
                : '新增区域事件'
              : appSection === 'events'
              ? '区域事件'
              : '设备列表'}
          </h1>

          <div className="w-16 flex items-center justify-end">
            {!activeGzdls7Device && !eventFormState.open && (
              <span className="text-[12px] font-mono-tabular text-emerald-100 whitespace-nowrap">
                {appSection === 'events'
                  ? `${areaEvents.length}条`
                  : `${filteredCards.length}台`}
              </span>
            )}
          </div>
        </div>

        {/* Subpage: GZDLS7 Controls OR Area Event Form OR Main App Sections */}
        {activeGzdls7Device ? (
          <div className="flex-1 overflow-y-auto">
            <MiniProgramGzdls7View
              device={activeGzdls7Device}
              onNotify={onNotify}
            />
          </div>
        ) : eventFormState.open ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <MiniProgramAreaEventForm
              editingEvent={eventFormState.editing}
              devices={devices}
              onCancel={() =>
                setEventFormState({ open: false, editing: null })
              }
              onSave={(saved) => {
                onSaveAreaEvent(saved);
                setEventFormState({ open: false, editing: null });
              }}
            />
          </div>
        ) : appSection === 'events' ? (
          <div className="flex-1 overflow-y-auto">
            <MiniProgramAreaEventsView
              events={areaEvents}
              onRefresh={onRefreshAreaEvents}
              onAddEvent={() =>
                setEventFormState({ open: true, editing: null })
              }
              onEditEvent={(evt) =>
                setEventFormState({ open: true, editing: evt })
              }
              onDeleteEvent={onDeleteAreaEvent}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="p-3.5 space-y-3">
              {/* App Search & Filter Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={draftFilter.macAddress}
                      onChange={(e) =>
                        onChangeFilter({
                          ...draftFilter,
                          macAddress: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setPage(1);
                          onSearch();
                        }
                      }}
                      placeholder="请输入设备DevSN / 名称"
                      className="w-full h-9 pl-8 pr-2.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      onSearch();
                    }}
                    className="h-9 px-3 text-[12.5px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    搜索
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMoreFilters((p) => !p)}
                    aria-label="展开或收起筛选"
                    className={`h-9 w-9 inline-flex items-center justify-center border rounded-lg shrink-0 cursor-pointer ${
                      showMoreFilters
                        ? 'bg-emerald-50 border-emerald-300 text-[#2F7551]'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Store & Room Category Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      aria-label="选择门店"
                      value={selectedStore}
                      onChange={(e) => {
                        setSelectedStore(e.target.value);
                        setPage(1);
                      }}
                      className="w-full h-8 pl-2.5 pr-7 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-[#4B996E]"
                    >
                      {storeOptions.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      aria-label="选择包间类型"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setPage(1);
                      }}
                      className="w-full h-8 pl-2.5 pr-7 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-[#4B996E]"
                    >
                      <option value="全部包间">全部包间</option>
                      <option value="台球桌">台球桌</option>
                      <option value="棋牌茶社">棋牌茶社</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Expandable Filters */}
                {showMoreFilters && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        aria-label="筛选加盟商"
                        value={draftFilter.franchisee}
                        onChange={(e) =>
                          onChangeFilter({
                            ...draftFilter,
                            franchisee: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 text-[12px] bg-white border border-slate-200 rounded-md"
                      >
                        <option value="">全部加盟商</option>
                        {FRANCHISEE_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={draftFilter.roomName}
                        onChange={(e) =>
                          onChangeFilter({
                            ...draftFilter,
                            roomName: e.target.value,
                          })
                        }
                        placeholder="包厢名称"
                        className="w-full h-8 px-2.5 text-[12px] bg-white border border-slate-200 rounded-md"
                      />

                      <select
                        aria-label="筛选设备状态"
                        value={draftFilter.deviceStatus}
                        onChange={(e) =>
                          onChangeFilter({
                            ...draftFilter,
                            deviceStatus: e.target
                              .value as DeviceFilterState['deviceStatus'],
                          })
                        }
                        className="w-full h-8 px-2 text-[12px] bg-white border border-slate-200 rounded-md"
                      >
                        <option value="">全部设备状态</option>
                        <option value="在线">在线</option>
                        <option value="离线">离线</option>
                      </select>

                      <select
                        aria-label="筛选设备电量"
                        value={draftFilter.batteryFilter}
                        onChange={(e) =>
                          onChangeFilter({
                            ...draftFilter,
                            batteryFilter: e.target
                              .value as DeviceFilterState['batteryFilter'],
                          })
                        }
                        className="w-full h-8 px-2 text-[12px] bg-white border border-slate-200 rounded-md"
                      >
                        <option value="">全部电量状态</option>
                        <option value="normal">电量正常 (&gt;20%)</option>
                        <option value="low">低电量 (≤20%)</option>
                        <option value="wired">外接供电</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStore('全部门店');
                          setSelectedCategory('全部包间');
                          setPage(1);
                          onReset();
                        }}
                        className="h-8 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        重置
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPage(1);
                          onSearch();
                        }}
                        className="h-8 text-[12px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-md cursor-pointer"
                      >
                        确认筛选
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2-Column App Device Cards Grid */}
              {pagedCards.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl py-12 px-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-[13.5px] font-medium text-slate-800">
                    暂无符合条件的设备
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStore('全部门店');
                      setSelectedCategory('全部包间');
                      onReset();
                    }}
                    className="mt-3 h-8 px-3.5 text-[12px] font-medium text-[#2F7551] bg-emerald-50 rounded-md cursor-pointer"
                  >
                    重置筛选
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {pagedCards.map((device) => (
                    <article
                      key={device.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2.5 min-w-0"
                    >
                      {/* Top Icon & Top-Right Quick Action */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          {renderDeviceIcon(device)}

                          {device.testMode === 'gzdls7' && (
                            <button
                              type="button"
                              onClick={() => onDeviceTest(device, '开门')}
                              className="h-7 px-2 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <DoorOpen className="w-3 h-3" />
                              开门
                            </button>
                          )}

                          {device.testMode === 'switch' && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onDeviceTest(device, '开启')}
                                className="h-6 px-1.5 text-[10.5px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded whitespace-nowrap cursor-pointer"
                              >
                                开启
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeviceTest(device, '关闭')}
                                className="h-6 px-1.5 text-[10.5px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded whitespace-nowrap cursor-pointer"
                              >
                                关闭
                              </button>
                            </div>
                          )}

                          {device.testMode === 'lock' && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onDeviceTest(device, '开锁')}
                                className="h-6 px-1.5 text-[10.5px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded whitespace-nowrap cursor-pointer"
                              >
                                开锁
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeviceTest(device, '关锁')}
                                className="h-6 px-1.5 text-[10.5px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded whitespace-nowrap cursor-pointer"
                              >
                                关锁
                              </button>
                            </div>
                          )}

                          {device.testMode === 'none' && (
                            <span className="text-[10.5px] text-slate-400 whitespace-nowrap pt-1">
                              音频终端
                            </span>
                          )}
                        </div>

                        {/* Name & Online/Offline Status right next to name */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3
                              className="text-[13.5px] font-semibold text-slate-900 truncate"
                              title={device.deviceName}
                            >
                              {device.deviceName}
                            </h3>
                            <span
                              className={`text-[11px] font-medium whitespace-nowrap shrink-0 ${
                                device.status === '在线'
                                  ? 'text-emerald-700'
                                  : 'text-rose-600'
                              }`}
                            >
                              {device.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                            {device.model} · {device.boundRoom || '未绑定'}
                          </p>
                          <p className="mt-0.5 text-[10.5px] font-mono-tabular text-slate-400 truncate">
                            {device.macAddress}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Row: 操作 & 设备信息 */}
                      <div className="pt-2 border-t border-slate-100">
                        {device.testMode === 'gzdls7' ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveGzdls7Id(device.id)}
                              className="h-7.5 inline-flex items-center justify-center text-[11.5px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md whitespace-nowrap cursor-pointer"
                            >
                              操作
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEditMore(device)}
                              className="h-7.5 inline-flex items-center justify-center text-[11.5px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
                            >
                              设备信息
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenEditMore(device)}
                            className="w-full h-7.5 inline-flex items-center justify-center text-[11.5px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
                          >
                            设备信息
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* App Pagination Footer */}
            {filteredCards.length > 0 && (
              <div className="bg-white border-t border-slate-200 px-3.5 py-2.5 flex items-center justify-between text-[12px] text-slate-600">
                <span className="font-mono-tabular">
                  {safePage} / {totalPages} 页 · 共 {filteredCards.length} 台
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                    className="h-7 px-2.5 inline-flex items-center gap-0.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    上一页
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(safePage + 1)}
                    className="h-7 px-2.5 inline-flex items-center gap-0.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    下一页
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Native App Bottom Tab Bar (Shown on top-level App screens) */}
        {!activeGzdls7Device && !eventFormState.open && (
          <nav
            aria-label="小程序底部导航"
            className="bg-white border-t border-slate-200 grid grid-cols-2 h-13 shrink-0"
          >
            <button
              type="button"
              onClick={() => setAppSection('devices')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
                appSection === 'devices'
                  ? 'text-[#4B996E]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>设备列表</span>
            </button>
            <button
              type="button"
              onClick={() => setAppSection('events')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
                appSection === 'events'
                  ? 'text-[#4B996E]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              <span>区域事件</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};
