import type { UserStats } from '../types';
import { useFilter } from '../context/FilterContext';

interface InactivePodiumProps {
  data: UserStats[];
}

interface AntiMedalProps {
  type: 'ferrugem' | 'madeira' | 'papelao';
  position: number;
  size: number;
  onClick?: () => void;
  dimmed?: boolean;
}

function AntiMedal({ type, position, size, onClick, dimmed }: AntiMedalProps) {
  const gradients = {
    ferrugem: {
      outer: 'linear-gradient(145deg, #B7410E 0%, #d4714a 15%, #B7410E 30%, #7a2b09 70%, #5c2007 100%)',
      inner: 'linear-gradient(145deg, #d4714a 0%, #B7410E 40%, #7a2b09 100%)',
      shadow: '0 4px 15px rgba(183, 65, 14, 0.5), inset 0 2px 4px rgba(212, 113, 74, 0.6), inset 0 -2px 4px rgba(92, 32, 7, 0.4)',
      ribbon: '#92400e',
      ribbonDark: '#78350f',
      textColor: '#5c2007',
    },
    madeira: {
      outer: 'linear-gradient(145deg, #8B4513 0%, #DEB887 15%, #8B4513 30%, #A0522D 70%, #5C3317 100%)',
      inner: 'linear-gradient(145deg, #DEB887 0%, #8B4513 40%, #A0522D 100%)',
      shadow: '0 4px 15px rgba(139, 69, 19, 0.5), inset 0 2px 4px rgba(222, 184, 135, 0.6), inset 0 -2px 4px rgba(92, 51, 23, 0.4)',
      ribbon: '#6b4226',
      ribbonDark: '#4a2e1a',
      textColor: '#5C3317',
    },
    papelao: {
      outer: 'linear-gradient(145deg, #A0826D 0%, #c4a98a 15%, #A0826D 30%, #6d5647 70%, #4a3a30 100%)',
      inner: 'linear-gradient(145deg, #c4a98a 0%, #A0826D 40%, #6d5647 100%)',
      shadow: '0 4px 15px rgba(160, 130, 109, 0.5), inset 0 2px 4px rgba(196, 169, 138, 0.6), inset 0 -2px 4px rgba(74, 58, 48, 0.4)',
      ribbon: '#78716c',
      ribbonDark: '#57534e',
      textColor: '#4a3a30',
    },
  };

  const colors = gradients[type];
  const innerSize = size * 0.75;
  const ribbonWidth = size * 0.15;

  return (
    <div
      className="relative cursor-pointer transition-transform hover:scale-110"
      style={{
        width: size,
        height: size + 20,
        opacity: dimmed ? 0.5 : 1,
      }}
      onClick={onClick}
    >
      <div
        className="absolute"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: ribbonWidth * 2,
          height: size * 0.4,
          background: `linear-gradient(90deg, ${colors.ribbon} 0%, ${colors.ribbon} 45%, ${colors.ribbonDark} 50%, ${colors.ribbon} 55%, ${colors.ribbon} 100%)`,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 50% 80%, 15% 100%)',
          zIndex: 0,
        }}
      />

      <div
        className="absolute rounded-full"
        style={{
          top: size * 0.25,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size,
          height: size,
          background: colors.outer,
          boxShadow: colors.shadow,
          zIndex: 1,
        }}
      >
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: innerSize,
            height: innerSize,
            background: colors.inner,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          <span
            className="font-bold"
            style={{
              fontSize: innerSize * 0.5,
              color: colors.textColor,
              textShadow: '0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {position}
          </span>
        </div>

        <div
          className="absolute rounded-full"
          style={{
            top: '10%',
            left: '15%',
            width: '30%',
            height: '20%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '50%',
            transform: 'rotate(-30deg)',
          }}
        />
      </div>
    </div>
  );
}

const MEDAL_NAMES = ['Medalha de Ferrugem', 'Medalha de Madeira', 'Medalha de Papelão'] as const;
const MEDAL_TYPES: AntiMedalProps['type'][] = ['ferrugem', 'madeira', 'papelao'];

export function InactivePodium({ data }: InactivePodiumProps) {
  const { toggleUser, selectedUsers } = useFilter();

  const bottomThree = [...data]
    .sort((a, b) => a.messageCount - b.messageCount)
    .slice(0, 3);

  while (bottomThree.length < 3) {
    bottomThree.push({
      name: '',
      messageCount: 0,
      repliesReceived: 0,
      avgResponseTime: 0,
      initiations: 0,
      responses: 0,
    });
  }

  const [second, first, third] = [bottomThree[1], bottomThree[0], bottomThree[2]];
  const positions = [
    { user: second, medal: MEDAL_TYPES[1], medalName: MEDAL_NAMES[1], pos: 2, size: 50, width: 'w-20' },
    { user: first, medal: MEDAL_TYPES[0], medalName: MEDAL_NAMES[0], pos: 1, size: 60, width: 'w-24' },
    { user: third, medal: MEDAL_TYPES[2], medalName: MEDAL_NAMES[2], pos: 3, size: 45, width: 'w-16' },
  ];

  const maxCount = Math.max(...bottomThree.map(u => u.messageCount));
  const getHeight = (count: number) => {
    const minH = 50;
    const maxH = 120;
    if (maxCount === 0) return minH;
    return maxH - (count / maxCount) * (maxH - minH);
  };

  const podiumColors = {
    ferrugem: 'linear-gradient(180deg, #B7410E 0%, #7a2b09 50%, #5c2007 100%)',
    madeira: 'linear-gradient(180deg, #8B4513 0%, #A0522D 50%, #5C3317 100%)',
    papelao: 'linear-gradient(180deg, #A0826D 0%, #6d5647 50%, #4a3a30 100%)',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🪵 Pódio dos Menos Ativos
      </h2>

      <div className="flex justify-center items-end pt-8 pb-4">
        {positions.map(({ user, medal, medalName, pos, size, width }) => (
          <div key={pos} className="flex flex-col items-center mx-2">
            {user.name && (
              <>
                <AntiMedal
                  type={medal}
                  position={pos}
                  size={size}
                  onClick={() => toggleUser(user.name)}
                  dimmed={selectedUsers.length > 0 && !selectedUsers.includes(user.name)}
                />
                <div className="text-center mt-2 mb-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[90px]">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {medalName}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {user.messageCount.toLocaleString()}
                  </div>
                </div>
              </>
            )}
            <div
              className={`${width} rounded-t-lg flex items-center justify-center`}
              style={{
                height: `${getHeight(user.messageCount)}px`,
                background: podiumColors[medal],
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)',
                opacity: user.name ? 1 : 0.3,
              }}
            >
              <span className="text-white font-bold text-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                {pos}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
