import { useMemo, useState } from 'react';
import { CheckCircle2, Monitor, RefreshCw, Smartphone, X } from 'lucide-react';
import {
  AreaEventRecord,
  DeviceFilterState,
  DevicePurpose,
  DeviceRecord,
  Gzdls7PanelTab,
  PlatformMode,
  WorkspaceTabKey,
} from './types/device';
import {
  INITIAL_DEVICES,
  INITIAL_GATEWAYS,
  INITIAL_ROOMS,
} from './data/mockDevices';
import { INITIAL_AREA_EVENTS } from './data/areaEventsData';
import { FilterBar } from './components/FilterBar';
import { DeviceTable } from './components/DeviceTable';
import { DeviceMoreDrawer } from './components/DeviceMoreDrawer';
import { Gzdls7PanelDrawer } from './components/Gzdls7PanelDrawer';
import { MiniProgramView } from './components/MiniProgramView';
import { MiniProgramEditModal } from './components/MiniProgramEditModal';
import {
  CommandModal,
  DeleteConfirmModal,
  DevicePurposeModal,
} from './components/DeviceModals';
import { GatewaysView, RoomsView } from './components/GatewayAndRoomViews';
import { AreaEventsView } from './components/AreaEventsView';
import { AreaEventModal } from './components/AreaEventModal';

const EMPTY_FILTER: DeviceFilterState = {
  franchisee: '',
  storeName: '',
  roomName: '',
  gatewaySn: '',
  macAddress: '',
  deviceName: '',
  deviceStatus: '',
  batteryFilter: '',
};

interface ToastMessage {
  id: number;
  text: string;
}

const TABS: { key: WorkspaceTabKey; label: string }[] = [
  { key: 'gateways', label: '网关列表' },
  { key: 'devices', label: '设备列表' },
  { key: 'rooms', label: '包间列表' },
  { key: 'events', label: '区域事件' },
];

export default function App() {
  const [platform, setPlatform] = useState<PlatformMode>('web');
  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>('devices');
  const [openTabs, setOpenTabs] = useState<WorkspaceTabKey[]>([
    'gateways',
    'devices',
    'rooms',
    'events',
  ]);

  const [devices, setDevices] = useState<DeviceRecord[]>(INITIAL_DEVICES);
  const [draftFilter, setDraftFilter] = useState<DeviceFilterState>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] =
    useState<DeviceFilterState>(EMPTY_FILTER);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [moreDeviceId, setMoreDeviceId] = useState<string | null>(null);
  const [miniProgramEditId, setMiniProgramEditId] = useState<string | null>(null);
  const [gzdls7Drawer, setGzdls7Drawer] = useState<{
    deviceId: string;
    tab: Gzdls7PanelTab;
  } | null>(null);
  const [purposeDevice, setPurposeDevice] = useState<DeviceRecord | null>(null);
  const [commandDevice, setCommandDevice] = useState<DeviceRecord | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<DeviceRecord | null>(null);

  const [areaEvents, setAreaEvents] =
    useState<AreaEventRecord[]>(INITIAL_AREA_EVENTS);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingAreaEvent, setEditingAreaEvent] =
    useState<AreaEventRecord | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (text: string) => {
    const id = Date.now();
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2800);
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilter).filter((v) => v !== '').length;
  }, [appliedFilter]);

  const filteredDevices = useMemo(() => {
    return devices.filter((item) => {
      if (
        appliedFilter.franchisee &&
        item.franchisee !== appliedFilter.franchisee
      ) {
        return false;
      }
      if (
        appliedFilter.storeName.trim() &&
        !item.storeName
          .toLowerCase()
          .includes(appliedFilter.storeName.trim().toLowerCase())
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
        appliedFilter.gatewaySn.trim() &&
        !item.gatewaySn
          .toLowerCase()
          .includes(appliedFilter.gatewaySn.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.macAddress.trim() &&
        !item.macAddress
          .toLowerCase()
          .includes(appliedFilter.macAddress.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.deviceName.trim() &&
        !item.deviceName
          .toLowerCase()
          .includes(appliedFilter.deviceName.trim().toLowerCase())
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
    });
  }, [devices, appliedFilter]);

  const pagedDevices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDevices.slice(start, start + pageSize);
  }, [filteredDevices, page, pageSize]);

  const moreDevice = useMemo(
    () => devices.find((d) => d.id === moreDeviceId) ?? null,
    [devices, moreDeviceId]
  );

  const gzdls7Device = useMemo(
    () =>
      gzdls7Drawer
        ? devices.find((d) => d.id === gzdls7Drawer.deviceId) ?? null
        : null,
    [devices, gzdls7Drawer]
  );

  const miniProgramEditDevice = useMemo(
    () => devices.find((d) => d.id === miniProgramEditId) ?? null,
    [devices, miniProgramEditId]
  );

  const triggerBriefLoad = (callback: () => void) => {
    setIsLoading(true);
    window.setTimeout(() => {
      callback();
      setIsLoading(false);
    }, 160);
  };

  const handleSearch = () => {
    triggerBriefLoad(() => {
      setAppliedFilter(draftFilter);
      setPage(1);
    });
  };

  const handleReset = () => {
    triggerBriefLoad(() => {
      setDraftFilter(EMPTY_FILTER);
      setAppliedFilter(EMPTY_FILTER);
      setPage(1);
    });
  };

  const handleRefreshList = () => {
    triggerBriefLoad(() => {
      showToast('设备列表已同步至最新状态');
    });
  };

  const handleDeviceTest = (
    device: DeviceRecord,
    action: '开启' | '关闭' | '开锁' | '关锁' | '开门'
  ) => {
    const nextSwitchState =
      action === '开启' || action === '开锁' || action === '开门' ? '开' : '关';
    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id ? { ...d, switchState: nextSwitchState } : d
      )
    );
    if (action === '开门') {
      showToast(`已立即向「${device.deviceName}」(${device.model}) 发送开门指令`);
      return;
    }
    showToast(`已对「${device.deviceName}」执行${action}测试`);
  };

  const handleSavePurpose = (deviceId: string, purpose: DevicePurpose) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, purpose } : d))
    );
    showToast(`设备用处已更新为「${purpose}」`);
  };

  const handleSaveMiniProgramEdit = (
    deviceId: string,
    updates: {
      deviceName: string;
      sortOrder: number;
      enabled: boolean;
      boundRoom: string;
      purpose: DevicePurpose;
    }
  ) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, ...updates } : d))
    );
    showToast(`已保存设备「${updates.deviceName}」配置`);
  };

  const handleSendCommand = (deviceId: string, commandName: string) => {
    const target = devices.find((d) => d.id === deviceId);
    showToast(
      `已向「${target?.deviceName ?? '设备'}」下发指令：${commandName}`
    );
  };

  const handleDeleteConfirm = (deviceId: string) => {
    const target = devices.find((d) => d.id === deviceId);
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    if (moreDeviceId === deviceId) {
      setMoreDeviceId(null);
    }
    showToast(`已移除设备「${target?.deviceName ?? ''}」`);
  };

  const handleSaveAreaEvent = (nextEvent: AreaEventRecord) => {
    setAreaEvents((prev) => {
      const exists = prev.some((e) => e.id === nextEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === nextEvent.id ? nextEvent : e));
      }
      return [nextEvent, ...prev];
    });
    showToast(`已保存区域事件「${nextEvent.eventName}」`);
  };

  const handleDeleteAreaEvent = (eventId: string) => {
    const target = areaEvents.find((e) => e.id === eventId);
    setAreaEvents((prev) => prev.filter((e) => e.id !== eventId));
    showToast(`已删除区域事件「${target?.eventName ?? ''}」`);
  };

  const handleRefreshAreaEvents = () => {
    triggerBriefLoad(() => {
      showToast('区域事件列表已刷新');
    });
  };

  const formatNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds()
    )}`;
  };

  const handleQuerySignal = async (deviceId: string) => {
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    const target = devices.find((d) => d.id === deviceId);
    if (!target) return;

    const nextSignal =
      target.status === '离线'
        ? 0
        : -(Math.floor(Math.random() * 26) + 38); // -38 to -63 dBm
    const queryTime = formatNow();

    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              signalStrength: nextSignal,
              lastSignalQueryTime: queryTime,
            }
          : d
      )
    );
    showToast(
      nextSignal === 0
        ? `设备「${target.deviceName}」当前离线，信号值 0`
        : `设备信号查询成功：${nextSignal} dBm`
    );
  };

  const handleRefreshAllDetails = async (deviceId: string) => {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const queryTime = formatNow();
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, lastSignalQueryTime: queryTime } : d
      )
    );
    showToast('已重新获取设备扩展状态信息');
  };

  const handleAdjustVolume = (deviceId: string, nextVolume: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, volume: nextVolume } : d))
    );
  };

  const handleCloseTab = (
    e: React.MouseEvent,
    tabKey: WorkspaceTabKey
  ) => {
    e.stopPropagation();
    if (openTabs.length <= 1) return;
    const remaining = openTabs.filter((k) => k !== tabKey);
    setOpenTabs(remaining);
    if (activeTab === tabKey) {
      setActiveTab(remaining[0]);
    }
  };

  const handleJumpFromGateway = (gatewaySn: string) => {
    const next = { ...EMPTY_FILTER, gatewaySn };
    setDraftFilter(next);
    setAppliedFilter(next);
    setPage(1);
    if (!openTabs.includes('devices')) {
      setOpenTabs((prev) => [...prev, 'devices']);
    }
    setActiveTab('devices');
  };

  const handleJumpFromRoom = (roomName: string) => {
    const next = { ...EMPTY_FILTER, roomName };
    setDraftFilter(next);
    setAppliedFilter(next);
    setPage(1);
    if (!openTabs.includes('devices')) {
      setOpenTabs((prev) => [...prev, 'devices']);
    }
    setActiveTab('devices');
  };

  const currentTabLabel =
    platform === 'miniapp'
      ? '小程序后台 · 设备列表'
      : TABS.find((t) => t.key === activeTab)?.label ?? '设备列表';

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-900 flex flex-col">
      {/* Top Bar Contract: Brand / Breadcrumb + Platform Switcher & Refresh */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[15px] font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              智控物联平台
            </span>
            <span className="text-slate-300 select-none" aria-hidden="true">
              /
            </span>
            <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap shrink-0">
              {currentTabLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Platform Switcher: Web 后台 <-> 小程序后台 */}
            <div
              role="group"
              aria-label="切换后台平台"
              className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg"
            >
              <button
                type="button"
                onClick={() => setPlatform('web')}
                className={`inline-flex items-center gap-1.5 h-7 px-3 text-[12.5px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  platform === 'web'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Web 后台
              </button>
              <button
                type="button"
                onClick={() => setPlatform('miniapp')}
                className={`inline-flex items-center gap-1.5 h-7 px-3 text-[12.5px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  platform === 'miniapp'
                    ? 'bg-white text-[#2F7551] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                小程序后台
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefreshList}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[12.5px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${
                  isLoading ? 'animate-spin' : ''
                }`}
              />
              刷新数据
            </button>
          </div>
        </div>

        {/* Workspace Multi-Tab Strip (Web 后台) */}
        {platform === 'web' && (
          <div className="bg-[#F8FAFC] border-t border-slate-200/80">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-end gap-1 pt-2 overflow-x-auto">
              {TABS.filter((t) => openTabs.includes(t.key)).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`group inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium rounded-t-md border border-b-0 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-blue-600 border-slate-200 relative -mb-px pb-[9px]'
                        : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {openTabs.length > 1 && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`关闭${tab.label}`}
                        onClick={(e) => handleCloseTab(e, tab.key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCloseTab(
                              e as unknown as React.MouseEvent,
                              tab.key
                            );
                          }
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        {platform === 'miniapp' ? (
          <MiniProgramView
            devices={devices}
            draftFilter={draftFilter}
            appliedFilter={appliedFilter}
            onChangeFilter={setDraftFilter}
            onSearch={handleSearch}
            onReset={handleReset}
            onDeviceTest={handleDeviceTest}
            onOpenEditMore={(d) => setMiniProgramEditId(d.id)}
            onNotify={showToast}
          />
        ) : (
          <>
            {activeTab === 'devices' && (
              <>
                <FilterBar
                  draftFilter={draftFilter}
                  onChange={setDraftFilter}
                  onSearch={handleSearch}
                  onReset={handleReset}
                  activeFilterCount={activeFilterCount}
                />

                <DeviceTable
                  devices={pagedDevices}
                  totalCount={filteredDevices.length}
                  page={page}
                  pageSize={pageSize}
                  isLoading={isLoading}
                  onPageChange={(nextPage) => setPage(nextPage)}
                  onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize);
                    setPage(1);
                  }}
                  onResetFilters={handleReset}
                  onOpenPurpose={(d) => setPurposeDevice(d)}
                  onOpenCommand={(d) => setCommandDevice(d)}
                  onDeviceTest={handleDeviceTest}
                  onOpenGzdls7Panel={(d, tab) =>
                    setGzdls7Drawer({ deviceId: d.id, tab })
                  }
                  onOpenMore={(d) => setMoreDeviceId(d.id)}
                  onRequestDelete={(d) => setDeleteDevice(d)}
                />
              </>
            )}

            {activeTab === 'gateways' && (
              <GatewaysView
                gateways={INITIAL_GATEWAYS}
                onFilterDevicesByGateway={handleJumpFromGateway}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomsView
                rooms={INITIAL_ROOMS}
                onFilterDevicesByRoom={handleJumpFromRoom}
              />
            )}

            {activeTab === 'events' && (
              <AreaEventsView
                events={areaEvents}
                isRefreshing={isLoading}
                onRefresh={handleRefreshAreaEvents}
                onAddEvent={() => {
                  setEditingAreaEvent(null);
                  setIsEventModalOpen(true);
                }}
                onEditEvent={(evt) => {
                  setEditingAreaEvent(evt);
                  setIsEventModalOpen(true);
                }}
                onDeleteEvent={handleDeleteAreaEvent}
              />
            )}
          </>
        )}
      </main>

      {/* Slide-over "更多" Drawer with 6 requested items (Web 后台) */}
      <DeviceMoreDrawer
        device={moreDevice}
        onClose={() => setMoreDeviceId(null)}
        onQuerySignal={handleQuerySignal}
        onRefreshAllDetails={handleRefreshAllDetails}
        onAdjustVolume={handleAdjustVolume}
      />

      {/* Mini-Program Edit & More Modal */}
      <MiniProgramEditModal
        device={miniProgramEditDevice}
        onClose={() => setMiniProgramEditId(null)}
        onSave={handleSaveMiniProgramEdit}
        onQuerySignal={handleQuerySignal}
        onAdjustVolume={handleAdjustVolume}
      />

      {/* GZDLS7 Specialized Test & Control Drawer */}
      <Gzdls7PanelDrawer
        device={gzdls7Device}
        initialTab={gzdls7Drawer?.tab ?? 'personnel'}
        onClose={() => setGzdls7Drawer(null)}
        onSendOpenDoor={(d) => handleDeviceTest(d, '开门')}
        onNotify={showToast}
      />

      {/* Area Event Add / Edit Modal */}
      <AreaEventModal
        isOpen={isEventModalOpen}
        editingEvent={editingAreaEvent}
        devices={devices}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingAreaEvent(null);
        }}
        onSave={handleSaveAreaEvent}
      />

      {/* Action Modals */}
      <DevicePurposeModal
        device={purposeDevice}
        onClose={() => setPurposeDevice(null)}
        onSave={handleSavePurpose}
      />
      <CommandModal
        device={commandDevice}
        onClose={() => setCommandDevice(null)}
        onSendCommand={handleSendCommand}
      />
      <DeleteConfirmModal
        device={deleteDevice}
        onClose={() => setDeleteDevice(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Subtle Action Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-[13px] font-medium rounded-lg shadow-lg border border-slate-800"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
