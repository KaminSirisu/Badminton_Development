import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../component/Navbar';
import Footer from '../component/Footer';
import DashboardMatchesTable from '../component/DashboardMatchesTable';
import courtBg from '../assets/tennis-court.png';
import Badminton from '../assets/badminton.png';
import { useAuth } from '../utils/AuthContext';

const Dashboard = () => {
  const { id: clubId } = useParams();
  const { getClubById, getDashboardMatchesByClubId, subscribeToDashboardMatches } = useAuth();
  const [matches, setMatches] = useState([]);
  const [clubName, setClubName] = useState('');
  const [notifiedMatches, setNotifiedMatches] = useState(new Set());

  useEffect(() => {
    let isActive = true;

    const fetchDashboardData = async () => {
      try {
        const [club, clubMatches] = await Promise.all([
          getClubById(clubId),
          getDashboardMatchesByClubId(clubId),
        ]);

        if (!isActive) return;
        setClubName(club?.clubName || '');
        setMatches(clubMatches);
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
      }
    };

    fetchDashboardData();

    const unsubscribe = subscribeToDashboardMatches(clubId, ({ events, match, payload }) => {
      if (!isActive) return;

      if (events.some((eventName) => eventName.includes('.create'))) {
        setMatches((prev) => [...prev, match]);
      } else if (events.some((eventName) => eventName.includes('.update'))) {
        setMatches((prev) => prev.map((item) => (item.id === match.id ? match : item)));
      } else if (events.some((eventName) => eventName.includes('.delete'))) {
        setMatches((prev) => prev.filter((item) => item.id !== payload.$id));
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [clubId]);

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
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Navbar />
      <div className="flex-grow px-4 sm:px-10 mt-6 mb-10">
        <div className="max-w-5xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden mb-6 shadow-xl"
            style={{
              backgroundImage: `url(${courtBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          >
            <div className="absolute inset-0 bg-black/65" />
            <div className="relative px-5 sm:px-8 py-5 sm:py-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <img src={Badminton} alt="" className="w-5 h-5" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-300">
                  {clubName || 'Badminton Club'}
                </span>
              </div>
              <h1 className="font-extrabold text-base sm:text-2xl uppercase tracking-wide leading-tight">
                {clubName ? `${clubName} - Today's Scores` : "Today's Scores"}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 uppercase tracking-wider">
                Today&apos;s Schedule &amp; Results &nbsp;·&nbsp; {today}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <DashboardMatchesTable
              matches={matches}
              notifiedMatches={notifiedMatches}
              onToggleNotify={toggleNotify}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
