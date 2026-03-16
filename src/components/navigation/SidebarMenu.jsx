import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RISK_LEVELS } from '../../utils/risk';

// ── Shared menu building blocks ──────────────────────────────────────────────

const RISK_LEVELS_SUBMENU = {
  id: 'risk-levels',
  label: 'Tingkat Risiko',
  icon: 'bi-bar-chart-line',
  children: RISK_LEVELS.map((lvl) => ({
    id: `risk-level-${lvl.key}`,
    label: lvl.labelId || lvl.label,
    path: `/risks?level=${lvl.key}`,
  })),
};

// ── Per-role menu definitions ─────────────────────────────────────────────────

const MENU_RISK_OFFICER = [
  { id: 'dashboard',      label: 'Dasbor Risiko',    icon: 'bi-speedometer2',   path: '/' },
  { id: 'risks-all',      label: 'Semua Risiko',      icon: 'bi-clipboard-data', path: '/risks' },
  { id: 'risk-register',  label: 'Register Risiko',   icon: 'bi-file-plus',      path: '/risks/new' },
  RISK_LEVELS_SUBMENU,
  { id: 'mitigation',     label: 'Rencana Mitigasi',  icon: 'bi-shield-check',   path: '/mitigations' },
  { id: 'settings',       label: 'Pengaturan',        icon: 'bi-gear',           path: '/settings' },
  { id: 'guide',          label: 'Buletin',           icon: 'bi-book',           path: '/guide' },
];

const MENU_RISK_CHAMPION = [
  { id: 'dashboard',  label: 'Dasbor Risiko',   icon: 'bi-speedometer2',   path: '/' },
  { id: 'risks-all',  label: 'Semua Risiko',     icon: 'bi-clipboard-data', path: '/risks' },
  RISK_LEVELS_SUBMENU,
  { id: 'mitigation', label: 'Rencana Mitigasi', icon: 'bi-shield-check',   path: '/mitigations' },
  { id: 'settings',   label: 'Pengaturan',       icon: 'bi-gear',           path: '/settings' },
  { id: 'guide',      label: 'Buletin',          icon: 'bi-book',           path: '/guide' },
];

const MENU_RISK_ASSESSMENT = [
  { id: 'dashboard',         label: 'Dasbor Risiko',          icon: 'bi-speedometer2',   path: '/' },
  { id: 'risks-all',         label: 'Semua Risiko',            icon: 'bi-clipboard-data', path: '/risks' },
  RISK_LEVELS_SUBMENU,
  { id: 'evaluation',        label: 'Evaluasi Keberhasilan',   icon: 'bi-calendar-check', path: '/evaluations' },
  { id: 'risk-measurement',  label: 'Pengukuran Risiko',       icon: 'bi-rulers',         path: '/measurements' },
  { id: 'settings',          label: 'Pengaturan',              icon: 'bi-gear',           path: '/settings' },
  { id: 'guide',             label: 'Buletin',                 icon: 'bi-book',           path: '/guide' },
  // Admin panel section
  { id: 'admin-header',      label: 'Admin Panel',             type: 'header' },
  { id: 'admin-users',       label: 'Manajemen Pengguna',      icon: 'bi-people',         path: '/admin/users' },
  { id: 'admin-reg-requests',label: 'Permintaan Registrasi',   icon: 'bi-person-plus',    path: '/admin/registration-requests' },
  { id: 'admin-other-req',   label: 'Permintaan Lainnya',      icon: 'bi-inbox',          path: '/admin/other-requests' },
  { id: 'admin-regulations', label: 'Update Peraturan Terbaru',icon: 'bi-newspaper',      path: '/admin/regulations' },
];

const MENU_BY_ROLE = {
  RISK_OFFICER:   MENU_RISK_OFFICER,
  RISK_CHAMPION:  MENU_RISK_CHAMPION,
  RISK_ASSESSMENT: MENU_RISK_ASSESSMENT,
};

// ── MenuItem component ────────────────────────────────────────────────────────

function MenuItem({ item, collapsed, level = 0 }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    if (item.children) {
      return item.children.some(
        (child) =>
          child.path === location.pathname ||
          (child.children &&
            child.children.some((grandchild) => grandchild.path === location.pathname))
      );
    }
    return false;
  });

  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren
    ? item.children.some(
        (child) =>
          child.path === location.pathname ||
          (child.children &&
            child.children.some((grandchild) => grandchild.path === location.pathname))
      )
    : false;
  const isActive = item.path === location.pathname || isChildActive;
  const paddingLeft = level > 0 ? `${level * 0.75}rem` : undefined;

  // Section header
  if (item.type === 'header') {
    return (
      <li
        className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white/50 transition-opacity duration-300 ${
          collapsed ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100'
        }`}
      >
        {item.label}
      </li>
    );
  }

  const isDisabled = item.path === '#';

  const linkClasses = `
    flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 relative
    ${collapsed && level === 0 ? 'px-3 py-3 gap-0' : 'px-3 py-2.5 gap-3 justify-start'}
    ${
      isActive
        ? collapsed && level === 0
          ? 'bg-white/20 text-white shadow-lg shadow-white/20'
          : 'bg-white/15 text-white shadow-md'
        : 'text-white/90 hover:text-white hover:bg-white/10'
    }
    ${level > 0 ? 'text-white/80 ml-2' : ''}
    ${isDisabled ? 'opacity-50 cursor-default hover:bg-transparent hover:text-white/75' : ''}
    ${!isActive && !isDisabled ? 'hover:scale-[1.02]' : ''}
  `;

  const activeBorderStyle = isActive
    ? collapsed && level === 0
      ? 'before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:bg-white before:rounded-r-full before:shadow-lg before:shadow-white/30'
      : 'before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-white/80 before:rounded-r-full'
    : '';

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
      return;
    }
    if (isDisabled) {
      e.preventDefault();
    }
  };

  const content = (
    <>
      <i
        className={`bi ${item.icon} ${item.iconColor || 'text-white'} text-lg shrink-0 transition-transform duration-200 ${
          collapsed && level === 0 ? 'mx-auto' : 'w-6 text-center'
        } ${isActive ? 'scale-110' : ''}`}
      />
      <span
        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
          collapsed && level === 0 ? 'hidden' : 'flex-1 opacity-100'
        }`}
        style={{ paddingLeft }}
      >
        {item.label}
      </span>
      {item.badge && !collapsed && (
        <span className={`${item.badge.color} text-white text-xs px-2 py-0.5 rounded-full font-semibold`}>
          {item.badge.text}
        </span>
      )}
      {hasChildren && !collapsed && (
        <i
          className={`bi bi-chevron-right text-xs text-white/80 transition-transform duration-300 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      )}
    </>
  );

  return (
    <li className={`mb-1 ${isOpen ? 'menu-open' : ''}`}>
      {item.path && !hasChildren && !isDisabled ? (
        <Link to={item.path} className={`${linkClasses} ${activeBorderStyle}`}>
          {content}
        </Link>
      ) : (
        <a href="#" onClick={handleClick} className={`${linkClasses} ${activeBorderStyle}`}>
          {content}
        </a>
      )}

      {hasChildren && (
        <ul
          className={`overflow-hidden transition-all duration-300 ml-2 border-l-2 border-white/10 ${
            isOpen && !collapsed ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}
        >
          {item.children.map((child) => (
            <MenuItem
              key={child.id}
              item={{ ...child, icon: child.icon || 'bi-circle' }}
              collapsed={collapsed}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── SidebarMenu ───────────────────────────────────────────────────────────────

export default function SidebarMenu({ collapsed }) {
  const { user } = useAuth();
  const menuItems = MENU_BY_ROLE[user?.userRole] || MENU_RISK_OFFICER;

  return (
    <nav className="mt-1">
      <ul className="space-y-1" role="navigation" aria-label="Main navigation">
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.id || `header-${index}`}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </ul>
    </nav>
  );
}
