import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../component/Navbar';
import BottomNav from '../component/BottomNav';
import DashboardMatchesTable from '../component/DashboardMatchesTable';
import courtBg from '../assets/banner_badminton.jpg';
import { useAuth } from '../utils/AuthContext';

const Dashboard = () => {
  const { id: urlClubId } = useParams();
  const {
    getClubById,
    getClubData,
    getDashboardMatchesByClubId,
    subscribeToDashboardMatches,
  } = useAuth();

  const [matches, setMatches] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [activeClubId, setActiveClubId] = useState(urlClubId || null);
  const [clubName, setClubName] = useState('');
  const [notifiedMatches, setNotifiedMatches] = useState(new Set());

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
    setMatches([]);

    const setupDashboardData = async () => {
      try {
        const [club, clubMatches] = await Promise.all([
          getClubById(activeClubId),
          getDashboardMatchesByClubId(activeClubId),
        ]);
        if (!isActive) return;

        setClubName(club?.clubName || '');
        setMatches(clubMatches);

        unsubscribe = subscribeToDashboardMatches(activeClubId, ({ events, match, payload }) => {
          if (!isActive) return;

          if (events.some((eventName) => eventName.includes('.create'))) {
            setMatches((prev) => (
              prev.some((item) => item.id === match.id)
                ? prev
                : [...prev, match]
            ));
          } else if (events.some((eventName) => eventName.includes('.update'))) {
            setMatches((prev) => prev.map((item) => (item.id === match.id ? match : item)));
          } else if (events.some((eventName) => eventName.includes('.delete'))) {
            setMatches((prev) => prev.filter((item) => item.id !== payload.$id));
          }
        });
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
      }
    };

    setupDashboardData();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [activeClubId, getClubById, getDashboardMatchesByClubId, subscribeToDashboardMatches]);

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
            <div className="relative px-5 sm:px-8 py-3 sm:py-6 text-white">
              <p className="text-[10px] text-gray-400 sm:text-[11px] uppercase tracking-wider">
                {today}
              </p>
              <h1 className="font-extrabold text-base sm:text-2xl uppercase leading-tight tracking-wide">
                {clubName ? `${clubName} - Today's Scores` : "Today's Scores"}
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
