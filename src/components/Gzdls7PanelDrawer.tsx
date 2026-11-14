import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Cpu,
  DoorOpen,
  Download,
  Image as ImageIcon,
  Info,
  Link2,
  Play,
  RefreshCw,
  Search,
  Send,
  Type,
  Upload,
  UserCheck,
  Users,
  Volume2,
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

interface Gzdls7PanelDrawerProps {
  device: DeviceRecord | null;
  initialTab: Gzdls7PanelTab;
  onClose: () => void;
  onSendOpenDoor: (device: DeviceRecord) => void;
  onNotify: (message: string) => void;
}

const TAB_ITEMS: { key: Gzdls7PanelTab; label: string; icon: React.ReactNode }[] = [
  { key: 'personnel', label: '设备人员列表', icon: <Users className="w-3.5 h-3.5" /> },
  { key: 'info', label: '设备信息', icon: <Cpu className="w-3.5 h-3.5" /> },
  { key: 'attendance', label: '打卡记录', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'text', label: '下方显示文字', icon: <Type className="w-3.5 h-3.5" /> },
  { key: 'image', label: '下方显示图片', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { key: 'audio', label: '设置音频文件', icon: <Volume2 className="w-3.5 h-3.5" /> },
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

export const Gzdls7PanelDrawer: React.FC<Gzdls7PanelDrawerProps> = ({
  device,
  initialTab,
  onClose,
  onSendOpenDoor,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<Gzdls7PanelTab>(initialTab);

  // 1. Personnel state
  const [personnelList, setPersonnelList] = useState<Gzdls7Personnel[]>(
    INITIAL_GZDLS7_PERSONNEL
  );
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [queryingFaceId, setQueryingFaceId] = useState<string | null>(null);
  const [selectedFacePerson, setSelectedFacePerson] =
    useState<Gzdls7Personnel | null>(null);

  // 2. Device info state
  const [deviceInfo, setDeviceInfo] = useState<Gzdls7DeviceInfo>(() =>
    createInitialGzdls7Info(device?.id ?? 'dev-1')
  );
  const [isRefreshingInfo, setIsRefreshingInfo] = useState(false);

  // 3. Attendance state
  const [startTime, setStartTime] = useState('2026-11-12T00:00');
  const [endTime, setEndTime] = useState('2026-11-13T23:59');
  const [attendanceRecords, setAttendanceRecords] = useState<
    Gzdls7AttendanceRecord[]
  >([]);
  const [hasQueriedAttendance, setHasQueriedAttendance] = useState(false);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // 4. Display text state
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

  // 5. Display image state
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

  // 6. Audio file state
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

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, device?.id]);

  useEffect(() => {
    if (!device) return;
    setDeviceInfo(createInitialGzdls7Info(device.id));
    setPersonnelList(INITIAL_GZDLS7_PERSONNEL);
    setSelectedFacePerson(null);
    setHasQueriedAttendance(false);
    setAttendanceRecords([]);
  }, [device?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && device) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [device, onClose]);

  const filteredPersonnel = useMemo(() => {
    const keyword = personnelSearch.trim().toLowerCase();
    if (!keyword) return personnelList;
    return personnelList.filter((p) => p.name.toLowerCase().includes(keyword));
  }, [personnelList, personnelSearch]);

  if (!device) return null;

  // Personnel: query single person face info
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
          : `「${updated.name}」尚未在设备中录入人脸`
      );
    }, 280);
  };

  // Device info refresh
  const handleRefreshInfo = () => {
    setIsRefreshingInfo(true);
    window.setTimeout(() => {
      setDeviceInfo((prev) => ({
        ...prev,
        attendanceCount: prev.attendanceCount + 1,
      }));
      setIsRefreshingInfo(false);
      onNotify('GZDLS7 设备信息已刷新');
    }, 300);
  };

  // Fetch attendance records within time range
  const handleFetchAttendance = (customStart?: string, customEnd?: string) => {
    const sStr = (customStart ?? startTime).replace('T', ' ');
    const eStr = (customEnd ?? endTime).replace('T', ' ');
    if (!sStr || !eStr) {
      onNotify('请先选择完整的开始和结束时间范围');
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
      onNotify(`已获取时间段内 ${matched.length} 条打卡记录`);
    }, 260);
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

  // Coordinate presets
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

  // Send display text
  const handleSendDisplayText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayText.trim()) {
      onNotify('请输入要显示在设备下方的文字内容');
      return;
    }
    const durationText =
      textPersistMode === 'always'
        ? '一直显示'
        : `${Math.max(1, textDurationSec)} 秒后消失`;
    onNotify(
      `已下发显示文字指令：坐标(${textX}, ${textY})，字号 ${textFontSize}px，${durationText}`
    );
  };

  // Handle local image upload for display image
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
        : `${Math.max(1, imageDurationSec)} 秒后消失`;
    onNotify(
      `已下发显示图片指令「${selectedImageName}」：坐标(${imageX}, ${imageY})，${durationText}`
    );
  };

  // Audio upload validation (.mps only)
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
      setAudioUploadError('格式不支持：仅支持上传 .mps 格式音频文件');
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
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
        setAudioUploadError('请先选择一个 .mps 格式的音频文件');
        return;
      }
      if (!cleanName) {
        setAudioUploadError('请为上传的音频文件命名');
        return;
      }
      const sanitizedFileName = `${cleanName.replace(/\s+/g, '_')}.mps`;
      const newAudio: Gzdls7AudioFile = {
        id: `aud-${Date.now()}`,
        name: cleanName,
        fileName: sanitizedFileName,
        sizeText: `${Math.max(1, Math.round(pendingAudioFile.size / 1024))} KB`,
        durationSec: 4,
        uploadedAt: '2026-11-13 23:23:00',
      };
      setAudioFiles((prev) => [newAudio, ...prev]);
      setSelectedPlayFileName(newAudio.fileName);
      setPendingAudioFile(null);
      setPendingAudioName('');
      setAudioUploadError(null);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
      onNotify(`音频「${cleanName}」(${sanitizedFileName}) 已上传至设备`);
      return;
    }

    // URL playback link mode
    const rawUrl = pendingAudioUrl.trim();
    if (!rawUrl) {
      setAudioUploadError('请输入音频播放链接');
      return;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setAudioUploadError('播放链接需以 http:// 或 https:// 开头');
        return;
      }
    } catch {
      setAudioUploadError('请输入有效的播放链接地址');
      return;
    }

    const pathLower = parsedUrl.pathname.toLowerCase();
    const hasExt = /\.[a-z0-9]+$/i.test(pathLower);
    if (hasExt && !pathLower.endsWith('.mps')) {
      setAudioUploadError('格式不支持：播放链接仅支持 .mps 格式音频');
      return;
    }

    if (!cleanName) {
      setAudioUploadError('请为上传的音频链接命名');
      return;
    }

    const sanitizedFileName = `${cleanName.replace(/\s+/g, '_')}.mps`;
    const newAudio: Gzdls7AudioFile = {
      id: `aud-${Date.now()}`,
      name: cleanName,
      fileName: sanitizedFileName,
      sizeText: '在线链接',
      durationSec: 4,
      uploadedAt: '2026-11-13 23:23:00',
    };
    setAudioFiles((prev) => [newAudio, ...prev]);
    setSelectedPlayFileName(newAudio.fileName);
    setPendingAudioUrl('');
    setPendingAudioName('');
    setAudioUploadError(null);
    onNotify(`已通过播放链接上传音频「${cleanName}」(${sanitizedFileName})`);
  };

  // Download audio to local machine
  const handleDownloadAudio = (audio: Gzdls7AudioFile) => {
    const content = `GZDLS7-MPS-AUDIO:${audio.fileName}|NAME:${audio.name}`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = audio.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify(`正在下载音频文件到本地：${audio.fileName}`);
  };

  // Play audio by filename with volume
  const handlePlayAudioByFileName = () => {
    if (!selectedPlayFileName) {
      onNotify('请先选择要播放的音频文件');
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
      // Ignore Web Audio restriction in headless browsers
    }
    onNotify(
      `已按文件名播放「${selectedPlayFileName}」，播放音量：${playVolume}%`
    );
    window.setTimeout(() => setIsPlayingAudio(false), 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gzdls7-drawer-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/35 transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[780px] bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2
                id="gzdls7-drawer-title"
                className="text-[16px] font-semibold text-slate-900 truncate"
              >
                {device.deviceName} · GZDLS7 设备测试控制台
              </h2>
              <span
                className={`text-[12px] font-medium whitespace-nowrap ${
                  device.status === '在线' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                · {device.status}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-slate-500">
              <span className="font-mono-tabular">SN: {device.gatewaySn}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">Mac: {device.macAddress}</span>
              <span aria-hidden="true">·</span>
              <span>包厢 {device.boundRoom}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onSendOpenDoor(device)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[12.5px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              立即开门
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭GZDLS7控制台"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Non-scrolling grid) */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50/70 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[12px] font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* TAB 1: 设备人员列表 */}
          {activeTab === 'personnel' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={personnelSearch}
                    onChange={(e) => setPersonnelSearch(e.target.value)}
                    placeholder="按人员姓名搜索"
                    className="w-full h-9 pl-9 pr-8 text-[13px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                  {personnelSearch && (
                    <button
                      type="button"
                      onClick={() => setPersonnelSearch('')}
                      aria-label="清空姓名搜索"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[12px] font-mono-tabular text-slate-500">
                  共 {filteredPersonnel.length} 位人员 · 单次查询单个人员人脸信息
                </span>
              </div>

              {/* Single-person face query result card */}
              {selectedFacePerson && (
                <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-lg border border-blue-200 bg-white flex items-center justify-center shrink-0">
                      {selectedFacePerson.faceEnrolled ? (
                        <svg
                          viewBox="0 0 40 40"
                          className="w-8 h-8 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M8 14V9h5M27 9h5v5M32 26v5h-5M13 31H8v-5" />
                          <circle cx="20" cy="17" r="4.5" />
                          <path d="M12.5 29c1.5-3.5 4.2-5 7.5-5s6 1.5 7.5 5" />
                        </svg>
                      ) : (
                        <UserCheck className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-900">
                        <span>{selectedFacePerson.name}</span>
                        <span className="font-mono-tabular text-[12px] font-normal text-slate-500">
                          {selectedFacePerson.employeeNo}
                        </span>
                        <span
                          className={`text-[12px] font-medium ${
                            selectedFacePerson.faceEnrolled
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          ·{' '}
                          {selectedFacePerson.faceEnrolled
                            ? '已录入人脸'
                            : '未录入人脸'}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-600 font-mono-tabular">
                        {selectedFacePerson.faceEnrolled
                          ? `人脸ID: ${selectedFacePerson.faceId} · 录入时间: ${selectedFacePerson.faceEnrolledAt} · 识别质量: ${selectedFacePerson.faceQuality}%`
                          : '该人员暂未采集人脸特征，请引导至 GZDLS7 终端前完成人脸录入'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFacePerson(null)}
                    aria-label="关闭人脸查询详情"
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-600">
                      <th className="py-2.5 px-4">姓名</th>
                      <th className="py-2.5 px-4">工号</th>
                      <th className="py-2.5 px-4">人脸录入信息</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {filteredPersonnel.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-slate-500 text-[13px]"
                        >
                          未搜索到姓名包含「{personnelSearch}」的人员
                        </td>
                      </tr>
                    ) : (
                      filteredPersonnel.map((person) => {
                        const isQuerying = queryingFaceId === person.id;
                        return (
                          <tr
                            key={person.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-2.5 px-4 font-medium text-slate-900">
                              {person.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono-tabular text-slate-600">
                              {person.employeeNo}
                            </td>
                            <td className="py-2.5 px-4 text-[12.5px]">
                              {!person.faceQueried ? (
                                <span className="text-slate-400">
                                  未查询（点击右侧单个查询）
                                </span>
                              ) : person.faceEnrolled ? (
                                <span className="text-emerald-700 font-medium font-mono-tabular">
                                  已录入 · {person.faceId}
                                </span>
                              ) : (
                                <span className="text-amber-700 font-medium">
                                  未录入人脸
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                disabled={isQuerying}
                                onClick={() => handleQuerySingleFace(person)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                {isQuerying ? '查询中...' : '查询人脸信息'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: 设备信息 */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>实时读取 GZDLS7 终端硬件与容量参数</span>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshInfo}
                  disabled={isRefreshingInfo}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isRefreshingInfo ? 'animate-spin' : ''
                    }`}
                  />
                  {isRefreshingInfo ? '读取中...' : '刷新设备信息'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="text-[12px] text-slate-500">设备型号</div>
                  <div className="mt-1.5 text-[18px] font-semibold font-mono-tabular text-slate-900">
                    {deviceInfo.model}
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="text-[12px] text-slate-500">固件版本</div>
                  <div className="mt-1.5 text-[16px] font-semibold font-mono-tabular text-slate-900">
                    {deviceInfo.firmwareVersion}
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="text-[12px] text-slate-500">设备 IP</div>
                  <div className="mt-1.5 text-[16px] font-semibold font-mono-tabular text-slate-900">
                    {deviceInfo.deviceIp}
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="text-[12px] text-slate-500">设备用户数量</div>
                  <div className="mt-1.5 text-[20px] font-semibold font-mono-tabular text-slate-900">
                    {deviceInfo.userCount}
                    <span className="ml-1 text-[12px] font-normal text-slate-500">
                      人
                    </span>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="text-[12px] text-slate-500">考勤记录数</div>
                  <div className="mt-1.5 text-[20px] font-semibold font-mono-tabular text-slate-900">
                    {deviceInfo.attendanceCount.toLocaleString()}
                    <span className="ml-1 text-[12px] font-normal text-slate-500">
                      条
                    </span>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="text-[12px] text-slate-500">设备人脸数</div>
                  <div className="mt-1.5 text-[20px] font-semibold font-mono-tabular text-slate-900">
                    {deviceInfo.faceCount}
                    <span className="ml-1 text-[12px] font-normal text-slate-500">
                      张
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 获取某一时间段内的打卡记录 */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-slate-700">
                    选择查询时间范围
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyAttendancePreset(1)}
                      className="h-7 px-2.5 text-[12px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      今天
                    </button>
                    <button
                      type="button"
                      onClick={() => applyAttendancePreset(3)}
                      className="h-7 px-2.5 text-[12px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      近 3 天
                    </button>
                    <button
                      type="button"
                      onClick={() => applyAttendancePreset(7)}
                      className="h-7 px-2.5 text-[12px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      近 7 天
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <label
                      htmlFor="att-start"
                      className="block text-[12px] text-slate-500 mb-1"
                    >
                      开始时间
                    </label>
                    <input
                      id="att-start"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-9 px-3 text-[13px] font-mono-tabular bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="att-end"
                      className="block text-[12px] text-slate-500 mb-1"
                    >
                      结束时间
                    </label>
                    <input
                      id="att-end"
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full h-9 px-3 text-[13px] font-mono-tabular bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isFetchingAttendance}
                    onClick={() => handleFetchAttendance()}
                    className="h-9 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isFetchingAttendance ? '获取中...' : '获取打卡记录'}
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-600">
                      <th className="py-2.5 px-4 w-[64px] text-center">序号</th>
                      <th className="py-2.5 px-4">姓名</th>
                      <th className="py-2.5 px-4">工号</th>
                      <th className="py-2.5 px-4">打卡时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {!hasQueriedAttendance ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-slate-500"
                        >
                          选择时间范围后点击「获取打卡记录」加载数据
                        </td>
                      </tr>
                    ) : attendanceRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-slate-500"
                        >
                          所选时间段内暂无打卡记录
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((rec, idx) => (
                        <tr key={rec.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 text-center font-mono-tabular text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {rec.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono-tabular text-slate-600">
                            {rec.employeeNo}
                          </td>
                          <td className="py-2.5 px-4 font-mono-tabular text-slate-700">
                            {rec.checkInTime}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: 下方显示文字 */}
          {activeTab === 'text' && (
            <form
              onSubmit={handleSendDisplayText}
              className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5 items-start"
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="display-text-content"
                    className="block text-[13px] font-medium text-slate-700 mb-1.5"
                  >
                    显示文字内容
                  </label>
                  <input
                    id="display-text-content"
                    type="text"
                    value={displayText}
                    onChange={(e) => setDisplayText(e.target.value)}
                    placeholder="请输入要在设备屏幕下方显示的文字"
                    className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>

                {/* 显示坐标 + 快速坐标 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-slate-700">
                      确定显示坐标（屏幕 {GZDLS7_SCREEN_WIDTH}×{GZDLS7_SCREEN_HEIGHT}）
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COORDINATE_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => applyTextPreset(preset.key)}
                        className={`h-7 px-2.5 text-[12px] font-medium border rounded transition-colors cursor-pointer ${
                          textCoordPreset === preset.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="text-x"
                        className="text-[12px] text-slate-500 shrink-0"
                      >
                        X 坐标
                      </label>
                      <input
                        id="text-x"
                        type="number"
                        min={0}
                        max={GZDLS7_SCREEN_WIDTH}
                        value={textX}
                        onChange={(e) => {
                          setTextCoordPreset('custom');
                          setTextX(Number(e.target.value) || 0);
                        }}
                        className="w-full h-8 px-2.5 text-[13px] font-mono-tabular border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="text-y"
                        className="text-[12px] text-slate-500 shrink-0"
                      >
                        Y 坐标
                      </label>
                      <input
                        id="text-y"
                        type="number"
                        min={0}
                        max={GZDLS7_SCREEN_HEIGHT}
                        value={textY}
                        onChange={(e) => {
                          setTextCoordPreset('custom');
                          setTextY(Number(e.target.value) || 0);
                        }}
                        className="w-full h-8 px-2.5 text-[13px] font-mono-tabular border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 字体颜色 + 字体大小 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                      确定字体颜色
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="选择字体颜色"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-9 h-8 p-0.5 bg-white border border-slate-300 rounded cursor-pointer"
                      />
                      <span className="text-[12px] font-mono-tabular text-slate-600 uppercase">
                        {textColor}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {TEXT_COLOR_SWATCHES.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setTextColor(hex)}
                          aria-label={`预设颜色 ${hex}`}
                          className={`w-5 h-5 rounded border cursor-pointer ${
                            textColor.toUpperCase() === hex
                              ? 'ring-2 ring-blue-600 ring-offset-1 border-slate-400'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="text-font-size"
                      className="block text-[13px] font-medium text-slate-700 mb-1.5"
                    >
                      确定字体大小（px）
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        id="text-font-size"
                        type="range"
                        min={14}
                        max={64}
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(Number(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                      <input
                        type="number"
                        min={12}
                        max={96}
                        value={textFontSize}
                        onChange={(e) =>
                          setTextFontSize(Math.max(12, Number(e.target.value) || 12))
                        }
                        className="w-16 h-8 px-2 text-center font-mono-tabular text-[13px] border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* 文字消失时间 */}
                <div>
                  <span className="block text-[13px] font-medium text-slate-700 mb-2">
                    确定文字消失时间
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="text-persist"
                        checked={textPersistMode === 'always'}
                        onChange={() => setTextPersistMode('always')}
                        className="accent-blue-600"
                      />
                      <span>一直显示</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="text-persist"
                        checked={textPersistMode === 'seconds'}
                        onChange={() => setTextPersistMode('seconds')}
                        className="accent-blue-600"
                      />
                      <span>指定秒数后消失</span>
                    </label>
                    {textPersistMode === 'seconds' && (
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={3600}
                          value={textDurationSec}
                          onChange={(e) =>
                            setTextDurationSec(Math.max(1, Number(e.target.value) || 1))
                          }
                          className="w-16 h-8 px-2 text-center font-mono-tabular text-[13px] border border-slate-300 rounded-md"
                        />
                        <span className="text-[12.5px] text-slate-500">秒后消失</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    发送显示文字指令
                  </button>
                  <button
                    type="button"
                    onClick={() => onNotify('已发送清除屏幕文字指令')}
                    className="h-9 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
                  >
                    清除文字
                  </button>
                </div>
              </div>

              {/* Screen Position Preview */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="text-[11.5px] font-medium text-slate-500 mb-2 text-center">
                  屏幕坐标预览 (800×1280)
                </div>
                <div className="relative mx-auto w-[180px] h-[288px] bg-slate-900 rounded-md overflow-hidden border border-slate-700">
                  <div
                    className="absolute leading-tight max-w-[140px] break-words pointer-events-none"
                    style={{
                      left: `${(textX / GZDLS7_SCREEN_WIDTH) * 100}%`,
                      top: `${(textY / GZDLS7_SCREEN_HEIGHT) * 100}%`,
                      color: textColor,
                      fontSize: `${Math.max(9, Math.round(textFontSize * 0.34))}px`,
                      transform: 'translate(-15%, -25%)',
                    }}
                  >
                    {displayText || '预览文字'}
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 5: 下方显示图片 */}
          {activeTab === 'image' && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5 items-start">
              <div className="space-y-4">
                <div>
                  <span className="block text-[13px] font-medium text-slate-700 mb-2">
                    选择或上传显示图片
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {BUILTIN_DISPLAY_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(img.svgDataUrl);
                          setSelectedImageName(img.name);
                        }}
                        className={`h-8 px-3 text-[12px] font-medium border rounded-md transition-colors cursor-pointer ${
                          selectedImageName === img.name
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {img.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-slate-700 bg-white border border-dashed border-slate-400 hover:border-blue-600 hover:text-blue-600 rounded-md cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      上传本地图片
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="mt-1.5 text-[12px] text-slate-500">
                    当前已选：<span className="font-medium text-slate-800">{selectedImageName}</span>
                  </div>
                </div>

                {/* 显示坐标 + 快速坐标 */}
                <div className="space-y-2">
                  <span className="block text-[13px] font-medium text-slate-700">
                    确定显示坐标（快速坐标）
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COORDINATE_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => applyImagePreset(preset.key)}
                        className={`h-7 px-2.5 text-[12px] font-medium border rounded transition-colors cursor-pointer ${
                          imageCoordPreset === preset.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="img-x"
                        className="text-[12px] text-slate-500 shrink-0"
                      >
                        X 坐标
                      </label>
                      <input
                        id="img-x"
                        type="number"
                        min={0}
                        max={GZDLS7_SCREEN_WIDTH}
                        value={imageX}
                        onChange={(e) => {
                          setImageCoordPreset('custom');
                          setImageX(Number(e.target.value) || 0);
                        }}
                        className="w-full h-8 px-2.5 text-[13px] font-mono-tabular border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="img-y"
                        className="text-[12px] text-slate-500 shrink-0"
                      >
                        Y 坐标
                      </label>
                      <input
                        id="img-y"
                        type="number"
                        min={0}
                        max={GZDLS7_SCREEN_HEIGHT}
                        value={imageY}
                        onChange={(e) => {
                          setImageCoordPreset('custom');
                          setImageY(Number(e.target.value) || 0);
                        }}
                        className="w-full h-8 px-2.5 text-[13px] font-mono-tabular border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 图片消失时间 */}
                <div>
                  <span className="block text-[13px] font-medium text-slate-700 mb-2">
                    确定图片消失时间
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="img-persist"
                        checked={imagePersistMode === 'always'}
                        onChange={() => setImagePersistMode('always')}
                        className="accent-blue-600"
                      />
                      <span>一直显示</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="img-persist"
                        checked={imagePersistMode === 'seconds'}
                        onChange={() => setImagePersistMode('seconds')}
                        className="accent-blue-600"
                      />
                      <span>指定秒数后消失</span>
                    </label>
                    {imagePersistMode === 'seconds' && (
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={3600}
                          value={imageDurationSec}
                          onChange={(e) =>
                            setImageDurationSec(Math.max(1, Number(e.target.value) || 1))
                          }
                          className="w-16 h-8 px-2 text-center font-mono-tabular text-[13px] border border-slate-300 rounded-md"
                        />
                        <span className="text-[12.5px] text-slate-500">秒后消失</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSendDisplayImage}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    发送显示图片指令
                  </button>
                  <button
                    type="button"
                    onClick={() => onNotify('已发送清除屏幕图片指令')}
                    className="h-9 px-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
                  >
                    清除图片
                  </button>
                </div>
              </div>

              {/* Image Screen Preview */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="text-[11.5px] font-medium text-slate-500 mb-2 text-center">
                  图片位置预览 (800×1280)
                </div>
                <div className="relative mx-auto w-[180px] h-[288px] bg-slate-900 rounded-md overflow-hidden border border-slate-700">
                  <img
                    src={selectedImageUrl}
                    alt={selectedImageName}
                    referrerPolicy="no-referrer"
                    className="absolute w-[74px] h-[38px] object-contain rounded border border-white/20"
                    style={{
                      left: `${(imageX / GZDLS7_SCREEN_WIDTH) * 100}%`,
                      top: `${(imageY / GZDLS7_SCREEN_HEIGHT) * 100}%`,
                      transform: 'translate(-20%, -25%)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 设置音频文件 */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* Upload .mps audio via local file or playback URL */}
              <form
                onSubmit={handleConfirmAudioUpload}
                className="p-4 border border-slate-200 rounded-lg bg-slate-50/70 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[13.5px] font-semibold text-slate-900">
                      上传音频文件
                    </h3>
                    <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-md">
                      <button
                        type="button"
                        onClick={() => {
                          setAudioUploadMode('file');
                          setAudioUploadError(null);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded transition-colors cursor-pointer ${
                          audioUploadMode === 'file'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded transition-colors cursor-pointer ${
                          audioUploadMode === 'url'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Link2 className="w-3 h-3" />
                        播放链接
                      </button>
                    </div>
                  </div>
                  <span className="text-[12px] text-slate-500">
                    仅支持 <span className="font-mono-tabular font-medium text-slate-700">.mps</span> 格式
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  {audioUploadMode === 'file' ? (
                    <div>
                      <label className="block text-[12px] text-slate-500 mb-1">
                        选择音频文件（只支持 .mps）
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => audioInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          选择 .mps 文件
                        </button>
                        <span className="text-[12px] text-slate-600 font-mono-tabular truncate">
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
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="audio-play-url"
                        className="block text-[12px] text-slate-500 mb-1"
                      >
                        输入播放链接（只支持 .mps）
                      </label>
                      <input
                        id="audio-play-url"
                        type="url"
                        value={pendingAudioUrl}
                        onChange={(e) => {
                          setPendingAudioUrl(e.target.value);
                          setAudioUploadError(null);
                        }}
                        placeholder="https://example.com/audio.mps"
                        className="w-full h-9 px-3 text-[13px] font-mono-tabular placeholder:font-sans bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="audio-custom-name"
                      className="block text-[12px] text-slate-500 mb-1"
                    >
                      音频命名（上传必填）
                    </label>
                    <input
                      id="audio-custom-name"
                      type="text"
                      value={pendingAudioName}
                      onChange={(e) => {
                        setPendingAudioName(e.target.value);
                        setAudioUploadError(null);
                      }}
                      placeholder="请输入音频名称"
                      className="w-full h-9 px-3 text-[13px] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="h-9 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md whitespace-nowrap cursor-pointer"
                  >
                    确认上传
                  </button>
                </div>

                {audioUploadError && (
                  <div className="text-[12px] font-medium text-rose-600">
                    {audioUploadError}
                  </div>
                )}
              </form>

              {/* Play by filename + Volume */}
              <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-3">
                <h3 className="text-[13.5px] font-semibold text-slate-900">
                  按文件名播放
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <label
                      htmlFor="play-audio-select"
                      className="block text-[12px] text-slate-500 mb-1"
                    >
                      选择已有音频文件
                    </label>
                    <select
                      id="play-audio-select"
                      value={selectedPlayFileName}
                      onChange={(e) => setSelectedPlayFileName(e.target.value)}
                      className="w-full h-9 px-3 text-[13px] font-mono-tabular bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                    >
                      {audioFiles.map((af) => (
                        <option key={af.id} value={af.fileName}>
                          {af.fileName}（{af.name}）
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[12px] text-slate-500 mb-1">
                      <span>播放音量大小</span>
                      <span className="font-mono-tabular font-medium text-slate-800">
                        {playVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      aria-label="播放音量大小"
                      min={0}
                      max={100}
                      value={playVolume}
                      onChange={(e) => setPlayVolume(Number(e.target.value))}
                      className="w-full h-9 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = audioFiles.find(
                          (af) => af.fileName === selectedPlayFileName
                        );
                        if (target) handleDownloadAudio(target);
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载到本地
                    </button>
                    <button
                      type="button"
                      onClick={handlePlayAudioByFileName}
                      className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md whitespace-nowrap cursor-pointer"
                    >
                      {isPlayingAudio ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {isPlayingAudio ? '播放指令已发送' : '立即播放'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[12px] text-slate-500">
            型号 GZDLS7 专用测试面板 · 指令实时下发至设备终端
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
