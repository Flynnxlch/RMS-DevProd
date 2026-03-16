import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext(null);

// Breakpoint for responsive behavior (lg = 992px in Bootstrap)
const LG_BREAKPOINT = 992;

export function SidebarProvider({ children }) {
  // Sidebar open/close state (for mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Sidebar collapsed state (mini sidebar mode)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < LG_BREAKPOINT : false
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < LG_BREAKPOINT;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when resizing to desktop
      if (!mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Toggle sidebar (different behavior for mobile vs desktop)
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  }, [isMobile]);

  // Open sidebar (mobile only)
  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  // Close sidebar (mobile only)
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Collapse/expand sidebar (desktop only)
  const collapseSidebar = useCallback(() => {
    setIsSidebarCollapsed(true);
  }, []);

  const expandSidebar = useCallback(() => {
    setIsSidebarCollapsed(false);
  }, []);

  const value = {
    isSidebarOpen,
    isSidebarCollapsed,
    isMobile,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    collapseSidebar,
    expandSidebar,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export default SidebarContext;

