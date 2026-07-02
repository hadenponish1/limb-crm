const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icon = {
  dashboard: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>),
  calendar: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>),
  users: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  map: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3z"/><path d="M9 3v15M15 6v15"/></svg>),
  chart: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 5-7"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 5v14M5 12h14"/></svg>),
  dollar: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>),
  trend: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>),
  repeat: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>),
  briefcase: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>),
  x: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>),
  trash: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>),
  phone: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>),
  mail: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>),
  pin: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  external: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>),
  download: (p) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>),
}
