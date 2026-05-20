import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react";
import Navbar from '../component/Navbar';
import Footer from '../component/Footer';
import DashboardMatchesTable from '../component/DashboardMatchesTable';
import courtBg from '../assets/banner_badminton.jpg';
import Badminton from '../assets/badminton.png';
import { useAuth } from '../utils/AuthContext';

const Dashboard = () => {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
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
    <div className="flex flex-col bg-neutral-100 min-h-screen">
      <Navbar />
      <div className="flex-grow mt-2 sm:mt-4 mb-10 px-4 sm:px-10">
        <button
          onClick={() => navigate(-1)}
          className="top-17 left-4 z-50 fixed bg-white shadow-lg hover:shadow-xl border border-gray-200 rounded-full transition"
        >
          <ArrowLeft className="w-7 md:w-8 h-7 md:h-8 text-blue-600 cursor-pointer" />
        </button>
        <div className="mx-auto max-w-5xl">
          <div
            className="relative shadow-xl mb-2 sm:mb-4 rounded-2xl overflow-hidden"
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
                <span className="font-bold text-[10px] text-gray-300 sm:text-xs uppercase tracking-widest">
                  {clubName || 'Badminton Club'}
                </span>
              </div>
              <h1 className="font-extrabold text-base sm:text-2xl uppercase leading-tight tracking-wide">
                {clubName ? `${clubName} - Today's Scores` : "Today's Scores"}
              </h1>
              <p className="mt-1 text-[10px] text-gray-400 sm:text-[11px] uppercase tracking-wider">
                Today&apos;s Schedule &amp; Results &nbsp;·&nbsp; {today}
              </p>
            </div>
          </div>

          <div className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
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
