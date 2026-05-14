import { useEffect, useState } from 'react';
import Navbar from '../component/Navbar';
import { useAuth } from '../utils/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Star, Edit, Trash2, CalendarClockIcon, Clipboard } from 'lucide-react';
import { useLanguage } from '../utils/LanguageProvider.jsx';
import DragDropUpload from '../component/DragDropUpload.jsx';
import Footer from '../component/Footer.jsx';
import { toast } from 'react-hot-toast';

const Home = () => {
  const { t } = useLanguage();

  const { getAdminNameAcc, 
          getUserName, 
          getClubData, 
          addPlayer, 
          getPlayers, 
          updatedPlayers, 
          deletePlayer, 
          createCheckIn,
          getCheckIn,
          clearCheckIns,
          uploadSlipToAppwrite,
          
        }  = useAuth();

 
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('All');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showUpdatePlayerModal, setShowUpdatePlayerModal] = useState(false);

  const [showCheckInPlayerModal, setShowCheckInPlayerModal] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkedInClubs, setCheckedInClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [openTimes, setOpenTimes] = useState({});
  const [isAdminCheckInModalOpen, setIsAdminCheckInModalOpen] = useState(false);


  const [showUploadSlipModal, setShowUploadSlipModal] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [uploadingSlipClub, setUploadingSlipClub] = useState(null);


  const [editingPlayer, setEditingPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [admin, setAdmin] = useState([]);
  const [club, setClub] = useState([]);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    skillLevel: 'VB',
    clubs: [],
  });


  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = skillFilter === 'All' || player.skillLevel === skillFilter;
    return matchesSearch && matchesSkill;
  });

  const addNewPlayer = async () => {
    const success = await addPlayer(newPlayer);
    if (success) {
      const updated = await getPlayers();
      setPlayers(updated);
      setShowAddPlayerModal(false);
      setNewPlayer({
        name: '',
        skillLevel: '',
        clubs: [],
      });
      // console.log("Result", updated);
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
        // Persist to Appwrite
        await updatedPlayers(editingPlayer.id, {
            name: editingPlayer.name,
            skillLevel: editingPlayer.skillLevel,
            club: editingPlayer.club, // ensure this matches your Appwrite field
        });

        // Update local state immediately
        setPlayers(prev =>
            prev.map(player =>
                player.id === editingPlayer.id ? editingPlayer : player
            )
        );

        setShowUpdatePlayerModal(false);
        console.log(`Player ${editingPlayer.id} updated successfully.`);
    } catch (error) {
        console.error("Failed to update player:", error);
    }
  }

  const togglePlayerClub = async (playerId, clubId) => {
    // Update local state immediately for instant toggle feedback
    setPlayers(prevPlayers =>
      prevPlayers.map(player => {
        if (player.id === playerId) {
          const isInClub = player.club?.includes(clubId);
          return {
            ...player,
            club: isInClub
              ? player.club.filter(id => id !== clubId)
              : [...player.club, clubId],
          };
        }
        return player;
      })
    );

    // Find the current player data
    const player = players.find(p => p.id === playerId);
    if (!player) {
      console.error("Player not found:", playerId);
      return;
    }

    // Compute the updated club list
    // If Player in the Club yet
    const isInClub = player.club?.includes(clubId);
    // True: Remove Club from Player, False: Add Club to Player
    const updatedClubList = isInClub
      ? player.club.filter(id => id !== clubId)
      : [...player.club, clubId];

    // Persist to Appwrite
    try {
      await updatedPlayers(playerId, {
        name: player.name,
        skillLevel: player.skillLevel,
        club: updatedClubList, // replace 'clubs' with 'club' if your DB field is 'club'
      });
      console.log(`Updated player ${playerId} clubs in Appwrite.`);
    } catch (error) {
      console.error("Error updating player clubs in Appwrite:", error);
    }
    
  };

  const getClubMemberCount = (clubId) => {
    return players.filter(player => player.club.includes(clubId)).length;
  };

  const generateTimeSlots = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const slots = [];
    const date = new Date();

    date.setHours(hours, minutes, 0);

    for (let i = 0; i < 4; i++) {
      const slotTime = date.toTimeString().slice(0, 5);
      slots.push(slotTime);
      date.setMinutes(date.getMinutes() + 30);
    }

    return slots;
  }

  const handleCheckInClick = (clubData) => {
    setSelectedClub(clubData);
    setShowCheckInPlayerModal(true);
  };

  const handleCheckInSubmit = async (Name) => {
    if (!selectedClub || !checkInTime) return;

    try {
      await createCheckIn({
        name: Name,
        clubId: selectedClub.id,
        checkInTime,
      });
      setShowCheckInPlayerModal(false);
      setCheckedInClubs((prev) => [...prev, selectedClub.id]);
      setCheckInTime("");
    } catch (error) {
      alert('Failed to check-in.');
    }
  };

  const groupedCheckIns = checkIns.reduce((acc, item) => {
    if (!acc[item.checkInTime]) acc[item.checkInTime] = [];
    acc[item.checkInTime].push(item);
    return acc;
  }, {});

  const sortedTimes = Object.keys(groupedCheckIns).sort((a, b) => {
    const timeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    return timeToMinutes(a) - timeToMinutes(b);
  });

  const toggleTimeGroup = (time) => {
    setOpenTimes(prev => ({ ...prev, [time]: !prev[time] }));
  };




  const handleClearCheckIns = async () => {
    const confirmed = window.confirm("Are you sure you want to clear all check-ins?");
    if (confirmed) {
      await clearCheckIns();
      setCheckIns([]);
      toast.success("Clear Check-Ins successed")
    } else {
      return;
    }

    // Your logic to delete all check-ins
  };


  const handleOpenModal = async (club) => {
    setSelectedClub(club);
    setIsAdminCheckInModalOpen(true);

    const checkInData = await getCheckIn(club); // ✅ Make sure `club` is not undefined
    setCheckIns(checkInData);
  };


  const IOSToggle = ({ isOn, onToggle, clubColor }) => (
    <div 
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-1000 ease-in-out cursor-pointer ${
        isOn ? clubColor : 'bg-gray-200'
      }`}
      onClick={onToggle}
    >
      <div
        className={`inline-block h-4 w-4 transform will-change-transform rounded-full bg-white shadow-lg transition-transform duration-1000 ease-in-out ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  );

  const bgColors = [
    'bg-blue-600',
    'bg-green-600',
    'bg-yellow-600',
    'bg-orange-600',
    'bg-red-600',
    'bg-pink-600',
    'bg-gray-600',
    'bg-indigo-600',
  ];

  const borderColors = [
    'border-t-blue-600',
    'border-t-green-600',
    'border-t-yellow-600',
    'border-t-orange-600',
    'border-t-red-600',
    'border-t-pink-600',
    'border-t-gray-600',
    'border-t-indigo-600',
  ]

  const textColors = [
    'text-blue-600',
    'text-green-600',
    'text-yellow-600',
    'text-orange-600',
    'text-red-600',
    'text-pink-600',
    'text-gray-600',
    'text-indigo-600',
  ]

  const getSkillLevelColor = (skill) => {
    switch(skill) {
      case 'VB': return 'bg-green-600 text-green-100';
      case 'BG': return 'bg-yellow-600 text-yellow-100';
      case 'N-': return 'bg-orange-600 text-orange-100';
      case 'N': return 'bg-red-600 text-red-100';
      case 'S': return 'bg-blue-600 text-blue-100';
      case 'P': return 'bg-purple-600 text-purple-100';
      default: return 'bg-gray-400 text-gray-100';
    }
  };

  useEffect(() => {
    const loadPlayers = async () => {
      const data = await getPlayers();
      setPlayers(data);
      
    };
    loadPlayers();
    
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      const [name, admin] = await Promise.all([
        getUserName(),
        getAdminNameAcc()
      ]);
      setName(name);
      setAdmin(admin);
    };
    fetchData();
  }, []);

  const fetchClubs = async () => {
    const data = await getClubData();
    setClub(data);
  };

  useEffect(() => {
    fetchClubs();
  }, [])


  return (
    <div className='flex flex-col bg-neutral-100 w-full min-h-screen overflow-auto'>
      <Navbar />
      <div className='flex-grow'>
        {/* Admin Site */}
        {admin.includes("admin") ? (
          <div className='mx-5 sm:mx-20 mt-5 sm:mt-10'>
            <h1 className='head-text'>
              {t('welcome')}, <b>{t('admin')}</b> {name}
            </h1>
            <h2 className='text-[12px] text-gray-500'>
              {t('manage your badminton clubs and players')}
            </h2>

            {/* Clubs List */}
            <div className="gap-2 md:gap-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 mx-2 md:mx-5 mt-5">
              {club.map((club, index) => {
                const color = borderColors[index % borderColors.length];
                const colors = textColors[index % textColors.length];
                const colorss = bgColors[index % bgColors.length];
                return (
                  <div
                    key={club.id}
                    className={`relative bg-white p-4 rounded-xl shadow-md px-3 py-3 md:px-4 md:py-4 ${color} border-t-4 flex flex-col justify-between`}
                  >
                    {/* Top Row: Club name & Buttons */}
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-base md:text-lg ${colors}`}>{club.clubName}</h3>
                      <div className="top-4 right-3 absolute flex flex-col items-end gap-2">
                        {/* Matchmaking Button */}
                        <Link
                          to={`/matchmaking/${club.id}`}
                          className={`${colorss} hover:bg-gray-200 shadow-md px-3 py-2 rounded-2xl font-semibold text-white text-xs md:text-sm transition`}
                        >
                          {t('matchmaking')}
                        </Link>
                        {/* Check-in Button */}
                        <button
                          onClick={() => handleOpenModal(club)}
                          className="bg-neutral-100 shadow-md px-3 py-1 border rounded-2xl font-medium text-gray-600 text-xs md:text-sm transition"
                        >
                          {t('checked-In')}
                        </button>
                      </div>
                    </div>
                    {/* Days and Time */}
                    <div className="mt-1 text-gray-500 text-sm md:text-base">
                      <div>
                        {club.playingDay
                          .split(',')
                          .map(day => t(day.trim()))
                          .join(', ')}
                      </div>
                      <div>{club.startTime}-{club.endTime}</div>
                    </div>
                    {/* Bottom Row: Member count */}
                    <div className="flex items-center mt-auto pt-1 md:pt-3">
                      <Users className="mr-1 w-4 md:w-5 h-4 md:h-5" />
                      <span className="text-md">{getClubMemberCount(club.id)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {isAdminCheckInModalOpen && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-4">
                <div className="relative bg-white shadow-xl p-6 rounded-2xl w-full max-w-md">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-gray-800 text-xl leading-none">
                        {t('Check-In Players')}
                      </h3>
                      {checkIns.length > 0 && (
                        <button
                          onClick={handleClearCheckIns}
                          className="inline-flex items-center bg-red-600 hover:bg-red-700 shadow-md px-2.5 py-[8px] rounded-lg w-max font-medium text-[12px] text-white transition"
                          style={{ lineHeight: 1 }}
                        >
                          {t('Clear All')}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setIsAdminCheckInModalOpen(false)}
                      className="text-gray-500 hover:text-gray-800 text-3xl transition"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Divider */}
                  <hr className="mb-3" />
                  {/* Check-in List */}
                  {checkIns.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                      {sortedTimes.map(time => (
                        <div key={time} className="bg-white mb-2 border rounded-lg">
                          <button
                            className="flex justify-between px-4 py-2 border border-gray-200 rounded-lg w-full font-semibold"
                            onClick={() => toggleTimeGroup(time)}
                          >
                            <span>
                              {time} / {t('Total')}: {groupedCheckIns[time].length} {t('players')}
                            </span>
                            <span
                              className={`transform transition-transform duration-200 ${
                                openTimes[time] ? 'rotate-90' : ''
                              }`}
                            >
                              ▶
                            </span>
                          </button>
                          {openTimes[time] && (
                            <ul className="space-y-1 px-6 py-2">
                              {groupedCheckIns[time].map(item => (
                                <li key={item.$id} className="flex justify-between text-gray-700 text-sm">
                                  <span>{item.name}</span>
                                  <span className="font-semibold text-green-600">✓</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-gray-500 text-center">{t('No check-ins yet for today')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Filter Players */}
            <div className=''>
              <div className="flex md:flex-row flex-col justify-between md:justify-center items-center gap-4 mt-5 md:mt-10 mb-6">
                <div className="flex gap-2 md:gap-4">
                  <div className="relative w-[220px] lg:w-[260px]">
                    <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
                    <input
                      type="text"
                      placeholder={t('search players...')}
                      className="py-1 pr-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full placeholder:text-sm placeholder:md:text-base"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  >
                    <option value="All">{t('all')}</option>
                    <option value="VB">VB</option>
                    <option value="BG">BG</option>
                    <option value="N-">N-</option>
                    <option value="N">N</option>
                    <option value="S">S</option>
                    <option value="P">P</option>
                  </select>
                </div>
                <div className='flex flex-row items-center gap-3'>
                  <span className="text-gray-600 text-xs md:text-sm">
                    {filteredPlayers.length} of {players.length} {t('players')}
                  </span>
                  <button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="flex justify-end items-center gap-2 bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg text-white transition-colors"
                  >
                    <Plus className="w-3 md:w-4 h-3 md:h-4" />
                    <h1 className='text-sm md:text-base'>{t('add player')}</h1>
                  </button>
                </div>
              </div>
            </div>

            {/* Add Player Modal */}
            {showAddPlayerModal && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h3 className="mb-4 font-semibold text-lg">{t('add new player')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium text-gray-700 text-sm">{t('name')}</label>
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={newPlayer.name}
                        onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                        placeholder={t("enter player name")}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium text-gray-700 text-sm">{t('skill level')}</label>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={newPlayer.skillLevel}
                        onChange={(e) => setNewPlayer({...newPlayer, skillLevel: e.target.value})}
                      >
                        <option value="VB">VB</option>
                        <option value="BG">BG</option>
                        <option value="N-">N-</option>
                        <option value="N">N</option>
                        <option value="S">S</option>
                        <option value="P">P</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-gray-700 text-sm">{t('playing club')}</label>
                      <div className="space-y-2">
                        {club.map(club => (
                          <label key={club.id} className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={newPlayer.clubs.includes(club.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewPlayer({
                                    ...newPlayer,
                                    clubs: [...newPlayer.clubs, club.id]
                                  });
                                } else {
                                  setNewPlayer({
                                    ...newPlayer,
                                    clubs: newPlayer.clubs.filter(id => id !== club.id)
                                  });
                                }
                              }}
                            />
                            <span className={`w-3 h-3 rounded-full bg-blue-500 mr-2`}></span>
                            {club.clubName}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowAddPlayerModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={addNewPlayer}
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                      {t('addPlayer')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Players Table */}
            <div className="bg-white shadow-md mx-auto my-8 px-0 border border-gray-300 rounded-lg max-w-6xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className='rounded-t-lg'>
                      <th className="px-6 py-3 font-medium text-gray-600 text-xs text-left uppercase tracking-wider">
                        {t('player')}
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-600 text-xs text-left uppercase tracking-wider">
                        {t('skill level')}
                      </th>
                      {club.map(club => (
                        <th key={club.id} className="px-6 py-3 font-medium text-gray-600 text-xs text-center uppercase tracking-wider">
                          {club.clubName}
                        </th>
                      ))}
                      <th className="px-6 py-3 font-medium text-gray-600 text-xs text-center uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlayers.map(player => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{player.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSkillLevelColor(player.skillLevel)}`}>
                            {player.skillLevel}
                          </span>
                        </td>
                        {club.map((club, index) => {
                          const color = bgColors[index % bgColors.length];
                          return (
                            <td key={club.id} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex justify-center">
                                <IOSToggle
                                  isOn={player.club.includes(club.id)}
                                  onToggle={() => togglePlayerClub(player.id, club.id)}
                                  clubColor={color}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex justify-center gap-2">
                            <button 
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => {
                                setEditingPlayer(player); 
                                setShowUpdatePlayerModal(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={async () => {
                                if (window.confirm(t("Are you sure you want to delete this player?"))) {
                                  await deletePlayer(player.id, async () => {
                                    const updated = await getPlayers();
                                    setPlayers(updated);
                                  });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Update Player Modal */}
            {showUpdatePlayerModal && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h3 className="mb-4 font-semibold text-lg">{t('editPlayer')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium text-gray-700 text-sm">{t('name')}</label>
                      <input
                        type="text"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={editingPlayer.name}
                        onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                        placeholder="Enter player name"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium text-gray-700 text-sm">{t('skill level')}</label>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={editingPlayer.skillLevel}
                        onChange={(e) => setEditingPlayer({...editingPlayer, skillLevel: e.target.value})}
                      >
                        <option value="VB">VB</option>
                        <option value="BG">BG</option>
                        <option value="N-">N-</option>
                        <option value="N">N</option>
                        <option value="S">S</option>
                        <option value="P">P</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowUpdatePlayerModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdatePlayer}
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // User Site
          <div className='mx-5 sm:mx-20 mt-5 sm:mt-10'>
            <h1 className='head-text'>{t('welcome')}, {name}</h1>
            <h2 className='text-[11px] text-gray-500'>{t('Check in the game — your club is waiting.')}</h2>
            {/* Clubs List */}
            <div className="gap-4 md:gap-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 mx-2 md:mx-5 mt-5">
              {club.map((club, index) => {
                const color = borderColors[index % borderColors.length];
                const colors = textColors[index % textColors.length];
                const colorss = bgColors[index % bgColors.length];
                return (
                  <div
                    key={club.id}
                    className={`relative bg-white p-4 rounded-xl shadow-md px-3 py-3 md:px-4 md:py-4 ${color} border-t-4 flex flex-col justify-between`}
                  >
                    {/* Top Row: Club name & Buttons */}
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-base md:text-lg ${colors}`}>{club.clubName}</h3>
                      <div className='top-4 right-3 absolute flex flex-col items-end gap-2'>
                        {checkedInClubs.includes(club.id) ? (
                          <span className={`font-semibold text-gray-600 text-sm md:text-base`}>✅ {t('Checked In')}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedClub(club);
                              setShowCheckInPlayerModal(true);
                            }}
                            className={`${colorss} drop-shadow-md px-3 py-2 rounded-xl flex flex-row items-center gap-2`}
                          >
                            <CalendarClockIcon className="text-white" size={12}/>
                            <h1 className="font-light text-[12px] text-white md:text-sm">{t('check-In')}</h1>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setUploadingSlipClub(club);
                            setShowUploadSlipModal(true);
                          }} 
                          className="flex flex-row items-center gap-2 bg-neutral-100 drop-shadow-md px-3 py-2 rounded-xl"
                        >
                          <Clipboard size={12}/>
                          <h1 className="font-semibold text-[12px] text-gray-600 md:text-sm">{t('money slip')}</h1>
                        </button>
                      </div>
                    </div>
                    {/* Days and Time */}
                    <div className="mt-1 text-gray-500 text-sm md:text-base">
                      <div>
                        {club.playingDay
                          .split(',')
                          .map(day => t(day.trim()))
                          .join(', ')}
                      </div>
                      <div>{club.startTime}-{club.endTime}</div>
                    </div>
                    {/* Bottom Row: Member count */}
                    <div className="flex items-center mt-auto pt-1 md:pt-3">
                      <Users className="mr-1 w-4 md:w-5 h-4 md:h-5" />
                      <span className="text-md">{getClubMemberCount(club.id)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Check-in Player Modal */}
            {showCheckInPlayerModal && selectedClub && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h3 className="mb-4 font-semibold text-lg">{t('check-In')}</h3>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                  >
                    <option value="">{t('Select time')}</option>
                    {generateTimeSlots(selectedClub.startTime).map((time, index) => (
                      <option key={index} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => handleCheckInClick(!club)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={() => handleCheckInSubmit(name)}
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white transition-colors"
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showUploadSlipModal && uploadingSlipClub && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h3 className="mb-4 font-semibold text-lg">
                    {t('Upload Slip')} — <span className="text-blue-600">{uploadingSlipClub.clubName}</span>
                  </h3>
                  {/* ⬇️ NEW: Drag-and-drop file input */}
                  <DragDropUpload
                    onFileSelected={(file) => setSlipFile(file)}
                  />
                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowUploadSlipModal(false);
                        setSlipFile(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={async () => {
                        if (!slipFile) return toast.error(t("Please upload a file"));
                        try {
                          await uploadSlipToAppwrite({
                            file: slipFile,
                            clubId: uploadingSlipClub.id,
                            userName: name,
                          });
                          toast.success(t("Slip uploaded successfully"));
                          setShowUploadSlipModal(false);
                          setSlipFile(null);
                        } catch (error) {
                          toast.error(t("Upload failed"));
                          console.error(error);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition"
                    >
                      {t('upload')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )

}

export default Home