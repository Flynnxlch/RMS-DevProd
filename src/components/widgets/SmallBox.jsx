// Kept for backwards-compatibility — re-exported so existing imports don't break
export const SmallBoxIcons = {};

const colorConfig = {
  primary: {
    bg: 'bg-blue-600 dark:bg-blue-600',
    iconColor: 'text-blue-200/40',
    accent: 'bg-blue-400/30',
    ring: 'ring-blue-400/20',
  },
  success: {
    bg: 'bg-emerald-600 dark:bg-emerald-600',
    iconColor: 'text-emerald-200/40',
    accent: 'bg-emerald-400/30',
    ring: 'ring-emerald-400/20',
  },
  warning: {
    bg: 'bg-amber-600 dark:bg-amber-600',
    iconColor: 'text-amber-200/40',
    accent: 'bg-amber-300/30',
    ring: 'ring-amber-300/20',
  },
  danger: {
    bg: 'bg-rose-600 dark:bg-rose-600',
    iconColor: 'text-rose-200/40',
    accent: 'bg-rose-400/30',
    ring: 'ring-rose-400/20',
  },
  info: {
    bg: 'bg-cyan-600 dark:bg-cyan-600',
    iconColor: 'text-cyan-200/40',
    accent: 'bg-cyan-400/30',
    ring: 'ring-cyan-400/20',
  },
  secondary: {
    bg: 'bg-slate-500 dark:bg-slate-600',
    iconColor: 'text-slate-200/40',
    accent: 'bg-slate-400/30',
    ring: 'ring-slate-400/20',
  },
};

export default function SmallBox({
  title,
  value,
  icon,
  color = 'primary',
  suffix = '',
}) {
  const cfg = colorConfig[color] || colorConfig.primary;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${cfg.bg} ring-1 ${cfg.ring} shadow-md`}>
      {/* Watermark icon */}
      {icon && (
        <i
          className={`bi ${icon} absolute -right-3 -bottom-3 text-[7rem] leading-none ${cfg.iconColor} pointer-events-none select-none`}
        />
      )}

      {/* Content */}
      <div className="relative z-10 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">{title}</p>
        <p className="text-4xl font-bold text-white leading-none">
          {value}
          {suffix && <span className="text-xl font-semibold ml-0.5 text-white/80">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}
