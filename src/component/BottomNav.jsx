import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../utils/LanguageProvider.jsx';

const BottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isScore =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/matchmaking') ||
    location.pathname.startsWith('/summary');
  const isProfile = location.pathname === '/setting';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center py-2 px-4 max-w-lg mx-auto">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 py-1 px-5 transition-colors ${
            isHome ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <span className="text-[22px] leading-none">🏠</span>
          <span className="text-[11px] font-medium mt-0.5">{t('home')}</span>
        </Link>

        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-0.5 py-1 px-5 transition-colors ${
            isScore ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <span className="text-[22px] leading-none">📊</span>
          <span className="text-[11px] font-medium mt-0.5">{t('MatchStatus')}</span>
        </Link>

        <Link
          to="/setting"
          className={`flex flex-col items-center gap-0.5 py-1 px-5 transition-colors ${
            isProfile ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <span className="text-[22px] leading-none">👤</span>
          <span className="text-[11px] font-medium mt-0.5">{t('profile')}</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
