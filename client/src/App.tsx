import MainRoutes from './routes/MainRoutes';
import { ThemeProvider } from './contexts/ThemeContext';
import { StoreAppearanceProvider } from './contexts/StoreAppereanceContext';

function App() {
  return (
    <StoreAppearanceProvider>
      <ThemeProvider>
        <div className="bg-gray-50 dark:bg-[#05080c] transition-colors duration-500 min-h-screen text-gray-900 dark:text-white font-sans">

        <MainRoutes />
      </div>
    </ThemeProvider>
    </StoreAppearanceProvider>
  );
}

export default App;
