import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Copy,
  Cpu,
  Image as ImageIcon,
  Inbox,
  MoreHorizontal,
  Trash2,
  Type,
  Users,
  Volume2,
} from 'lucide-react';
import { DeviceRecord, Gzdls7PanelTab } from '../types/device';

interface DeviceTableProps {
  devices: DeviceRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  onResetFilters: () => void;
  onOpenPurpose: (device: DeviceRecord) => void;
  onOpenCommand: (device: DeviceRecord) => void;
  onDeviceTest: (
    device: DeviceRecord,
    action: '开启' | '关闭' | '开锁' | '关锁' | '开门'
  ) => void;
  onOpenGzdls7Panel: (device: DeviceRecord, tab: Gzdls7PanelTab) => void;
  onOpenMore: (device: DeviceRecord) => void;
  onRequestDelete: (device: DeviceRecord) => void;
}

const GZDLS7_MENU_ITEMS: {
  tab: Gzdls7PanelTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  { tab: 'personnel', label: '设备人员列表', icon: <Users className="w-3.5 h-3.5 text-slate-500" /> },
  { tab: 'info', label: '设备信息', icon: <Cpu className="w-3.5 h-3.5 text-slate-500" /> },
  { tab: 'attendance', label: '获取打卡记录', icon: <Clock className="w-3.5 h-3.5 text-slate-500" /> },
  { tab: 'text', label: '下方显示文字', icon: <Type className="w-3.5 h-3.5 text-slate-500" /> },
  { tab: 'image', label: '下方显示图片', icon: <ImageIcon className="w-3.5 h-3.5 text-slate-500" /> },
  { tab: 'audio', label: '设置音频文件', icon: <Volume2 className="w-3.5 h-3.5 text-slate-500" /> },
];

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onResetFilters,
  onOpenPurpose,
  onOpenCommand,
  onDeviceTest,
  onOpenGzdls7Panel,
  onOpenMore,
  onRequestDelete,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [jumpInput, setJumpInput] = useState('');
  const [openMenu, setOpenMenu] = useState<{
    device: DeviceRecord;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleClose = () => setOpenMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [openMenu]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleCopy = (key: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(key);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === key ? null : prev));
    }, 1200);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpInput.trim(), 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(Math.max(1, parsed), totalPages);
      onPageChange(clamped);
    }
    setJumpInput('');
  };

  // Build compact page number list (e.g., 1 2 3 4 5 ... 10)
  const getPageNumbers = (): (number | 'ellipsis-left' | 'ellipsis-right')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [1];
    const start = Math.max(2, page - 2);
    const end = Math.min(totalPages - 1, page + 2);

    if (start > 2) items.push('ellipsis-left');
    for (let p = start; p <= end; p++) {
      items.push(p);
    }
    if (end < totalPages - 1) items.push('ellipsis-right');
    items.push(totalPages);
    return items;
  };

  return (
    <section
      aria-label="设备数据列表"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      <div className="table-scroll overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[1080px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-600">
              <th className="py-3 px-3.5 text-center w-[64px] whitespace-nowrap">序号</th>
              <th className="py-3 px-3.5 whitespace-nowrap">网关SN</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Mac地址</th>
              <th className="py-3 px-3.5 whitespace-nowrap">model</th>
              <th className="py-3 px-3.5 whitespace-nowrap">设备名称</th>
              <th className="py-3 px-3.5 whitespace-nowrap">绑定包厢</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap w-[88px]">
                设备状态
              </th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap w-[112px]">
                设备用处
              </th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap w-[108px]">
                指令操作
              </th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap w-[172px]">
                设备测试
              </th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap w-[148px]">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <tr key={i} className="h-[48px]">
                  <td colSpan={11} className="px-4 py-2.5">
                    <div className="h-5 bg-slate-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-14 px-6 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-[14px] font-medium text-slate-800">
                      未找到符合条件的设备
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      请尝试调整筛选条件，或重置筛选查看全部已接入设备。
                    </p>
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="mt-4 h-8 px-4 text-[13px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                    >
                      重置筛选条件
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              devices.map((row, idx) => {
                const rowNumber = (page - 1) * pageSize + idx + 1;
                const gwCopyKey = `gw-${row.id}`;
                const macCopyKey = `mac-${row.id}`;

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/90 transition-colors"
                  >
                    {/* 序号 */}
                    <td className="py-3 px-3.5 text-center font-mono-tabular text-slate-500 whitespace-nowrap">
                      {rowNumber}
                    </td>

                    {/* 网关SN */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopy(gwCopyKey, row.gatewaySn)}
                        title="点击复制网关SN"
                        className="group inline-flex items-center gap-1.5 font-mono-tabular text-[12.5px] text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <span>{row.gatewaySn}</span>
                        {copiedId === gwCopyKey ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </td>

                    {/* Mac地址 */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopy(macCopyKey, row.macAddress)}
                        title="点击复制Mac地址"
                        className="group inline-flex items-center gap-1.5 font-mono-tabular text-[12.5px] text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <span>{row.macAddress}</span>
                        {copiedId === macCopyKey ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </td>

                    {/* model */}
                    <td className="py-3 px-3.5 font-mono-tabular text-[12.5px] text-slate-600 whitespace-nowrap">
                      {row.model}
                    </td>

                    {/* 设备名称 */}
                    <td className="py-3 px-3.5 font-medium text-slate-900 whitespace-nowrap max-w-[210px] truncate" title={row.deviceName}>
                      {row.deviceName}
                    </td>

                    {/* 绑定包厢 */}
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                      {row.boundRoom}
                    </td>

                    {/* 设备状态 */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`text-[13px] font-medium ${
                          row.status === '在线'
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* 设备用处 */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenPurpose(row)}
                        className="inline-flex items-center justify-center h-7 px-3 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {row.purpose}
                      </button>
                    </td>

                    {/* 指令操作 */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenCommand(row)}
                        className="inline-flex items-center justify-center h-7 px-3 text-[12px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        指令操作
                      </button>
                    </td>

                    {/* 设备测试 */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      {row.testMode === 'switch' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDeviceTest(row, '开启')}
                            className="h-7 px-2.5 text-[12px] font-medium text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            开启
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeviceTest(row, '关闭')}
                            className="h-7 px-2.5 text-[12px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            关闭
                          </button>
                        </div>
                      )}
                      {row.testMode === 'lock' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDeviceTest(row, '开锁')}
                            className="h-7 px-2.5 text-[12px] font-medium text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            开锁
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeviceTest(row, '关锁')}
                            className="h-7 px-2.5 text-[12px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            关锁
                          </button>
                        </div>
                      )}
                      {row.testMode === 'gzdls7' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDeviceTest(row, '开门')}
                            className="h-7 px-2.5 text-[12px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            开门
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenu?.device.id === row.id) {
                                setOpenMenu(null);
                                return;
                              }
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuHeight = 236;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const top =
                                spaceBelow < menuHeight
                                  ? Math.max(8, rect.top - menuHeight - 4)
                                  : rect.bottom + 4;
                              const left = Math.min(
                                window.innerWidth - 168,
                                Math.max(8, rect.right - 156)
                              );
                              setOpenMenu({ device: row, top, left });
                            }}
                            aria-expanded={openMenu?.device.id === row.id}
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            更多操作
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </button>
                        </div>
                      )}
                      {row.testMode === 'none' && (
                        <span className="text-slate-300 select-none">—</span>
                      )}
                    </td>

                    {/* 操作: 更多 + 删除 */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenMore(row)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
                          更多
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(row)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="font-mono-tabular">共 {totalCount} 条</span>
          <select
            aria-label="每页显示条数"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2.5 text-[12px] text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="上一页"
            className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((item) => {
            if (item === 'ellipsis-left' || item === 'ellipsis-right') {
              return (
                <span
                  key={item}
                  className="w-8 h-8 inline-flex items-center justify-center text-slate-400 select-none"
                >
                  ···
                </span>
              );
            }
            const isActive = item === page;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`min-w-8 h-8 px-2 inline-flex items-center justify-center rounded font-mono-tabular text-[12.5px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="下一页"
            className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <form onSubmit={handleJumpSubmit} className="inline-flex items-center gap-1.5 ml-2">
            <span className="text-[12.5px] text-slate-500">前往</span>
            <input
              type="text"
              inputMode="numeric"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={String(page)}
              aria-label="跳转页码"
              className="w-11 h-8 px-2 text-center font-mono-tabular text-[12.5px] border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
            <span className="text-[12.5px] text-slate-500">页</span>
          </form>
        </div>
      </div>

      {/* Collapsible GZDLS7 "更多操作" Dropdown Menu */}
      {openMenu && (
        <div
          style={{ top: openMenu.top, left: openMenu.left }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-[156px] bg-white border border-slate-200 rounded-lg shadow-lg py-1"
          role="menu"
        >
          {GZDLS7_MENU_ITEMS.map((item) => (
            <button
              key={item.tab}
              type="button"
              role="menuitem"
              onClick={() => {
                const target = openMenu.device;
                setOpenMenu(null);
                onOpenGzdls7Panel(target, item.tab);
              }}
              className="w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
