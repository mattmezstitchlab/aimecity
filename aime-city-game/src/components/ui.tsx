"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { usePrefs } from "@/lib/prefs";
import { createPortal } from "react-dom";

type IconName =
  | "world"
  | "story"
  | "crew"
  | "calendar"
  | "budget"
  | "journey"
  | "studio"
  | "radio"
  | "aria"
  | "settings"
  | "close"
  | "plus"
  | "check"
  | "minus"
  | "chevron"
  | "chevronDown"
  | "search"
  | "play"
  | "pause"
  | "trash"
  | "edit"
  | "share"
  | "download"
  | "import"
  | "reset"
  | "heart"
  | "pin"
  | "clock"
  | "spark"
  | "menu"
  | "arrowRight"
  | "arrowLeft"
  | "camera"
  | "music"
  | "mic"
  | "send"
  | "external"
  | "users"
  | "wallet"
  | "user"
  | "layers"
  | "grid"
  | "portrait"
  | "lock"
  | "zoomIn"
  | "zoomOut"
  | "target"
  | "sun"
  | "moon"
  | "sunset"
  | "vibrate"
  | "motion";

const PATHS: Record<IconName, ReactNode> = {
  world: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9Z" />
    </>
  ),
  story: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 5.5v15M8 7.5h8M8 11.5h6" />
    </>
  ),
  crew: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 6.2M17.5 14.8c2.2.6 3.7 2.3 4 5.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4M8 14h3M8 17.5h7" />
    </>
  ),
  budget: (
    <>
      <rect x="2.5" y="6" width="19" height="13" rx="3.5" />
      <path d="M2.5 11h19M6.5 15.5h3" />
    </>
  ),
  journey: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  studio: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="3" />
      <path d="m15.5 11 5-3v8l-5-3Z" />
    </>
  ),
  radio: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15" />
    </>
  ),
  aria: (
    <>
      <path d="M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6l-1.9-5.8L4.3 10.9 10.1 9Z" />
      <path d="M18.6 16.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  play: <path d="M7 4.5 20 12 7 19.5Z" />,
  pause: <path d="M8 4.5v15M16 4.5v15" />,
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />,
  edit: <path d="M4 20h4l11-11-4-4L4 16ZM14.5 5.5l4 4" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6" />
    </>
  ),
  download: <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 18v3h16v-3" />,
  import: <path d="M12 21V9m0 0 4.5 4.5M12 9 7.5 13.5M4 6V3h16v3" />,
  reset: <path d="M3.5 12a8.5 8.5 0 1 0 3-6.5M3 3v6h6" />,
  heart: <path d="M12 20C7 16.5 3 13.2 3 9.4A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 9 3.4c0 3.8-4 7.1-9 10.6Z" />,
  pin: (
    <>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  spark: <path d="M12 2.5 14 10l7.5 2-7.5 2-2 7.5L10 14 2.5 12 10 10Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  arrowRight: <path d="M4 12h15m0 0-6-6m6 6-6 6" />,
  arrowLeft: <path d="M20 12H5m0 0 6-6m-6 6 6 6" />,
  camera: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.9l1.4-2h6.4l1.4 2h1.9A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5Z" />
      <circle cx="12" cy="12.8" r="3.6" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6.5" cy="18" r="3" />
      <circle cx="17.5" cy="16" r="3" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7" />
    </>
  ),
  send: <path d="M21 3 3 10.5l7 2.5 2.5 7Z" />,
  external: <path d="M14 4h6v6M20 4l-8 8M9 5H5.5A2.5 2.5 0 0 0 3 7.5v11A2.5 2.5 0 0 0 5.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15" />,
  users: (
    <>
      <circle cx="8.5" cy="8" r="3.5" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M2 20c.5-3.6 3-5.8 6.5-5.8S14.5 16.4 15 20M16 15c3 0 5 1.8 5.5 4.5" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" />
      <path d="M3 9.5h15.5M16.5 14.5h2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.7-4.2 4-6.5 8-6.5s7.3 2.3 8 6.5" />
    </>
  ),
  layers: <path d="m12 3 9 5-9 5-9-5ZM3 13l9 5 9-5M3 17l9 5 9-5" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  portrait: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3.5" />
      <path d="M8 3.5v17" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="3" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M11 8.5v5M8.5 11h5M16 16l4.5 4.5" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M8.5 11h5M16 16l4.5 4.5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  sunset: (
    <>
      <path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 3v4M4.5 8.5 6 10M19.5 8.5 18 10M2 21h20" />
    </>
  ),
  vibrate: (
    <>
      <rect x="8" y="3.5" width="8" height="17" rx="2.5" />
      <path d="M4 9v6M2 10.5v3M20 9v6M22 10.5v3" />
    </>
  ),
  motion: <path d="M3 12h4l3-7 4 14 3-7h4" />,
};

export function Icon({
  name,
  size = 24,
  className = "",
  strokeWidth = 1.7,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };

/* ------------------------------------------------------------------ */
/* Panneau coulissant : bottom sheet (portrait), latéral (console),    */
/* dialogue centré (desktop). Fermeture par glissement vers le bas.    */
/* ------------------------------------------------------------------ */

export function Sheet({
  open,
  onClose,
  title,
  kicker,
  children,
  footer,
  wide = false,
  bare = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  kicker?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  bare?: boolean;
}) {
  const { consoleMode, viewport, haptic } = usePrefs();
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const dragDistance = useRef(0);

  const closeSheet = useCallback(() => {
    startY.current = null;
    dragDistance.current = 0;
    setDragY(0);
    setDragging(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, closeSheet]);

  if (!open || typeof document === "undefined") return null;

  const desktop = viewport.w >= 1024;
  const side = consoleMode && !desktop;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (side || desktop) return;
    startY.current = event.clientY;
    dragDistance.current = 0;
    setDragY(0);
    setDragging(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    dragDistance.current = Math.max(0, event.clientY - startY.current);
    setDragY(dragDistance.current);
  };
  const onPointerUp = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (dragDistance.current > 110) {
      haptic("soft");
      closeSheet();
      return;
    }
    dragDistance.current = 0;
    setDragY(0);
    setDragging(false);
  };

  const panelClass = desktop
    ? `relative w-full ${wide ? "max-w-5xl" : "max-w-2xl"} max-h-[88dvh] rounded-[28px] sheet-in`
    : side
      ? `absolute right-0 top-0 h-full w-[min(460px,86vw)] rounded-l-[28px] side-in`
      : `absolute inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px] sheet-in`;

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] flex ${desktop ? "items-center justify-center p-6" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Panneau"}
    >
      <button type="button" aria-label="Fermer le panneau" onClick={closeSheet} className="absolute inset-0 bg-[#000000]/78 backdrop-blur-[3px]" />
      <div
        data-testid="aime-sheet"
        className={`${panelClass} sheet-scroll border border-[rgba(255,255,255,0.16)] bg-[#050505]`}
        style={!side && !desktop ? { transform: `translateY(${dragY}px)`, transition: dragging ? "none" : "transform .28s cubic-bezier(.16,1,.3,1)" } : undefined}
      >
        {!side && !desktop && (
          <div
            className="relative flex touch-none justify-center bg-[#050505] pt-3 pb-1"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className="h-1 w-12 rounded-full bg-[rgba(255,255,255,0.28)]" />
          </div>
        )}
        {!bare && (title || kicker) && (
          <div
            className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[rgba(255,255,255,0.12)] bg-[#050505] px-5 py-4"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <div className="min-w-0">
              {kicker && <p className="kicker">{kicker}</p>}
              {title && <h2 className="title-2 mt-1">{title}</h2>}
            </div>
            <button type="button" onClick={closeSheet} className="icon-btn" aria-label="Fermer">
              <Icon name="close" size={22} />
            </button>
          </div>
        )}
        <div className="relative min-w-0">{children}</div>
        {footer && <div className="safe-b sticky bottom-0 z-10 border-t border-[rgba(255,255,255,0.12)] bg-[#050505] px-4 pt-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Progress({ value, height = 8 }: { value: number; tone?: string; height?: number }) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${clamped}%`, background: "#ffffff" }}
      />
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <section className="section first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="title-1">{title}</h1>
          {subtitle && <p className="body-lg mt-5 max-w-2xl">{subtitle}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </div>
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="glass-soft p-5">
      <p className="kicker">{label}</p>
      <p className="title-2 mt-3 tabular" style={tone ? { color: tone } : undefined}>
        {value}
      </p>
      {hint && <p className="meta mt-1.5 text-white/45">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-2 rounded-full border border-[rgba(255,255,255,0.14)] p-1">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full text-[0.9375rem] font-medium transition ${
              active ? "bg-white text-black" : "text-white/65 hover:text-white"
            }`}
          >
            {option.icon && <Icon name={option.icon} size={20} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ icon = "spark", title, text, action }: { icon?: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="glass-soft flex flex-col items-center gap-5 px-6 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full border border-[rgba(255,255,255,0.2)] text-white">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="title-2">{title}</h3>
      <p className="max-w-md text-[1rem] leading-relaxed text-white/65">{text}</p>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zoom + déplacement tactile (pincement, glisser, molette)            */
/* ------------------------------------------------------------------ */

export function usePanZoom(
  ref: RefObject<HTMLDivElement | null>,
  { min = 1, max = 3.2 }: { min?: number; max?: number } = {},
) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [gesture, setGesture] = useState<"idle" | "pan" | "pinch">("idle");
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const clampOffset = useCallback(
    (next: { x: number; y: number }, currentZoom: number) => {
      const node = ref.current;
      if (!node) return next;
      const maxX = ((currentZoom - 1) * node.clientWidth) / 2;
      const maxY = ((currentZoom - 1) * node.clientHeight) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, next.x)),
        y: Math.max(-maxY, Math.min(maxY, next.y)),
      };
    },
    [ref],
  );

  const applyZoom = useCallback(
    (next: number) => {
      const clamped = Math.max(min, Math.min(max, Number(next.toFixed(3))));
      setZoom(clamped);
      setOffset((current) => clampOffset(current, clamped));
      return clamped;
    },
    [clampOffset, max, min],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      panStart.current = null;
      setGesture("pinch");
    } else if (pointers.current.size === 1) {
      panStart.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
      setGesture("pan");
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = distance / (pinchStart.current.distance || 1);
      applyZoom(pinchStart.current.zoom * ratio);
      return;
    }
    if (panStart.current && zoom > 1) {
      const next = {
        x: panStart.current.ox + (event.clientX - panStart.current.x),
        y: panStart.current.oy + (event.clientY - panStart.current.y),
      };
      setOffset(clampOffset(next, zoom));
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      panStart.current = null;
      setGesture("idle");
    }
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 2) return;
    applyZoom(zoom + (event.deltaY > 0 ? -0.18 : 0.18));
  };

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  return {
    zoom,
    offset,
    gesture,
    canPan: zoom > 1,
    setZoom: applyZoom,
    zoomIn: () => applyZoom(zoom + 0.35),
    zoomOut: () => applyZoom(zoom - 0.35),
    reset,
    transform: `scale(${zoom}) translate3d(${offset.x / zoom}px, ${offset.y / zoom}px, 0)`,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerLeave: endPointer,
      onWheel,
    },
  };
}

export function Avatar({ src, alt, size = 56 }: { src: string; alt: string; size?: number }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-2xl" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </span>
  );
}
