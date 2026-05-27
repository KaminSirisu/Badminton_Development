import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../component/Navbar.jsx';
import BottomNav from '../component/BottomNav.jsx';
import DashboardMatchesTable from '../component/DashboardMatchesTable.jsx';
import { useLanguage } from '../utils/LanguageProvider.jsx';
import courtBg from '../assets/banner_badminton.jpg';
import { useAuth } from '../utils/AuthContext.jsx';


const isTodayStartTime = (value) => {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()
  );
};

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { id: urlClubId } = useParams();
  const {
    getClubData,
    getDashboardMatchesByClubId,
    subscribeToDashboardMatches,
  } = useAuth();

  const [matches, setMatches] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [activeClubId, setActiveClubId] = useState(urlClubId || null);
  const [notifiedMatches, setNotifiedMatches] = useState(new Set());
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const matchesCacheRef = useRef({});

  useEffect(() => {
    if (urlClubId) {
      setActiveClubId(urlClubId);
    }
  }, [urlClubId]);

  // Fetch all clubs to build the tab bar
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const data = await getClubData();
        setClubs(data);
        // If no URL club ID, default to the first club
        if (!urlClubId && data.length > 0) {
          setActiveClubId(data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch clubs:', e);
      }
    };
    fetchClubs();
  }, [getClubData, urlClubId]);

  // Fetch & subscribe to matches whenever active club changes
  useEffect(() => {
    if (!activeClubId) return;

    let isActive = true;
    let unsubscribe = () => {};
    const cachedMatches = matchesCacheRef.current[activeClubId];

    if (cachedMatches) {
      setMatches(cachedMatches);
    }

    const setupDashboardData = async () => {
      try {
        setIsLoadingMatches(true);
        const clubMatches = await getDashboardMatchesByClubId(activeClubId);
        if (!isActive) return;

        matchesCacheRef.current[activeClubId] = clubMatches;
        setMatches(clubMatches);

        unsubscribe = subscribeToDashboardMatches(activeClubId, ({ events, match, payload }) => {
          if (!isActive) return;
          if (!isTodayStartTime(match.startTime)) return;

          if (events.some((eventName) => eventName.includes('.create'))) {
            setMatches((prev) => {
              const nextMatches = prev.some((item) => item.id === match.id)
                ? prev
                : [...prev, match];
              matchesCacheRef.current[activeClubId] = nextMatches;
              return nextMatches;
            });
          } else if (events.some((eventName) => eventName.includes('.update'))) {
            setMatches((prev) => {
              const nextMatches = prev.map((item) => (item.id === match.id ? match : item));
              matchesCacheRef.current[activeClubId] = nextMatches;
              return nextMatches;
            });
          } else if (events.some((eventName) => eventName.includes('.delete'))) {
            setMatches((prev) => {
              const nextMatches = prev.filter((item) => item.id !== payload.$id);
              matchesCacheRef.current[activeClubId] = nextMatches;
              return nextMatches;
            });
          }
        });
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
      } finally {
        if (isActive) {
          setIsLoadingMatches(false);
        }
      }
    };

    setupDashboardData();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [activeClubId, getDashboardMatchesByClubId, subscribeToDashboardMatches]);

  const activeClub = clubs.find((club) => club.id === activeClubId) || null;
  const clubName = activeClub?.clubName || '';

  const toggleNotify = (matchId) => {
    setNotifiedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col bg-neutral-100 min-h-screen">
      <Navbar />

      {/* Back button */}
      {/* <button
        onClick={() => navigate(-1)}
        className="top-[68px] left-4 z-50 fixed bg-white shadow-lg hover:shadow-xl border border-gray-200 rounded-full p-0.5 transition"
      >
        <ArrowLeft className="w-7 md:w-8 h-7 md:h-8 text-blue-600 cursor-pointer" />
      </button> */}

      <div className="flex-grow pb-24 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="mx-auto max-w-2xl">

          {/* Banner */}
          <div
            className="relative shadow-xl mb-1 rounded-2xl overflow-hidden"
            style={{
              backgroundImage: `url(${courtBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
            }}
          >
            <div className="absolute inset-0 bg-black/65" />
            <button
              onClick={() => navigate(-1)}
              className="relative z-10 inline-flex items-center gap-2 bg-white/12 hover:bg-white/18 mt-3 sm:mt-5 px-3 rounded-full text-sm text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('Back to Home')}
            </button>
            <div className="relative px-5 pb-3 sm:px-8 sm:pt-2 sm:pb-3 text-white">
              <p className="text-[10px] text-gray-400 sm:text-[11px] uppercase tracking-wider">
                {today}
              </p>
              <h1 className="font-extrabold text-base sm:text-2xl uppercase leading-tight tracking-wide mt-0.5">
                {clubName ? `${clubName} - ${t('Today\'s Scores')}` : t('Today\'s Scores')}
              </h1>
            </div>
          </div>

          {/* Club Tab Selector */}
          {clubs.length > 1 && (
            <div className="bg-gray-100 rounded-xl p-1 flex gap-1 mb-2 shadow-inner">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => setActiveClubId(club.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    activeClubId === club.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {club.clubName}
                </button>
              ))}
            </div>
          )}

          {/* Match Table */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
            {isLoadingMatches && (
              <div className="bg-blue-50 px-4 py-2 border-blue-100 border-b text-blue-700 text-xs sm:text-sm">
                Refreshing matches...
              </div>
            )}
            <DashboardMatchesTable
              matches={matches}
              notifiedMatches={notifiedMatches}
              onToggleNotify={toggleNotify}
            />
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
