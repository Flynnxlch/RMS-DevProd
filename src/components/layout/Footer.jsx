export default function Footer() {
  return (
    <footer className="py-4 px-6 bg-white dark:bg-[var(--color-card-bg-dark)] border-t border-gray-200 dark:border-[var(--color-card-border-dark)] text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-gray-700 dark:text-gray-200">
            Still in development
          </strong>{' '}
          <span className="text-gray-500 dark:text-gray-400">Proceed Carefully</span>
        </div>
        <div className="hidden sm:block text-gray-400 dark:text-gray-500">
          Frontend Only
        </div>
      </div>
    </footer>
  );
}

