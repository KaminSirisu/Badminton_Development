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
      className={`grid grid-cols-[90px_1fr_90px] sm:grid-cols-[150px_1fr_170px] px-3 sm:px-6 py-1.5 sm:py-2 gap-2 sm:gap-4 items-center ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      <div className="flex flex-col items-center text-center">
        {isWaiting ? (
          <>
            <div className="font-semibold text-[9px] text-gray-400 sm:text-[10px] uppercase tracking-wider">
              UPCOMING
            </div>
            {/* <div className="mt-0.5 font-bold text-gray-800 text-sm sm:text-xl leading-tight">
              TBD
            </div> */}
            <span className="bg-gray-200 mt-1.5 px-2 sm:px-2.5 py-0.5 rounded-full font-semibold text-[9px] text-gray-600 sm:text-[10px] uppercase tracking-wide">
              WAITING
            </span>
          </>
        ) : (
          <>
            {isPlaying && (
              <div className="flex items-center gap-1 font-bold text-[10px] text-red-500 sm:text-xs">
                <span className="inline-block bg-red-500 rounded-full w-1.5 h-1.5 animate-pulse" />
                LIVE
              </div>
            )}
            <div className="font-extrabold text-gray-800 text-2xl sm:text-4xl leading-none">
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
          <div className="mb-0.5 font-semibold text-[9px] text-gray-400 sm:text-[10px] uppercase tracking-wider">
            TEAM A
          </div>
          <div className="flex items-start gap-1.5">
            <div>
              {teamAPlayers.length > 0 ? (
                teamAPlayers.map((player, index) => (
                  <div
                    key={index}
                    className={`text-xs sm:text-sm leading-snug ${
                      teamAWon ? 'font-bold text-gray-900' : 'text-gray-600 font-semibold'
                    }`}
                  >
                    {player}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-xs sm:text-sm italic">TBD</div>
              )}
            </div>
            {teamAWon && (
              <div className="flex flex-shrink-0 items-center gap-1 mt-0.5">
                <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-500" />
                <span className="bg-green-100 px-1.5 py-0.5 rounded-full font-semibold text-[10px] text-green-600 sm:text-xs leading-tight">
                  Won
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mx-5 border-gray-200 border-l border-dashed" />

        <div>
          <div className="mb-0.5 font-semibold text-[9px] text-gray-400 sm:text-[10px] uppercase tracking-wider">
            TEAM B
          </div>
          <div className="flex items-start gap-1.5">
            <div>
              {teamBPlayers.length > 0 ? (
                teamBPlayers.map((player, index) => (
                  <div
                    key={index}
                    className={`text-xs sm:text-sm leading-snug ${
                      teamBWon ? 'font-bold text-gray-900' : 'text-gray-600 font-semibold'
                    }`}
                  >
                    {player}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-xs sm:text-sm italic">TBD</div>
              )}
            </div>
            {teamBWon && (
              <div className="flex flex-shrink-0 items-center gap-1 mt-0.5">
                <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-500" />
                <span className="bg-green-100 px-1.5 py-0.5 rounded-full font-semibold text-[10px] text-green-600 sm:text-xs leading-tight">
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
            <div className="font-extrabold text-gray-800 text-2xl sm:text-4xl leading-none tracking-tight">
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
      <div className="py-16 text-gray-400 text-sm text-center">
        No matches scheduled today
      </div>
    );
  }

  return (
    <>
      <div className="hidden gap-4 sm:grid grid-cols-[150px_1fr_170px] bg-gray-800 px-6 py-3 font-semibold text-[11px] text-white text-center uppercase tracking-wider">
        <div>
          <div>Match Time</div>
          <div className="mt-0.5 font-normal text-[10px] text-gray-400 normal-case">
            Total play time status
          </div>
        </div>
        <div className='text-center'>
          <div>Teams &amp; Players</div>
          <div className="mt-0.5 font-normal text-[10px] text-gray-400 normal-case">
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
