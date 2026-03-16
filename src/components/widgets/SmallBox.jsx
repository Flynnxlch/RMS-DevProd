import { Link } from 'react-router-dom';

// Modern gradient definitions with glassmorphism support
const gradientClasses = {
  primary: {
    gradient: 'from-blue-500 via-blue-600 to-blue-700 dark:from-blue-600 dark:via-blue-700 dark:to-blue-800',
    iconBg: 'bg-blue-400/20 dark:bg-blue-500/20',
    iconColor: 'text-blue-200 dark:text-blue-100',
    footerBg: 'bg-blue-800/40 dark:bg-blue-900/50 backdrop-blur-sm',
    footerHover: 'hover:bg-blue-800/60 dark:hover:bg-blue-900/70',
  },
  success: {
    gradient: 'from-green-500 via-green-600 to-green-700 dark:from-green-600 dark:via-green-700 dark:to-green-800',
    iconBg: 'bg-green-400/20 dark:bg-green-500/20',
    iconColor: 'text-green-200 dark:text-green-100',
    footerBg: 'bg-green-800/40 dark:bg-green-900/50 backdrop-blur-sm',
    footerHover: 'hover:bg-green-800/60 dark:hover:bg-green-900/70',
  },
  warning: {
    gradient: 'from-yellow-400 via-yellow-500 to-yellow-600 dark:from-yellow-500 dark:via-yellow-600 dark:to-yellow-700',
    iconBg: 'bg-yellow-300/20 dark:bg-yellow-400/20',
    iconColor: 'text-yellow-100 dark:text-yellow-50',
    footerBg: 'bg-yellow-700/40 dark:bg-yellow-800/50 backdrop-blur-sm',
    footerHover: 'hover:bg-yellow-700/60 dark:hover:bg-yellow-800/70',
  },
  danger: {
    gradient: 'from-red-500 via-red-600 to-red-700 dark:from-red-600 dark:via-red-700 dark:to-red-800',
    iconBg: 'bg-red-400/20 dark:bg-red-500/20',
    iconColor: 'text-red-200 dark:text-red-100',
    footerBg: 'bg-red-800/40 dark:bg-red-900/50 backdrop-blur-sm',
    footerHover: 'hover:bg-red-800/60 dark:hover:bg-red-900/70',
  },
  info: {
    gradient: 'from-cyan-400 via-cyan-500 to-cyan-600 dark:from-cyan-500 dark:via-cyan-600 dark:to-cyan-700',
    iconBg: 'bg-cyan-300/20 dark:bg-cyan-400/20',
    iconColor: 'text-cyan-100 dark:text-cyan-50',
    footerBg: 'bg-cyan-700/40 dark:bg-cyan-800/50 backdrop-blur-sm',
    footerHover: 'hover:bg-cyan-700/60 dark:hover:bg-cyan-800/70',
  },
  secondary: {
    gradient: 'from-gray-500 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800',
    iconBg: 'bg-gray-400/20 dark:bg-gray-500/20',
    iconColor: 'text-gray-200 dark:text-gray-100',
    footerBg: 'bg-gray-800/40 dark:bg-gray-900/50 backdrop-blur-sm',
    footerHover: 'hover:bg-gray-800/60 dark:hover:bg-gray-900/70',
  },
};

const textColorClasses = {
  primary: 'text-white',
  success: 'text-white',
  warning: 'text-gray-900 dark:text-gray-100',
  danger: 'text-white',
  info: 'text-gray-900 dark:text-white',
  secondary: 'text-white',
};

export default function SmallBox({
  title,
  value,
  icon,
  color = 'primary',
  link = '#',
  linkText = 'More info',
  suffix = '',
}) {
  const colorConfig = gradientClasses[color] || gradientClasses.primary;
  const textColor = textColorClasses[color] || 'text-white';

  return (
    <Link
      to={link}
      className={`
        small-box group relative block rounded-xl overflow-hidden
        bg-gradient-to-br ${colorConfig.gradient}
        shadow-lg hover:shadow-xl transition-all duration-300
        transform hover:-translate-y-1
        ${textColor}
      `}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 dark:bg-white/5 backdrop-blur-[1px] pointer-events-none" />
      
      {/* Decorative gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

      {/* Main content container */}
      <div className="relative z-10 p-6 pb-4">
        {/* Top section: Value and Icon */}
        <div className="flex items-start justify-between mb-4">
          {/* Value section */}
          <div className="flex-1 min-w-0">
            <h3 className="text-4xl sm:text-5xl font-bold leading-none mb-2 drop-shadow-lg">
              {value}
              {suffix && <sup className="text-xl sm:text-2xl ml-1 font-semibold opacity-90">{suffix}</sup>}
            </h3>
            <p className="text-base sm:text-lg font-medium opacity-95 leading-tight">{title}</p>
          </div>

          {/* Icon with background shape */}
          {icon && (
            <div className={`
              relative flex-shrink-0 ml-4
              ${colorConfig.iconBg} rounded-xl p-3
              transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
            `}>
              <div className={`
                absolute inset-0 rounded-xl
                bg-gradient-to-br from-white/20 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-300
              `} />
              {typeof icon === 'string' ? (
                <i className={`bi ${icon} text-3xl sm:text-4xl ${colorConfig.iconColor} relative z-10`}></i>
              ) : (
                <svg 
                  className={`h-8 w-8 sm:h-10 sm:w-10 ${colorConfig.iconColor} relative z-10`}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {icon}
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer link section with improved separation */}
      <div className={`
        relative z-10 px-6 py-3 mt-auto
        ${colorConfig.footerBg} border-t border-white/10 dark:border-white/5
        transition-all duration-300 ${colorConfig.footerHover}
      `}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold opacity-95 group-hover:opacity-100 transition-opacity">
            {linkText}
          </span>
          <i className="bi bi-arrow-right text-base opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"></i>
        </div>
      </div>

      {/* Subtle shadow on hover */}
      <div className="absolute inset-0 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
           style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }} />
    </Link>
  );
}

// Predefined SVG paths for common icons
export const SmallBoxIcons = {
  cart: (
    <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
  ),
  chart: (
    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
  ),
  userPlus: (
    <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
  ),
  pieChart: (
    <>
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
      />
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
      />
    </>
  ),
};

