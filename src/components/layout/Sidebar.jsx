import { useSidebar } from '../../context/SidebarContext';
import SidebarMenu from '../navigation/SidebarMenu';
import logoImg from '../../assets/vecteezy_close-up-of-black-crow-inspired-feathers-ai-generated_45370842.png';

export default function Sidebar() {
  const { isSidebarOpen, isSidebarCollapsed, isMobile, closeSidebar } = useSidebar();

  // Calculate sidebar classes based on state
  const getSidebarClasses = () => {
    let classes = 'shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out';

    if (isMobile) {
      // Mobile: slide in/out from left (overlay)
      classes += ' fixed top-0 left-0 h-screen';
      classes += isSidebarOpen
        ? ' w-[var(--sidebar-width)] translate-x-0'
        : ' w-[var(--sidebar-width)] -translate-x-full';
    } else {
      // Desktop: in-flow sidebar (no extra left margin needed in layout)
      classes += ' sticky top-0 h-screen shrink-0';
      classes += isSidebarCollapsed
        ? ' w-[var(--sidebar-mini-width)]'
        : ' w-[var(--sidebar-width)]';
    }

    return classes;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-1035 lg:hidden animate-fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`${getSidebarClasses()} bg-gradient-to-b from-[#0c9361] via-[#0a7a4f] to-[#087a4f] border-r border-[#0c9361]/30`}
        data-theme="dark"
      >
        {/* Sidebar Brand */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0 backdrop-blur-sm">
          <a href="/" className="flex items-center gap-3 text-white no-underline overflow-hidden group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" aria-hidden="true">
              <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span 
              className={`font-semibold text-base whitespace-nowrap transition-all duration-300 text-white ${
                !isMobile && isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'
              }`}
            >
              MinLT RMS
            </span>
          </a>
        </div>

        {/* Sidebar Wrapper - Scrollable (scrollbar hidden) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 no-scrollbar">
          <SidebarMenu collapsed={!isMobile && isSidebarCollapsed} />
        </div>
      </aside>
    </>
  );
}

