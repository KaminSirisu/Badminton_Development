import { Bell, Trophy } from 'lucide-react';
import { useLanguage } from '../utils/LanguageProvider.jsx';

const parseSetScores = (matchScore) => {
  if (!matchScore) return [];
  return matchScore.split(',').map((score) => score.trim()).filter(Boolean);
};

const computeSetScore = (sets) => {
  let teamA = 0;
  let teamB = 0;

  for (const set of sets) {
    const [a, b] = set.split('-').map(Number);
    if (!isNaN(a) && !isNaN(b)) {
      if (a > b) teamA++;
      else if (b > a) teamB++;
    }
  }

  return { teamA, teamB };
};

const MatchRow = ({ match, isLast, isNotified, onToggleNotify }) => {
  const { t } = useLanguage();
  const sets = parseSetScores(match.matchScore);
  const { teamA: teamAWins, teamB: teamBWins } = computeSetScore(sets);
  const teamAPlayers = match.players.slice(0, 2);
  const teamBPlayers = match.players.slice(2, 4);
  const teamALabel = teamAPlayers.length > 0 ? teamAPlayers.join(' / ') : t('TBD');
  const teamBLabel = teamBPlayers.length > 0 ? teamBPlayers.join(' / ') : t('TBD');

  const isWaiting = match.status === 'WAITING';
  const isPlaying = match.status === 'PLAYING';
  const isFinished = match.status === 'FINISHED';
  const statusLabel = isWaiting
    ? t('WAITING')
    : isPlaying
      ? t('PLAYING')
      : isFinished
        ? t('FINISHED')
        : match.status;

  const winLower = (match.winningTeam || '').toLowerCase();
  const teamAWon =
    isFinished &&
    (winLower.includes('team a') ||
      winLower === 'a' ||
      (!match.winningTeam && teamAWins > teamBWins));
  const teamBWon =
    isFinished &&
    (winLower.includes('team b') ||
      winLower === 'b' ||
      (!match.winningTeam && teamBWins > teamAWins));

  return (
    <div
      className={`grid grid-cols-[84px_1fr_84px] sm:grid-cols-[138px_1fr_156px] px-3 sm:px-5 py-0.5 sm:py-1.5 gap-1.5 sm:gap-3 items-center ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      <div className="flex flex-col items-center text-center">
        {isWaiting ? (
          <>
            <div className="font-semibold text-[8px] text-gray-400 sm:text-[9px] uppercase tracking-wider">
              {t('UPCOMING')}
            </div>
            {/* <div className="mt-0.5 font-bold text-gray-800 text-sm sm:text-xl leading-tight">
              TBD
            </div> */}
            <span className="bg-gray-200 mt-1 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold text-[8px] text-gray-600 sm:text-[9px] uppercase tracking-wide">
              {t('WAITING')}
            </span>
          </>
        ) : (
          <>
            {isPlaying && (
              <div className="flex items-center gap-1.5 bg-red-50 shadow-[0_0_18px_rgba(239,68,68,0.18)] mt-0.5 px-1.5 py-0.5 rounded-full font-bold text-[9px] text-red-500 sm:text-[10px]">
                <span className="inline-flex relative justify-center items-center w-2.5 sm:w-3 h-2.5 sm:h-3">
                  <span className="inline-flex absolute bg-red-400 opacity-75 rounded-full w-full h-full animate-ping" />
                <span className="inline-flex relative bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.95)] rounded-full w-1.5 sm:w-2 h-1.5 sm:h-2" />
                </span>
                {/* {t('LIVE')} */}
                {statusLabel}
              </div>
            )}
            <div className="flex font-extrabold text-gray-800 text-md sm:text-xl text-center leading-none">
              {match.totalTime ?? '-'}&apos;
            </div>
            {/* {isFinished && (
              <span
                className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[7px] sm:text-[8px] font-semibold uppercase tracking-wide bg-gray-800 text-white
                }`}
              >
                {statusLabel}
              </span>
            )} */}
            {/* <span
              className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[7px] sm:text-[8px] font-semibold uppercase tracking-wide ${
                isPlaying ? 'bg-red-100 text-red-600' : 'bg-gray-800 text-white'
              }`}
            >
              {statusLabel}
            </span> */}
          </>
        )}
      </div>

      <div className="items-start grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="justify-self-start min-w-0 text-left">
          <div className="mb-0.5 font-semibold text-[8px] text-gray-400 sm:text-[10px] uppercase tracking-wider">
            {t('TEAM A')}
          </div>
          <div className="flex items-start gap-1">
            <div
              className={`min-w-0 text-[10px] sm:text-[14px] leading-snug truncate ${
                teamAWon ? 'font-bold text-gray-900' : 'text-gray-600 font-semibold'
              } ${teamALabel === t('TBD') ? 'italic text-gray-400' : ''}`}
            >
              {teamALabel}
            </div>
            {teamAWon && (
              <div className="flex flex-shrink-0 items-center gap-1 mt-0.5">
                <Trophy className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500" />
                <span className="bg-green-100 px-1 py-0.5 rounded-full font-semibold text-[9px] text-green-600 sm:text-[10px] leading-tight">
                  {t('Won')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="self-stretch mx-2 sm:mx-3 border-gray-200 border-l border-dashed" />

        <div className="justify-self-start min-w-0 text-left">
          <div className="mb-0.5 font-semibold text-[8px] text-gray-400 sm:text-[10px] uppercase tracking-wider">
            {t('TEAM B')}
          </div>
          <div className="flex items-start gap-1">
            <div
              className={`min-w-0 text-[10px] sm:text-[14px] leading-snug truncate ${
                teamBWon ? 'font-bold text-gray-900' : 'text-gray-600 font-semibold'
              } ${teamBLabel === t('TBD') ? 'italic text-gray-400' : ''}`}
            >
              {teamBLabel}
            </div>
            {teamBWon && (
              <div className="flex flex-shrink-0 items-center gap-1 mt-0.5">
                <Trophy className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500" />
                <span className="bg-green-100 px-1 py-0.5 rounded-full font-semibold text-[9px] text-green-600 sm:text-[10px] leading-tight">
                  {t('Won')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end text-right">
        {isWaiting ? (
          <button
            onClick={onToggleNotify}
            aria-label={t('Notify me when match starts')}
            className={`p-2 rounded-full transition-colors ${
              isNotified
                ? 'text-blue-500 bg-blue-50'
                : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'
            }`}
          >
            <Bell className={`w-4 h-4 ${isNotified ? 'fill-blue-400' : ''}`} />
          </button>
        ) : (
          <>
            <div className="font-extrabold text-gray-800 text-xl sm:text-3xl leading-none tracking-tight">
              {teamAWins}&nbsp;:&nbsp;{teamBWins}
            </div>
            {sets.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1 mt-1">
                {sets.map((set, index) => {
                  const isActive = isPlaying && index === sets.length - 1;
                  return (
                    <span
                      key={index}
                      className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded font-medium leading-tight ${
                        isActive
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                          : 'text-gray-400'
                      }`}
                    >
                      {set}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const DashboardMatchesTable = ({ matches, notifiedMatches, onToggleNotify }) => {
  const { t } = useLanguage();

  if (matches.length === 0) {
    return (
      <div className="py-16 text-gray-400 text-sm text-center">
        {t('No matches scheduled today')}
      </div>
    );
  }

  return (
    <>
      <div className="hidden gap-4 sm:grid grid-cols-[150px_1fr_170px] bg-gray-800 px-6 py-3 font-semibold text-[11px] text-white text-center uppercase tracking-wider">
        <div>
          <div>{t('Match Time')}</div>
          <div className="mt-0.5 font-normal text-[10px] text-gray-400 normal-case">
            {t('Total play time status')}
          </div>
        </div>
        <div className='text-center'>
          <div>{t('Teams & Players')}</div>
          <div className="mt-0.5 font-normal text-[10px] text-gray-400 normal-case">
            {t('Members of each duo team')}
          </div>
        </div>
        <div className="text-right">{t('Score Result')}</div>
      </div>

      {matches.map((match, index) => (
        <MatchRow
          key={match.id}
          match={match}
          isLast={index === matches.length - 1}
          isNotified={notifiedMatches.has(match.id)}
          onToggleNotify={() => onToggleNotify(match.id)}
        />
      ))}
    </>
  );
};

export default DashboardMatchesTable;
