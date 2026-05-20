import { Bell, Trophy } from 'lucide-react';

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

const formatStartTime = (startTime) => {
  if (!startTime) return '';

  const date = new Date(startTime);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  return startTime;
};

const MatchRow = ({ match, isLast, isNotified, onToggleNotify }) => {
  const sets = parseSetScores(match.matchScore);
  const { teamA: teamAWins, teamB: teamBWins } = computeSetScore(sets);
  const teamAPlayers = match.players.slice(0, 2);
  const teamBPlayers = match.players.slice(2, 4);

  const isWaiting = match.status === 'WAITING';
  const isPlaying = match.status === 'PLAYING';
  const isFinished = match.status === 'FINISHED';

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
      className={`grid grid-cols-[90px_1fr_90px] sm:grid-cols-[150px_1fr_170px] px-3 sm:px-6 py-1 sm:py-2 gap-2 sm:gap-4 items-center ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      <div className="flex flex-col items-center text-center">
        {isWaiting ? (
          <>
            <div className="text-gray-400 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">
              UPCOMING
            </div>
            <div className="font-bold text-sm sm:text-xl text-gray-800 leading-tight mt-0.5">
              {formatStartTime(match.startTime)}
            </div>
            <span className="mt-1.5 text-[9px] sm:text-[10px] bg-gray-200 text-gray-600 px-2 sm:px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
              WAITING
            </span>
          </>
        ) : (
          <>
            {isPlaying && (
              <div className="flex items-center gap-1 text-red-500 text-[10px] sm:text-xs font-bold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </div>
            )}
            <div className="font-extrabold text-2xl sm:text-4xl text-gray-800 leading-none">
              {match.totalTime ?? '-'}&apos;
            </div>
            <span
              className={`mt-1.5 text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                isPlaying ? 'bg-red-100 text-red-600' : 'bg-gray-800 text-white'
              }`}
            >
              {match.status}
            </span>
          </>
        )}
      </div>

      <div className='flex flex-row justify-center'>
        <div className="mb-2">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
            TEAM A
          </div>
          <div className="flex items-start gap-1.5">
            <div>
              {teamAPlayers.length > 0 ? (
                teamAPlayers.map((player, index) => (
                  <div
                    key={index}
                    className={`text-xs sm:text-sm leading-snug ${
                      teamAWon ? 'font-semibold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {player}
                  </div>
                ))
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 italic">TBD</div>
              )}
            </div>
            {teamAWon && (
              <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="text-[10px] sm:text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full leading-tight">
                  Won
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-l border-dashed border-gray-200 mx-5" />

        <div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
            TEAM B
          </div>
          <div className="flex items-start gap-1.5">
            <div>
              {teamBPlayers.length > 0 ? (
                teamBPlayers.map((player, index) => (
                  <div
                    key={index}
                    className={`text-xs sm:text-sm leading-snug ${
                      teamBWon ? 'font-semibold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {player}
                  </div>
                ))
              ) : (
                <div className="text-xs sm:text-sm text-gray-400 italic">TBD</div>
              )}
            </div>
            {teamBWon && (
              <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="text-[10px] sm:text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full leading-tight">
                  Won
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
            aria-label="Notify me when match starts"
            className={`p-2 rounded-full transition-colors ${
              isNotified
                ? 'text-blue-500 bg-blue-50'
                : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'
            }`}
          >
            <Bell className={`w-5 h-5 ${isNotified ? 'fill-blue-400' : ''}`} />
          </button>
        ) : (
          <>
            <div className="font-extrabold text-2xl sm:text-4xl text-gray-800 leading-none tracking-tight">
              {teamAWins}&nbsp;:&nbsp;{teamBWins}
            </div>
            {sets.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1 mt-1.5">
                {sets.map((set, index) => {
                  const isActive = isPlaying && index === sets.length - 1;
                  return (
                    <span
                      key={index}
                      className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-medium leading-tight ${
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
  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No matches scheduled today
      </div>
    );
  }

  return (
    <>
      <div className="hidden sm:grid grid-cols-[150px_1fr_170px] bg-gray-800 text-white text-[11px] font-semibold uppercase tracking-wider px-6 py-3 gap-4 text-center">
        <div>
          <div>Match Time</div>
          <div className="text-gray-400 font-normal normal-case text-[10px] mt-0.5">
            Total play time status
          </div>
        </div>
        <div className='text-center'>
          <div>Teams &amp; Players</div>
          <div className="text-gray-400 font-normal normal-case text-[10px] mt-0.5">
            Members of each duo team
          </div>
        </div>
        <div className="text-right">Score Result</div>
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
