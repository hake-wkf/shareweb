import React, { useEffect } from 'react';
import { Clock, Mic, Music, X } from 'lucide-react';
import { Gzirb56Config, Gzirb56PanelTab } from '../types/device';
import { resolveWelcomeText } from '../data/gzirb56Data';

interface Gzirb56PreviewProps {
  roomName: string;
  config: Gzirb56Config;
}

/** Deterministic SVG QR grid bound to roomName */
const RoomQrSvg: React.FC<{ roomName: string }> = ({ roomName }) => {
  const seed = Array.from(roomName || 'A08').reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    17
  );
  const cells: boolean[] = [];
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      const inTL = r < 3 && c < 3;
      const inTR = r < 3 && c >= 8;
      const inBL = r >= 8 && c < 3;
      if (inTL || inTR || inBL) {
        cells.push(true);
      } else if (
        (r === 3 && c < 4) ||
        (c === 3 && r < 4) ||
        (r === 3 && c >= 7) ||
        (c === 7 && r < 4) ||
        (r === 7 && c < 4) ||
        (c === 3 && r >= 7)
      ) {
        cells.push(false);
      } else {
        cells.push(((r * 13 + c * 7 + seed) % 5) < 3);
      }
    }
  }

  return (
    <svg
      viewBox="0 0 110 110"
      className="w-full h-full"
      aria-label={`包间 ${roomName || 'A08'} 下单二维码`}
    >
      <rect width="110" height="110" fill="#FFFFFF" />
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const r = Math.floor(idx / 11);
        const c = idx % 11;
        return (
          <rect
            key={idx}
            x={5 + c * 9}
            y={5 + r * 9}
            width="8"
            height="8"
            rx="1"
            fill="#151321"
          />
        );
      })}
      {/* Crisp finder centers */}
      <rect x="9" y="9" width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      <rect x="81" y="9" width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      <rect x="9" y="81" width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
    </svg>
  );
};

/** 图一：开门下单欢迎画面预览 */
export const WelcomePreviewCanvas: React.FC<Gzirb56PreviewProps> = ({
  roomName,
  config,
}) => {
  const displayRoom = roomName.trim() || 'A08';
  const resolvedText = resolveWelcomeText(config.welcomeText, displayRoom);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-[#5B1F36]/70 px-6 py-8 sm:py-10 flex items-center justify-center"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(112, 32, 86, 0.25), transparent 55%), radial-gradient(circle at 80% 75%, rgba(76, 37, 114, 0.28), transparent 55%), linear-gradient(135deg, #0D0815 0%, #170E24 52%, #0B0812 100%)',
      }}
    >
      {/* Inner Luxury Card */}
      <div className="relative w-full max-w-[440px] bg-[#141120]/90 border border-white/10 rounded-md px-6 py-7 text-center shadow-2xl">
        {/* Top-left & Bottom-right L-brackets */}
        <span className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-slate-400/60" />
        <span className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b border-r border-slate-400/60" />

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 text-[10px] tracking-[0.28em] text-[#B59862] font-medium uppercase">
          <span className="w-7 h-px bg-[#B59862]/45" />
          <span>WELCOME</span>
          <span className="w-7 h-px bg-[#B59862]/45" />
        </div>

        {/* Main Welcome Text */}
        <div className="mt-4 text-[26px] sm:text-[32px] font-serif tracking-[0.12em] text-[#E6CFA0] leading-snug break-words">
          {resolvedText}
        </div>

        {/* Room Pill */}
        <div className="mt-5 inline-flex items-center gap-3 px-5 py-1.5 rounded-full bg-[#0C0A13] border border-white/10">
          <span className="text-[11.5px] text-slate-400">包房号</span>
          <span className="w-px h-3 bg-white/15" />
          <span className="text-[14px] font-semibold font-mono-tabular text-[#E0BE7D]">
            {displayRoom}
          </span>
        </div>
      </div>
    </div>
  );
};

/** 图二：续费下单提醒浮层预览 */
export const RenewalRemindPreviewCanvas: React.FC<{
  roomName: string;
  remainingMinutes?: number;
}> = ({ roomName, remainingMinutes = 5 }) => {
  const displayRoom = roomName.trim() || 'A08';

  return (
    <div className="w-full rounded-xl bg-[#F3F4F6] border border-slate-200 p-4 sm:p-5">
      <div className="inline-block mb-1.5 px-2.5 py-0.5 rounded bg-[#D9552D] text-white text-[10.5px] font-medium">
        续费区域 · 650 × 176 · 约占画布 30%
      </div>

      {/* Floating Dark Card */}
      <div
        className="relative w-full max-w-[520px] rounded-2xl overflow-hidden shadow-xl border border-white/10 px-3.5 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4"
        style={{
          background:
            'radial-gradient(circle at 82% 15%, rgba(84, 61, 128, 0.45), transparent 52%), linear-gradient(135deg, #1E1A2D 0%, #241F35 100%)',
        }}
      >
        {/* Left Orange Accent Bar */}
        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#FF785A]" />

        {/* Left QR Block */}
        <div className="flex flex-col items-center shrink-0 pl-1">
          <div className="w-[62px] h-[62px] sm:w-[82px] sm:h-[82px] bg-white rounded-xl p-1 sm:p-1.5 shadow-sm">
            <RoomQrSvg roomName={displayRoom} />
          </div>
          <span className="mt-1 text-[10.5px] sm:text-[11px] text-slate-400">
            扫码续单
          </span>
        </div>

        {/* Hairline Vertical Divider */}
        <div className="w-px self-stretch my-1 bg-white/10 shrink-0" />

        {/* Right Countdown Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11.5px] sm:text-[12px] text-[#B8B2CC]">
            <Clock className="w-3.5 h-3.5 text-[#FF785A] shrink-0" />
            <span>订单即将结束</span>
          </div>

          <div className="flex items-baseline gap-1.5 sm:gap-2 text-white">
            <span className="text-[17px] sm:text-[24px] font-bold">还剩</span>
            <span
              className="text-[26px] sm:text-[36px] font-extrabold font-mono-tabular leading-none"
              style={{
                color: '#FF785A',
                textShadow: '0 0 18px rgba(255, 120, 90, 0.45)',
              }}
            >
              {remainingMinutes}
            </span>
            <span className="text-[17px] sm:text-[24px] font-bold">分钟</span>
          </div>

          <p className="text-[11px] sm:text-[11.5px] text-[#9690AB] leading-snug">
            继续欢唱，请扫描左侧二维码续单（包间：{displayRoom}）
          </p>
        </div>
      </div>
    </div>
  );
};

/** 图三：续单成功样式预览 */
export const RenewalSuccessPreviewCanvas: React.FC<{
  extendedText?: string;
}> = ({ extendedText = 'XX' }) => {
  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-[#5B1F36]/70 px-5 py-7 sm:px-8 sm:py-8"
      style={{
        background:
          'radial-gradient(circle at 28% 50%, rgba(168, 85, 247, 0.25), transparent 55%), radial-gradient(circle at 75% 30%, rgba(236, 72, 153, 0.16), transparent 50%), linear-gradient(135deg, #161029 0%, #24173D 55%, #19122B 100%)',
      }}
    >
      {/* Floating Notes & Confetti */}
      <Music className="w-4 h-4 text-pink-400/80 absolute top-5 left-5 -rotate-12" />
      <Music className="w-4 h-4 text-pink-400/75 absolute top-8 right-6 rotate-12" />
      <span className="w-2.5 h-1 rounded-full bg-amber-300/80 rotate-45 absolute top-6 left-1/2" />
      <span className="w-2.5 h-1 rounded-full bg-pink-400/80 -rotate-12 absolute bottom-7 left-1/3" />
      <span className="w-2.5 h-1 rounded-full bg-amber-300/80 -rotate-45 absolute bottom-6 right-5" />

      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        {/* Glowing Microphone */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border border-amber-300/20" />
          <div className="absolute inset-2.5 rounded-full border border-pink-400/25" />
          <div
            className="w-16 h-16 rounded-2xl -rotate-12 flex items-center justify-center shadow-lg"
            style={{
              background:
                'linear-gradient(145deg, #FF7A7A 0%, #EC4899 45%, #8B5CF6 100%)',
              boxShadow: '0 0 28px rgba(236, 72, 153, 0.45)',
            }}
          >
            <Mic className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Success Text */}
        <div className="text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2.5 text-[11px] font-medium text-[#E4C27A] tracking-[0.16em]">
            <span className="w-6 h-px bg-[#E4C27A]/50" />
            <span>恭喜续费成功</span>
            <span className="w-6 h-px bg-[#E4C27A]/50" />
          </div>

          <div className="text-[20px] sm:text-[23px] font-bold text-white leading-tight">
            欢唱时间
          </div>

          <div className="flex items-baseline justify-center gap-2 text-white">
            <span className="text-[20px] sm:text-[23px] font-bold">已延长</span>
            <span
              className="text-[28px] sm:text-[32px] font-extrabold font-mono-tabular leading-none"
              style={{
                color: '#FF7AE2',
                textShadow: '0 0 18px rgba(255, 122, 226, 0.5)',
              }}
            >
              {extendedText}
            </span>
            <span className="text-[20px] sm:text-[23px] font-bold">分钟</span>
          </div>

          <div className="pt-1">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#120E20]/85 border border-white/10 text-[11.5px] text-slate-300">
              麦克风已就位，继续尽情开唱
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Equalizer Bars */}
      <div className="mt-5 flex items-end justify-center gap-1.5 opacity-60">
        {[6, 10, 14, 9, 16, 12, 8, 13, 7].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-purple-500 to-pink-400"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
};

/** 图四：活动内容画面预览 */
export const ActivityPreviewCanvas: React.FC<Gzirb56PreviewProps> = ({
  config,
}) => {
  const rawDiscount = (config.activityDiscount || '8.8折').trim();
  const hasZheSuffix = rawDiscount.endsWith('折') && rawDiscount.length > 1;
  const discountMain = hasZheSuffix ? rawDiscount.slice(0, -1) : rawDiscount;
  const discountSuffix = hasZheSuffix ? '折' : '';

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-[#5B1F36]/70 px-4 py-6 sm:px-7 sm:py-9 flex items-center justify-center"
      style={{
        background:
          'radial-gradient(circle at 22% 30%, rgba(76, 37, 130, 0.25), transparent 55%), radial-gradient(circle at 82% 80%, rgba(126, 28, 86, 0.3), transparent 52%), linear-gradient(135deg, #090612 0%, #140B21 55%, #160A18 100%)',
      }}
    >
      {/* Subtle Ambient Rings */}
      <span className="pointer-events-none absolute -top-12 -right-8 w-44 h-44 rounded-full border border-white/[0.05]" />
      <span className="pointer-events-none absolute -bottom-16 -left-10 w-52 h-52 rounded-full border border-white/[0.05]" />

      {/* Horizontal KTV Ticket Card */}
      <div className="relative w-full max-w-[560px] rounded-xl border border-white/10 overflow-hidden shadow-2xl grid grid-cols-[1.55fr_1fr] bg-[#191429]/95">
        {/* Left Main Event Details */}
        <div className="relative px-4 py-4 sm:px-6 sm:py-6 flex flex-col justify-between gap-2.5 min-w-0">
          <div>
            <div className="flex items-center gap-2 text-[9px] sm:text-[10.5px] font-semibold tracking-[0.16em] text-[#D7B164] uppercase">
              <span className="w-3.5 h-[1.5px] bg-[#D7B164] shrink-0" />
              <span className="truncate">KTV SPECIAL EVENT</span>
            </div>

            <h4
              className="mt-1.5 text-[19px] sm:text-[30px] font-bold text-white leading-tight tracking-wide break-words"
              style={{
                textShadow:
                  '1px 1px 0 rgba(217, 70, 145, 0.45), -1px 0 0 rgba(56, 189, 248, 0.25)',
              }}
            >
              {config.activityName || '欢唱畅饮夜'}
            </h4>

            <p className="mt-1 text-[11px] sm:text-[13px] text-[#ABA4C2] leading-snug break-words">
              {config.activityDesc || '黄金时段欢唱套餐 · 限时放送'}
            </p>
          </div>

          <div className="pt-1.5 text-[10.5px] sm:text-[12px] font-mono-tabular text-[#CFC9DF] break-words">
            {config.activityTime || '每周五至周日 · 20:00—24:00'}
          </div>
        </div>

        {/* Right Burgundy Stub with Dashed Perforation */}
        <div
          className="relative overflow-hidden px-3 py-4 sm:px-5 sm:py-6 flex flex-col items-center justify-center text-center border-l border-dashed border-white/25"
          style={{
            background:
              'linear-gradient(155deg, #5F1B4A 0%, #4A1439 100%)',
          }}
        >
          {/* Subtle Stub Ring Watermark */}
          <span className="pointer-events-none absolute -top-5 -left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[6px] sm:border-[8px] border-white/[0.08]" />

          {/* 折扣描述 Pill */}
          <span className="relative inline-block max-w-full px-2.5 py-0.5 rounded-full border border-[#D7B164]/50 bg-[#2C0E24]/45 text-[10px] sm:text-[11.5px] text-[#E6C782] font-medium truncate">
            {config.discountDesc || '指定套餐'}
          </span>

          {/* 活动折扣 Large Display */}
          <div className="relative mt-2 flex items-baseline justify-center text-white leading-none">
            <span
              className={`${
                discountMain.length > 4
                  ? 'text-[18px] sm:text-[26px]'
                  : 'text-[26px] sm:text-[40px]'
              } font-extrabold font-mono-tabular tracking-tight`}
            >
              {discountMain}
            </span>
            {discountSuffix && (
              <span className="ml-0.5 text-[13px] sm:text-[18px] font-semibold text-white/95">
                {discountSuffix}
              </span>
            )}
          </div>

          {/* 活动内容 Footer Caption */}
          <p className="relative mt-2.5 text-[9.5px] sm:text-[11px] text-[#D7B6CC] leading-snug break-words">
            {config.activityContent || '活动详情请咨询服务人员'}
          </p>
        </div>
      </div>
    </div>
  );
};

interface Gzirb56PreviewModalProps {
  isOpen: boolean;
  tab: Gzirb56PanelTab;
  roomName: string;
  config: Gzirb56Config;
  variant?: 'web' | 'app';
  onClose: () => void;
}

export const Gzirb56PreviewModal: React.FC<Gzirb56PreviewModalProps> = ({
  isOpen,
  tab,
  roomName,
  config,
  variant = 'web',
  onClose,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isApp = variant === 'app';

  const title =
    tab === 'open_order'
      ? '开门下单 · 屏幕预览样式'
      : tab === 'renew_order'
      ? '续费下单 · 提醒与成功预览样式'
      : '活动内容 · 屏幕预览样式';

  return (
    <div
      className={`fixed inset-0 z-[60] flex justify-center ${
        isApp ? 'items-end sm:items-center p-0 sm:p-4' : 'items-center p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gzirb56-preview-title"
    >
      <div className="fixed inset-0 bg-slate-900/60" onClick={onClose} />
      <div
        className={`relative z-10 w-full bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden ${
          isApp
            ? 'max-w-[430px] max-h-[88vh] rounded-t-2xl sm:rounded-2xl'
            : 'max-w-[680px] max-h-[90vh] rounded-xl'
        }`}
      >
        <div
          className={`flex items-center justify-between ${
            isApp
              ? 'bg-[#4B996E] px-4 py-3 text-white'
              : 'px-5 py-3.5 border-b border-slate-200'
          }`}
        >
          <h3
            id="gzirb56-preview-title"
            className={`font-semibold ${
              isApp ? 'text-[14.5px] text-white' : 'text-[15px] text-slate-900'
            }`}
          >
            {title}
          </h3>
          <button
            type="button"
            aria-label="关闭预览"
            onClick={onClose}
            className={`p-1.5 rounded-md cursor-pointer ${
              isApp
                ? 'text-emerald-100 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`overflow-y-auto space-y-4 ${
            isApp ? 'p-3.5 bg-[#F5F6F8]' : 'p-5 bg-slate-50'
          }`}
        >
          {tab === 'open_order' && (
            <div className="space-y-2">
              <div className="text-[12px] font-medium text-slate-600">
                点歌机迎宾屏幕效果预览（变量已按当前绑定包间「
                <span className="font-mono-tabular font-semibold text-slate-900">
                  {roomName || 'A08'}
                </span>
                」渲染）
              </div>
              <WelcomePreviewCanvas roomName={roomName} config={config} />
            </div>
          )}

          {tab === 'renew_order' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="text-[12.5px] font-semibold text-slate-800">
                  1. 续费提醒浮层样式
                </div>
                <RenewalRemindPreviewCanvas
                  roomName={roomName}
                  remainingMinutes={5}
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-[12.5px] font-semibold text-slate-800">
                  2. 续单成功样式
                </div>
                <RenewalSuccessPreviewCanvas extendedText="XX" />
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-2">
              <div className="text-[12px] font-medium text-slate-600">
                点歌机活动公告展示效果预览
              </div>
              <ActivityPreviewCanvas roomName={roomName} config={config} />
            </div>
          )}
        </div>

        <div
          className={`border-t border-slate-200 bg-white ${
            isApp ? 'px-4 py-3' : 'px-5 py-3 flex justify-end'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`text-[13px] font-medium text-white cursor-pointer ${
              isApp
                ? 'w-full h-9.5 bg-[#4B996E] hover:bg-[#3B825B] rounded-lg'
                : 'h-8.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-md'
            }`}
          >
            关闭预览
          </button>
        </div>
      </div>
    </div>
  );
};
