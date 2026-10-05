import MainRoutes from './routes/MainRoutes';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="bg-gray-50 dark:bg-[#05080c] transition-colors duration-500 min-h-screen text-gray-900 dark:text-white font-sans">

        <MainRoutes />
      </div>
    </ThemeProvider>
  );
}

export default App;