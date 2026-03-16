import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppWrapper({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-body-bg)] dark:bg-[var(--color-body-bg-dark)] transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        {/* Header */}
        <Header />

        {/* Main content */}
        <main className="flex-1 p-6 bg-[var(--color-body-bg)] dark:bg-[var(--color-body-bg-dark)] transition-colors duration-300">
          <div className="container-fluid">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

