export function IconWrench({ color = "#fff", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-3 3-2-2 3-3z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBolt({ color = "#fff", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconWind({ color = "#fff", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M3 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBarrier({ color = "#fff", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 17l4-4M17 7l4-4M8 21l13-13M3 12l9-9"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDrop({ color = "#fff", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2s7 8 7 13a7 7 0 01-14 0c0-5 7-13 7-13z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const serviceIcons = {
  wrench: IconWrench,
  bolt: IconBolt,
  wind: IconWind,
  barrier: IconBarrier,
  drop: IconDrop,
};

export function IconWhatsapp({ color = "#fff", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3a9 9 0 00-7.6 13.8L3 21l4.4-1.4A9 9 0 1012 3z"
        stroke={color}
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function IconMail({ color = "#fff", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCheck({ color = "var(--orange)", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" />
      <path
        d="M8 12.5l2.6 2.6L16.5 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCalendar({ color = "var(--blue)", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconPin({ color = "var(--blue)", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s7-7.4 7-13a7 7 0 10-14 0c0 5.6 7 13 7 13z"
        stroke={color}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function IconEnvelope({ color = "var(--orange)", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function IconStar({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.6 6.8L12 17l-6.2 3.4 1.6-6.8L2.2 9l6.9-.7z" />
    </svg>
  );
}

export function IconChevronDown({ color = "#fff", size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronUp({ color = "#0d1b2e", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M18 15l-6-6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
