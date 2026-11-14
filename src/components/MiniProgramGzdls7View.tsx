import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Link2,
  Play,
  RefreshCw,
  Search,
  Send,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import {
  DeviceRecord,
  Gzdls7AttendanceRecord,
  Gzdls7AudioFile,
  Gzdls7DeviceInfo,
  Gzdls7PanelTab,
  Gzdls7Personnel,
  QuickCoordinateKey,
} from '../types/device';
import {
  createInitialGzdls7Info,
  GZDLS7_SCREEN_HEIGHT,
  GZDLS7_SCREEN_WIDTH,
  INITIAL_GZDLS7_ATTENDANCE,
  INITIAL_GZDLS7_AUDIOS,
  INITIAL_GZDLS7_PERSONNEL,
  QUICK_COORDINATE_PRESETS,
} from '../data/gzdls7Data';

interface MiniProgramGzdls7ViewProps {
  device: DeviceRecord;
  initialTab?: Gzdls7PanelTab;
  onNotify: (message: string) => void;
}

const FEATURE_TABS: { key: Gzdls7PanelTab; label: string }[] = [
  { key: 'personnel', label: '人员列表' },
  { key: 'info', label: '设备信息' },
  { key: 'attendance', label: '打卡记录' },
  { key: 'text', label: '显示文字' },
  { key: 'image', label: '显示图片' },
  { key: 'audio', label: '音频文件' },
];

const TEXT_COLOR_SWATCHES = [
  '#FFFFFF',
  '#2563EB',
  '#16A34A',
  '#FACC15',
  '#EF4444',
  '#0F172A',
];

const BUILTIN_DISPLAY_IMAGES = [
  {
    id: 'welcome-poster',
    name: '迎宾欢迎画面',
    svgDataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><rect width="240" height="120" rx="8" fill="#1E3A8A"/><rect x="8" y="8" width="224" height="104" rx="6" fill="none" stroke="#93C5FD" stroke-width="1.5" stroke-dasharray="4 3"/><text x="120" y="54" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">欢迎光临</text><text x="120" y="80" fill="#BFDBFE" font-family="sans-serif" font-size="12" text-anchor="middle">请正对屏幕完成识别通行</text></svg>`
      ),
  },
  {
    id: 'guide-banner',
    name: '门禁扫码提示图',
    svgDataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><rect width="240" height="120" rx="8" fill="#0F172A"/><circle cx="52" cy="60" r="24" fill="#2563EB"/><path d="M44 60l6 6 12-12" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="148" y="54" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">智能门禁已就绪</text><text x="148" y="76" fill="#94A3B8" font-family="sans-serif" font-size="11" text-anchor="middle">刷脸或扫码即可自动开锁</text></svg>`
      ),
  },
];

export const MiniProgramGzdls7View: React.FC<MiniProgramGzdls7ViewProps> = ({
  device,
  initialTab = 'personnel',
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<Gzdls7PanelTab>(initialTab);

  // 1. Personnel
  const [personnelList, setPersonnelList] = useState<Gzdls7Personnel[]>(
    INITIAL_GZDLS7_PERSONNEL
  );
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [queryingFaceId, setQueryingFaceId] = useState<string | null>(null);
  const [selectedFacePerson, setSelectedFacePerson] =
    useState<Gzdls7Personnel | null>(null);

  // 2. Device info
  const [deviceInfo, setDeviceInfo] = useState<Gzdls7DeviceInfo>(() =>
    createInitialGzdls7Info(device.id)
  );
  const [isRefreshingInfo, setIsRefreshingInfo] = useState(false);

  // 3. Attendance
  const [startTime, setStartTime] = useState('2026-11-12T00:00');
  const [endTime, setEndTime] = useState('2026-11-13T23:59');
  const [attendanceRecords, setAttendanceRecords] = useState<
    Gzdls7AttendanceRecord[]
  >([]);
  const [hasQueriedAttendance, setHasQueriedAttendance] = useState(false);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // 4. Display text
  const [displayText, setDisplayText] = useState('欢迎光临，请刷脸通行');
  const [textCoordPreset, setTextCoordPreset] =
    useState<QuickCoordinateKey | 'custom'>('bottom-left');
  const [textX, setTextX] = useState(32);
  const [textY, setTextY] = useState(1140);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFontSize, setTextFontSize] = useState(28);
  const [textPersistMode, setTextPersistMode] = useState<'always' | 'seconds'>(
    'seconds'
  );
  const [textDurationSec, setTextDurationSec] = useState(5);

  // 5. Display image
  const [imageCoordPreset, setImageCoordPreset] =
    useState<QuickCoordinateKey | 'custom'>('center');
  const [imageX, setImageX] = useState(280);
  const [imageY, setImageY] = useState(600);
  const [imagePersistMode, setImagePersistMode] = useState<'always' | 'seconds'>(
    'always'
  );
  const [imageDurationSec, setImageDurationSec] = useState(10);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(
    BUILTIN_DISPLAY_IMAGES[0].svgDataUrl
  );
  const [selectedImageName, setSelectedImageName] = useState<string>(
    BUILTIN_DISPLAY_IMAGES[0].name
  );
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // 6. Audio file
  const [audioFiles, setAudioFiles] = useState<Gzdls7AudioFile[]>(
    INITIAL_GZDLS7_AUDIOS
  );
  const [audioUploadMode, setAudioUploadMode] = useState<'file' | 'url'>('file');
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null);
  const [pendingAudioUrl, setPendingAudioUrl] = useState('');
  const [pendingAudioName, setPendingAudioName] = useState('');
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [selectedPlayFileName, setSelectedPlayFileName] = useState<string>(
    INITIAL_GZDLS7_AUDIOS[0].fileName
  );
  const [playVolume, setPlayVolume] = useState<number>(80);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPersonnel = useMemo(() => {
    const kw = personnelSearch.trim().toLowerCase();
    if (!kw) return personnelList;
    return personnelList.filter((p) => p.name.toLowerCase().includes(kw));
  }, [personnelList, personnelSearch]);

  const handleQuerySingleFace = (person: Gzdls7Personnel) => {
    setQueryingFaceId(person.id);
    window.setTimeout(() => {
      const updated = { ...person, faceQueried: true };
      setPersonnelList((prev) =>
        prev.map((p) => (p.id === person.id ? updated : p))
      );
      setSelectedFacePerson(updated);
      setQueryingFaceId(null);
      onNotify(
        updated.faceEnrolled
          ? `已获取「${updated.name}」人脸信息（${updated.faceId}）`
          : `「${updated.name}」尚未录入人脸`
      );
    }, 240);
  };

  const handleRefreshInfo = () => {
    setIsRefreshingInfo(true);
    window.setTimeout(() => {
      setDeviceInfo((prev) => ({
        ...prev,
        attendanceCount: prev.attendanceCount + 1,
      }));
      setIsRefreshingInfo(false);
      onNotify('GZDLS7 设备信息已更新');
    }, 260);
  };

  const handleFetchAttendance = (customStart?: string, customEnd?: string) => {
    const sStr = (customStart ?? startTime).replace('T', ' ');
    const eStr = (customEnd ?? endTime).replace('T', ' ');
    if (!sStr || !eStr) {
      onNotify('请选择完整时间范围');
      return;
    }
    setIsFetchingAttendance(true);
    window.setTimeout(() => {
      const matched = INITIAL_GZDLS7_ATTENDANCE.filter((rec) => {
        const t = rec.checkInTime.slice(0, 16);
        return t >= sStr.slice(0, 16) && t <= eStr.slice(0, 16);
      });
      setAttendanceRecords(matched);
      setHasQueriedAttendance(true);
      setIsFetchingAttendance(false);
      onNotify(`已获取 ${matched.length} 条打卡记录`);
    }, 240);
  };

  const applyAttendancePreset = (days: number) => {
    const end = '2026-11-13T23:59';
    const startDate = new Date('2026-11-13T00:00:00');
    startDate.setDate(startDate.getDate() - (days - 1));
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${startDate.getFullYear()}-${pad(
      startDate.getMonth() + 1
    )}-${pad(startDate.getDate())}T00:00`;
    setStartTime(start);
    setEndTime(end);
    handleFetchAttendance(start, end);
  };

  const applyTextPreset = (presetKey: QuickCoordinateKey) => {
    const found = QUICK_COORDINATE_PRESETS.find((p) => p.key === presetKey);
    if (!found) return;
    setTextCoordPreset(presetKey);
    setTextX(found.x);
    setTextY(found.y);
  };

  const applyImagePreset = (presetKey: QuickCoordinateKey) => {
    const found = QUICK_COORDINATE_PRESETS.find((p) => p.key === presetKey);
    if (!found) return;
    setImageCoordPreset(presetKey);
    setImageX(found.x);
    setImageY(found.y);
  };

  const handleSendDisplayText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayText.trim()) {
      onNotify('请输入显示文字内容');
      return;
    }
    const durationText =
      textPersistMode === 'always'
        ? '一直显示'
        : `${Math.max(1, textDurationSec)}秒后消失`;
    onNotify(
      `文字指令已发送：(${textX},${textY}) · ${textFontSize}px · ${durationText}`
    );
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImageUrl(reader.result);
        setSelectedImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendDisplayImage = () => {
    const durationText =
      imagePersistMode === 'always'
        ? '一直显示'
        : `${Math.max(1, imageDurationSec)}秒后消失`;
    onNotify(
      `图片指令已发送「${selectedImageName}」：(${imageX},${imageY}) · ${durationText}`
    );
  };

  const handleAudioFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAudioUploadError(null);
    if (!file) {
      setPendingAudioFile(null);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext !== 'mps') {
      setPendingAudioFile(null);
      setAudioUploadError('格式错误：仅支持 .mps 格式音频文件');
      if (audioInputRef.current) audioInputRef.current.value = '';
      return;
    }
    setPendingAudioFile(file);
    if (!pendingAudioName.trim()) {
      setPendingAudioName(file.name.replace(/\.mps$/i, ''));
    }
  };

  const handleConfirmAudioUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = pendingAudioName.trim();

    if (audioUploadMode === 'file') {
      if (!pendingAudioFile) {
        setAudioUploadError('请先选择 .mps 音频文件');
        return;
      }
      if (!cleanName) {
        setAudioUploadError('请输入音频命名');
        return;
      }
      const sanitizedFileName = `${cleanName.replace(/\s+/g, '_')}.mps`;
      const newAudio: Gzdls7AudioFile = {
        id: `aud-${Date.now()}`,
        name: cleanName,
        fileName: sanitizedFileName,
        sizeText: `${Math.max(1, Math.round(pendingAudioFile.size / 1024))} KB`,
        durationSec: 4,
        uploadedAt: '2026-11-13 23:48:00',
      };
      setAudioFiles((prev) => [newAudio, ...prev]);
      setSelectedPlayFileName(newAudio.fileName);
      setPendingAudioFile(null);
      setPendingAudioName('');
      setAudioUploadError(null);
      if (audioInputRef.current) audioInputRef.current.value = '';
      onNotify(`音频「${cleanName}」已上传至设备`);
      return;
    }

    const rawUrl = pendingAudioUrl.trim();
    if (!rawUrl) {
      setAudioUploadError('请输入音频播放链接');
      return;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setAudioUploadError('链接需以 http:// 或 https:// 开头');
        return;
      }
    } catch {
      setAudioUploadError('请输入有效的播放链接');
      return;
    }
    const pathLower = parsedUrl.pathname.toLowerCase();
    const hasExt = /\.[a-z0-9]+$/i.test(pathLower);
    if (hasExt && !pathLower.endsWith('.mps')) {
      setAudioUploadError('播放链接仅支持 .mps 格式音频');
      return;
    }
    if (!cleanName) {
      setAudioUploadError('请输入音频命名');
      return;
    }
    const sanitizedFileName = `${cleanName.replace(/\s+/g, '_')}.mps`;
    const newAudio: Gzdls7AudioFile = {
      id: `aud-${Date.now()}`,
      name: cleanName,
      fileName: sanitizedFileName,
      sizeText: '在线链接',
      durationSec: 4,
      uploadedAt: '2026-11-13 23:48:00',
    };
    setAudioFiles((prev) => [newAudio, ...prev]);
    setSelectedPlayFileName(newAudio.fileName);
    setPendingAudioUrl('');
    setPendingAudioName('');
    setAudioUploadError(null);
    onNotify(`已通过播放链接添加音频「${cleanName}」`);
  };

  const handlePlayAudioByFileName = () => {
    if (!selectedPlayFileName) {
      onNotify('请选择音频文件');
      return;
    }
    setIsPlayingAudio(true);
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(Math.max(0.01, (playVolume / 100) * 0.2), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // ignore audio context block
    }
    onNotify(`按文件名播放「${selectedPlayFileName}」，音量 ${playVolume}%`);
    window.setTimeout(() => setIsPlayingAudio(false), 900);
  };

  return (
    <div className="flex flex-col">
      {/* Flush Single-Page Feature Switcher (No horizontal sliding) */}
      <div className="bg-white border-b border-slate-200 grid grid-cols-3">
        {FEATURE_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 text-[12.5px] border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#4B996E] text-[#2F7551] font-semibold bg-emerald-50/30'
                  : 'border-transparent text-slate-600 font-medium hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Feature Body */}
      <div className="p-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        {/* 1. 人员列表 */}
        {activeTab === 'personnel' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={personnelSearch}
                onChange={(e) => setPersonnelSearch(e.target.value)}
                placeholder="输入姓名搜索人员"
                className="w-full h-9 pl-9 pr-8 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4B996E]"
              />
              {personnelSearch && (
                <button
                  type="button"
                  onClick={() => setPersonnelSearch('')}
                  aria-label="清空搜索"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedFacePerson && (
              <div className="p-3 border border-emerald-200 bg-emerald-50/50 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {selectedFacePerson.name}
                    <span className="ml-1.5 font-mono-tabular text-[11.5px] font-normal text-slate-500">
                      {selectedFacePerson.employeeNo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFacePerson(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[12px] text-slate-600 font-mono-tabular">
                  {selectedFacePerson.faceEnrolled
                    ? `已录入人脸 · ${selectedFacePerson.faceId} · 质量 ${selectedFacePerson.faceQuality}%`
                    : '未录入人脸特征'}
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {filteredPersonnel.length === 0 ? (
                <div className="py-8 text-center text-[12.5px] text-slate-500">
                  未搜索到「{personnelSearch}」
                </div>
              ) : (
                filteredPersonnel.map((person) => {
                  const isQuerying = queryingFaceId === person.id;
                  return (
                    <div
                      key={person.id}
                      className="px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-medium text-slate-900">
                            {person.name}
                          </span>
                          <span className="text-[11.5px] font-mono-tabular text-slate-500">
                            {person.employeeNo}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-slate-500 mt-0.5">
                          {!person.faceQueried
                            ? '人脸信息未查询'
                            : person.faceEnrolled
                            ? `已录入 · ${person.faceId}`
                            : '未录入人脸'}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isQuerying}
                        onClick={() => handleQuerySingleFace(person)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-[11.5px] font-medium text-[#2F7551] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {isQuerying ? '查询中' : '查询人脸信息'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. 设备信息 */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-900">
                设备硬件与容量信息
              </span>
              <button
                type="button"
                onClick={handleRefreshInfo}
                disabled={isRefreshingInfo}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2F7551] cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshingInfo ? 'animate-spin' : ''
                  }`}
                />
                刷新
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="text-[11.5px] text-slate-500">设备型号</div>
                <div className="mt-1 text-[14px] font-semibold font-mono-tabular text-slate-900">
                  {deviceInfo.model}
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="text-[11.5px] text-slate-500">固件版本</div>
                <div className="mt-1 text-[13px] font-semibold font-mono-tabular text-slate-900 truncate">
                  {deviceInfo.firmwareVersion}
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="text-[11.5px] text-slate-500">设备 IP</div>
                <div className="mt-1 text-[13.5px] font-semibold font-mono-tabular text-slate-900">
                  {deviceInfo.deviceIp}
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="text-[11.5px] text-slate-500">设备用户数量</div>
                <div className="mt-1 text-[15px] font-semibold font-mono-tabular text-slate-900">
                  {deviceInfo.userCount} 人
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="text-[11.5px] text-slate-500">考勤记录数</div>
                <div className="mt-1 text-[15px] font-semibold font-mono-tabular text-slate-900">
                  {deviceInfo.attendanceCount.toLocaleString()} 条
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="text-[11.5px] text-slate-500">设备人脸数</div>
                <div className="mt-1 text-[15px] font-semibold font-mono-tabular text-slate-900">
                  {deviceInfo.faceCount} 张
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. 打卡记录 */}
        {activeTab === 'attendance' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => applyAttendancePreset(1)}
                className="h-8 text-[12px] font-medium bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                今天
              </button>
              <button
                type="button"
                onClick={() => applyAttendancePreset(3)}
                className="h-8 text-[12px] font-medium bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                近 3 天
              </button>
              <button
                type="button"
                onClick={() => applyAttendancePreset(7)}
                className="h-8 text-[12px] font-medium bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                近 7 天
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11.5px] text-slate-500 mb-1">
                  开始时间
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-9 px-2.5 text-[12.5px] font-mono-tabular border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[11.5px] text-slate-500 mb-1">
                  结束时间
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-9 px-2.5 text-[12.5px] font-mono-tabular border border-slate-200 rounded-md"
                />
              </div>
              <button
                type="button"
                disabled={isFetchingAttendance}
                onClick={() => handleFetchAttendance()}
                className="w-full h-9 text-[13px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
              >
                {isFetchingAttendance ? '正在获取...' : '获取打卡记录'}
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {!hasQueriedAttendance ? (
                <div className="py-8 text-center text-[12.5px] text-slate-500">
                  选择时间范围后点击「获取打卡记录」
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="py-8 text-center text-[12.5px] text-slate-500">
                  该时间段内暂无打卡记录
                </div>
              ) : (
                attendanceRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="px-3 py-2.5 flex items-center justify-between gap-2 text-[12.5px]"
                  >
                    <div>
                      <span className="font-medium text-slate-900">
                        {rec.name}
                      </span>
                      <span className="ml-2 font-mono-tabular text-[11.5px] text-slate-500">
                        {rec.employeeNo}
                      </span>
                    </div>
                    <span className="font-mono-tabular text-[11.5px] text-slate-600">
                      {rec.checkInTime}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. 下方显示文字 */}
        {activeTab === 'text' && (
          <form onSubmit={handleSendDisplayText} className="space-y-3.5">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">
                显示文字内容
              </label>
              <input
                type="text"
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
                placeholder="请输入设备下方显示文字"
                className="w-full h-9 px-3 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-[#4B996E]"
              />
            </div>

            <div>
              <span className="block text-[12px] font-medium text-slate-700 mb-1.5">
                快速坐标（{GZDLS7_SCREEN_WIDTH}×{GZDLS7_SCREEN_HEIGHT}）
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_COORDINATE_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyTextPreset(preset.key)}
                    className={`h-8 text-[12px] font-medium border rounded-md cursor-pointer ${
                      textCoordPreset === preset.key
                        ? 'bg-[#4B996E] text-white border-[#4B996E]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-slate-500">X</span>
                  <input
                    type="number"
                    min={0}
                    max={GZDLS7_SCREEN_WIDTH}
                    value={textX}
                    onChange={(e) => {
                      setTextCoordPreset('custom');
                      setTextX(Number(e.target.value) || 0);
                    }}
                    className="w-full h-8 px-2 text-[12.5px] font-mono-tabular border border-slate-200 rounded"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-slate-500">Y</span>
                  <input
                    type="number"
                    min={0}
                    max={GZDLS7_SCREEN_HEIGHT}
                    value={textY}
                    onChange={(e) => {
                      setTextCoordPreset('custom');
                      setTextY(Number(e.target.value) || 0);
                    }}
                    className="w-full h-8 px-2 text-[12.5px] font-mono-tabular border border-slate-200 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[12px] font-medium text-slate-700 mb-1">
                  字体颜色
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 p-0.5 border border-slate-200 rounded cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1">
                    {TEXT_COLOR_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setTextColor(hex)}
                        className={`w-4 h-4 rounded border cursor-pointer ${
                          textColor.toUpperCase() === hex
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
                <span className="block text-[12px] font-medium text-slate-700 mb-1">
                  字体大小 ({textFontSize}px)
                </span>
                <input
                  type="number"
                  min={12}
                  max={96}
                  value={textFontSize}
                  onChange={(e) =>
                    setTextFontSize(Math.max(12, Number(e.target.value) || 12))
                  }
                  className="w-full h-8 px-2.5 text-[13px] font-mono-tabular border border-slate-200 rounded"
                />
              </div>
            </div>

            <div>
              <span className="block text-[12px] font-medium text-slate-700 mb-1.5">
                文字消失时间
              </span>
              <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mp-text-persist"
                    checked={textPersistMode === 'always'}
                    onChange={() => setTextPersistMode('always')}
                    className="accent-[#4B996E]"
                  />
                  <span>一直显示</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mp-text-persist"
                    checked={textPersistMode === 'seconds'}
                    onChange={() => setTextPersistMode('seconds')}
                    className="accent-[#4B996E]"
                  />
                  <span>指定秒数消失</span>
                </label>
                {textPersistMode === 'seconds' && (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={textDurationSec}
                      onChange={(e) =>
                        setTextDurationSec(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-14 h-7 px-1.5 text-center font-mono-tabular border border-slate-200 rounded"
                    />
                    <span className="text-slate-500">秒</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              发送显示文字指令
            </button>
          </form>
        )}

        {/* 5. 下方显示图片 */}
        {activeTab === 'image' && (
          <div className="space-y-3.5">
            <div>
              <span className="block text-[12px] font-medium text-slate-700 mb-1.5">
                选择或上传图片
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {BUILTIN_DISPLAY_IMAGES.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setSelectedImageUrl(img.svgDataUrl);
                      setSelectedImageName(img.name);
                    }}
                    className={`h-8 px-1.5 text-[11.5px] font-medium border rounded-md truncate cursor-pointer ${
                      selectedImageName === img.name
                        ? 'border-[#4B996E] bg-emerald-50 text-[#2F7551]'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {img.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1 h-8 px-1.5 text-[11.5px] font-medium border border-dashed border-slate-400 rounded-md text-slate-700 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  上传图片
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>
              <div className="mt-2 p-2 border border-slate-200 rounded-lg bg-slate-900 flex items-center justify-center">
                <img
                  src={selectedImageUrl}
                  alt={selectedImageName}
                  referrerPolicy="no-referrer"
                  className="h-16 object-contain rounded"
                />
              </div>
            </div>

            <div>
              <span className="block text-[12px] font-medium text-slate-700 mb-1.5">
                快速坐标
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_COORDINATE_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyImagePreset(preset.key)}
                    className={`h-8 text-[12px] font-medium border rounded-md cursor-pointer ${
                      imageCoordPreset === preset.key
                        ? 'bg-[#4B996E] text-white border-[#4B996E]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-slate-500">X</span>
                  <input
                    type="number"
                    min={0}
                    max={GZDLS7_SCREEN_WIDTH}
                    value={imageX}
                    onChange={(e) => {
                      setImageCoordPreset('custom');
                      setImageX(Number(e.target.value) || 0);
                    }}
                    className="w-full h-8 px-2 text-[12.5px] font-mono-tabular border border-slate-200 rounded"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-slate-500">Y</span>
                  <input
                    type="number"
                    min={0}
                    max={GZDLS7_SCREEN_HEIGHT}
                    value={imageY}
                    onChange={(e) => {
                      setImageCoordPreset('custom');
                      setImageY(Number(e.target.value) || 0);
                    }}
                    className="w-full h-8 px-2 text-[12.5px] font-mono-tabular border border-slate-200 rounded"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="block text-[12px] font-medium text-slate-700 mb-1.5">
                图片消失时间
              </span>
              <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mp-img-persist"
                    checked={imagePersistMode === 'always'}
                    onChange={() => setImagePersistMode('always')}
                    className="accent-[#4B996E]"
                  />
                  <span>一直显示</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mp-img-persist"
                    checked={imagePersistMode === 'seconds'}
                    onChange={() => setImagePersistMode('seconds')}
                    className="accent-[#4B996E]"
                  />
                  <span>指定秒数消失</span>
                </label>
                {imagePersistMode === 'seconds' && (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={imageDurationSec}
                      onChange={(e) =>
                        setImageDurationSec(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-14 h-7 px-1.5 text-center font-mono-tabular border border-slate-200 rounded"
                    />
                    <span className="text-slate-500">秒</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendDisplayImage}
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              发送显示图片指令
            </button>
          </div>
        )}

        {/* 6. 设置音频文件 */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <form
              onSubmit={handleConfirmAudioUpload}
              className="p-3 border border-slate-200 rounded-lg bg-slate-50/70 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-slate-900">
                  上传音频（仅 .mps）
                </span>
                <div className="inline-flex p-0.5 bg-slate-200/80 rounded-md">
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUploadMode('file');
                      setAudioUploadError(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11.5px] font-medium rounded cursor-pointer ${
                      audioUploadMode === 'file'
                        ? 'bg-white text-slate-900'
                        : 'text-slate-600'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    本地文件
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUploadMode('url');
                      setAudioUploadError(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11.5px] font-medium rounded cursor-pointer ${
                      audioUploadMode === 'url'
                        ? 'bg-white text-slate-900'
                        : 'text-slate-600'
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    播放链接
                  </button>
                </div>
              </div>

              {audioUploadMode === 'file' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="h-8 px-2.5 text-[12px] font-medium bg-white border border-slate-300 rounded cursor-pointer shrink-0"
                  >
                    选择 .mps
                  </button>
                  <span className="text-[11.5px] font-mono-tabular text-slate-600 truncate">
                    {pendingAudioFile ? pendingAudioFile.name : '未选择文件'}
                  </span>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept=".mps"
                    onChange={handleAudioFilePick}
                    className="hidden"
                  />
                </div>
              ) : (
                <input
                  type="url"
                  value={pendingAudioUrl}
                  onChange={(e) => {
                    setPendingAudioUrl(e.target.value);
                    setAudioUploadError(null);
                  }}
                  placeholder="https://example.com/audio.mps"
                  className="w-full h-8 px-2.5 text-[12.5px] font-mono-tabular bg-white border border-slate-300 rounded"
                />
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pendingAudioName}
                  onChange={(e) => {
                    setPendingAudioName(e.target.value);
                    setAudioUploadError(null);
                  }}
                  placeholder="输入音频命名（必填）"
                  className="flex-1 h-8 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded"
                />
                <button
                  type="submit"
                  className="h-8 px-3 text-[12px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded shrink-0 cursor-pointer"
                >
                  确认上传
                </button>
              </div>

              {audioUploadError && (
                <div className="text-[11.5px] font-medium text-rose-600">
                  {audioUploadError}
                </div>
              )}
            </form>

            <div className="p-3 border border-slate-200 rounded-lg space-y-2.5">
              <div className="text-[12.5px] font-semibold text-slate-900">
                按文件名播放
              </div>

              <select
                value={selectedPlayFileName}
                onChange={(e) => setSelectedPlayFileName(e.target.value)}
                className="w-full h-9 px-2.5 text-[12.5px] font-mono-tabular bg-white border border-slate-300 rounded-md"
              >
                {audioFiles.map((af) => (
                  <option key={af.id} value={af.fileName}>
                    {af.fileName}（{af.name}）
                  </option>
                ))}
              </select>

              <div>
                <div className="flex items-center justify-between text-[12px] text-slate-600 mb-1">
                  <span>播放音量</span>
                  <span className="font-mono-tabular font-medium">
                    {playVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={playVolume}
                  onChange={(e) => setPlayVolume(Number(e.target.value))}
                  className="w-full accent-[#4B996E]"
                />
              </div>

              <button
                type="button"
                onClick={handlePlayAudioByFileName}
                className="w-full h-9 inline-flex items-center justify-center gap-1 text-[12.5px] font-medium text-white bg-[#4B996E] hover:bg-[#3B825B] rounded-lg cursor-pointer"
              >
                {isPlayingAudio ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {isPlayingAudio ? '已发送' : '立即播放'}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
