import { useState } from 'react';

const colorClasses = {
  primary: 'bg-[#0d6efd] text-white',
  success: 'bg-[#198754] text-white',
  warning: 'bg-[#ffc107] text-gray-900',
  danger: 'bg-[#dc3545] text-white',
  info: 'bg-[#0dcaf0] text-gray-900',
  secondary: 'bg-[#6c757d] text-white',
  dark: 'bg-[#212529] text-white',
  light: 'bg-[#f8f9fa] text-gray-900',
};

const outlineClasses = {
  primary: 'border-t-4 border-t-[#0d6efd]',
  success: 'border-t-4 border-t-[#198754]',
  warning: 'border-t-4 border-t-[#ffc107]',
  danger: 'border-t-4 border-t-[#dc3545]',
  info: 'border-t-4 border-t-[#0dcaf0]',
  secondary: 'border-t-4 border-t-[#6c757d]',
  dark: 'border-t-4 border-t-[#212529]',
};

export default function Card({
  title,
  children,
  color,
  outline = false,
  gradient = false,
  collapsible = false,
  removable = false,
  tools,
  footer,
  headerExtra,
  className = '',
  bodyClassName = '',
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  if (isRemoved) return null;

  const getCardClasses = () => {
    let classes = 'bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-[var(--shadow-card)] mb-4 overflow-hidden border border-gray-200 dark:border-[var(--color-card-border-dark)]';
    
    if (outline && color) {
      classes += ` ${outlineClasses[color] || ''}`;
    } else if (color && gradient) {
      classes += ` ${colorClasses[color] || ''} bg-gradient-to-br`;
    } else if (color) {
      classes += ` ${colorClasses[color] || ''}`;
    }
    
    return `${classes} ${className}`;
  };

  const getHeaderClasses = () => {
    let classes = 'flex items-center justify-between px-4 py-3 border-b';
    
    if (color && !outline) {
      classes += ' border-white/20';
    } else {
      classes += ' border-gray-200 dark:border-[var(--color-card-border-dark)] bg-transparent';
    }
    
    if (isCollapsed) {
      classes += ' border-b-0';
    }
    
    return classes;
  };

  return (
    <div className={getCardClasses()}>
      {/* Card Header */}
      {(title || tools || collapsible || removable) && (
        <div className={getHeaderClasses()}>
          <h3 className="text-lg font-normal m-0 text-gray-900 dark:text-white">{title}</h3>
          
          <div className="flex items-center gap-1">
            {headerExtra}
            {tools}
            
            {collapsible && (
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                     className={`p-1.5 rounded transition-colors ${
                       color && !outline
                         ? 'text-white/60 hover:text-white'
                         : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                     }`}
              >
                <i className={`bi ${isCollapsed ? 'bi-plus-lg' : 'bi-dash-lg'}`}></i>
              </button>
            )}
            
            {removable && (
              <button
                type="button"
                onClick={() => setIsRemoved(true)}
                     className={`p-1.5 rounded transition-colors ${
                       color && !outline
                         ? 'text-white/60 hover:text-white'
                         : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                     }`}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Body */}
      <div 
        className={`
          transition-all duration-300
          ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-none'}
        `}
      >
        <div className={`p-4 ${bodyClassName}`}>
          {children}
        </div>

        {/* Card Footer */}
               {footer && !isCollapsed && (
                 <div className={`px-4 py-3 border-t ${
                   color && !outline ? 'border-white/20' : 'border-gray-200 dark:border-[var(--color-card-border-dark)]'
                 }`}>
                   {footer}
                 </div>
               )}
      </div>
    </div>
  );
}

// Card Header sub-component for custom headers
Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[var(--color-card-border-dark)] ${className}`}>
      {children}
    </div>
  );
};

// Card Body sub-component
Card.Body = function CardBody({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

// Card Footer sub-component
Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-t border-gray-200 dark:border-[var(--color-card-border-dark)] ${className}`}>
      {children}
    </div>
  );
};

// Card Tools sub-component
Card.Tools = function CardTools({ children }) {
  return <div className="flex items-center gap-1">{children}</div>;
};

