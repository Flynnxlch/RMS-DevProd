import { Link } from 'react-router-dom';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm bg-white dark:bg-[var(--color-card-bg-dark)] rounded px-3 py-2 shadow-sm border border-gray-200 dark:border-[var(--color-card-border-dark)] transition-colors">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li 
              key={index}
              className={`flex items-center ${isLast ? 'text-gray-600 dark:text-gray-300' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {!isLast ? (
                <>
                  <Link 
                    to={item.path || '#'} 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline no-underline transition-colors"
                  >
                    {item.label}
                  </Link>
                  <span className="text-gray-400 dark:text-gray-500 mx-2">/</span>
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

