import React from 'react';
import { GatewayRecord, RoomRecord } from '../types/device';

interface GatewaysViewProps {
  gateways: GatewayRecord[];
  onFilterDevicesByGateway: (gatewaySn: string) => void;
}

export const GatewaysView: React.FC<GatewaysViewProps> = ({
  gateways,
  onFilterDevicesByGateway,
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">网关列表</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            点击「查看挂载设备」可快速筛选该网关下的全部设备
          </p>
        </div>
        <span className="text-[12px] font-mono-tabular text-slate-500">
          共 {gateways.length} 台网关
        </span>
      </div>
      <div className="table-scroll overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[920px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-600">
              <th className="py-3 px-4 text-center w-[64px]">序号</th>
              <th className="py-3 px-4">网关SN</th>
              <th className="py-3 px-4">加盟商</th>
              <th className="py-3 px-4">所属门店</th>
              <th className="py-3 px-4">内网IP</th>
              <th className="py-3 px-4">固件版本</th>
              <th className="py-3 px-4 text-right">挂载设备数</th>
              <th className="py-3 px-4 text-center">状态</th>
              <th className="py-3 px-4">最近心跳</th>
              <th className="py-3 px-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
            {gateways.map((gw, idx) => (
              <tr key={gw.id} className="hover:bg-slate-50/90 transition-colors">
                <td className="py-3 px-4 text-center font-mono-tabular text-slate-500">
                  {idx + 1}
                </td>
                <td className="py-3 px-4 font-mono-tabular font-medium text-slate-900">
                  {gw.gatewaySn}
                </td>
                <td className="py-3 px-4">{gw.franchisee}</td>
                <td className="py-3 px-4">{gw.storeName}</td>
                <td className="py-3 px-4 font-mono-tabular text-slate-600">
                  {gw.ipAddress}
                </td>
                <td className="py-3 px-4 font-mono-tabular text-slate-600">
                  {gw.firmware}
                </td>
                <td className="py-3 px-4 text-right font-mono-tabular font-medium text-slate-900">
                  {gw.boundDevices}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-medium ${
                      gw.status === '在线' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {gw.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono-tabular text-[12.5px] text-slate-500">
                  {gw.lastHeartbeat}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => onFilterDevicesByGateway(gw.gatewaySn)}
                    className="h-7 px-3 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                  >
                    查看挂载设备
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

interface RoomsViewProps {
  rooms: RoomRecord[];
  onFilterDevicesByRoom: (roomName: string) => void;
  onManageRoomEvents?: (roomName: string) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  onFilterDevicesByRoom,
  onManageRoomEvents,
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">包间列表</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            点击「查看包厢设备」可直接跳转并筛选对应包厢关联设备
          </p>
        </div>
        <span className="text-[12px] font-mono-tabular text-slate-500">
          共 {rooms.length} 个包间
        </span>
      </div>
      <div className="table-scroll overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[840px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-600">
              <th className="py-3 px-4 text-center w-[64px]">序号</th>
              <th className="py-3 px-4">包厢名称</th>
              <th className="py-3 px-4">加盟商</th>
              <th className="py-3 px-4">所属门店</th>
              <th className="py-3 px-4">包间类型</th>
              <th className="py-3 px-4 text-right">绑定设备数</th>
              <th className="py-3 px-4 text-center">供电状态</th>
              <th className="py-3 px-4 text-center">运营状态</th>
              <th className="py-3 px-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
            {rooms.map((rm, idx) => (
              <tr key={rm.id} className="hover:bg-slate-50/90 transition-colors">
                <td className="py-3 px-4 text-center font-mono-tabular text-slate-500">
                  {idx + 1}
                </td>
                <td className="py-3 px-4 font-medium text-slate-900">{rm.roomName}</td>
                <td className="py-3 px-4">{rm.franchisee}</td>
                <td className="py-3 px-4">{rm.storeName}</td>
                <td className="py-3 px-4 text-slate-600">{rm.roomType}</td>
                <td className="py-3 px-4 text-right font-mono-tabular font-medium text-slate-900">
                  {rm.deviceCount}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-medium ${
                      rm.powerStatus === '通电中' ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {rm.powerStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-medium ${
                      rm.roomStatus === '使用中' ? 'text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {rm.roomStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onFilterDevicesByRoom(rm.roomName)}
                      className="h-7 px-3 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                    >
                      查看包厢设备
                    </button>
                    {onManageRoomEvents && (
                      <button
                        type="button"
                        onClick={() => onManageRoomEvents(rm.roomName)}
                        className="h-7 px-3 text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors cursor-pointer"
                      >
                        事件管理
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
