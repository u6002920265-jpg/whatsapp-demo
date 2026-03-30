import type { UserStats } from '../types';
import { useFilter } from '../context/FilterContext';

interface OlympicPodiumProps {
  data: UserStats[];
}

interface MedalProps {
  type: 'gold' | 'silver' | 'bronze';
  position: number;
  size: number;
  onClick?: () => void;
  dimmed?: boolean;
}

function Medal({ type, position, size, onClick, dimmed }: MedalProps) {
  const gradients = {
    gold: {
      outer: 'linear-gradient(145deg, #ffd700 0%, #ffec80 15%, #ffd700 30%, #b8860b 70%, #8b6914 100%)',
      inner: 'linear-gradient(145deg, #fff8dc 0%, #ffd700 40%, #daa520 100%)',
      shadow: '0 4px 15px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(139, 105, 20, 0.4)',
      ribbon: '#dc2626',
      ribbonDark: '#991b1b'
    },
    silver: {
      outer: 'linear-gradient(145deg, #e8e8e8 0%, #ffffff 15%, #c0c0c0 30%, #808080 70%, #606060 100%)',
      inner: 'linear-gradient(145deg, #ffffff 0%, #d4d4d4 40%, #a0a0a0 100%)',
      shadow: '0 4px 15px rgba(192, 192, 192, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(96, 96, 96, 0.4)',
      ribbon: '#2563eb',
      ribbonDark: '#1d4ed8'
    },
    bronze: {
      outer: 'linear-gradient(145deg, #cd7f32 0%, #daa06d 15%, #cd7f32 30%, #8b4513 70%, #654321 100%)',
      inner: 'linear-gradient(145deg, #deb887 0%, #cd7f32 40%, #8b4513 100%)',
      shadow: '0 4px 15px rgba(205, 127, 50, 0.5), inset 0 2px 4px rgba(222, 184, 135, 0.6), inset 0 -2px 4px rgba(101, 67, 33, 0.4)',
      ribbon: '#16a34a',
      ribbonDark: '#15803d'
    }
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
        opacity: dimmed ? 0.5 : 1 
      }}
      onClick={onClick}
    >
      {/* Ribbon */}
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
          zIndex: 0
        }}
      />
      
      {/* Medal outer ring */}
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
          zIndex: 1
        }}
      >
        {/* Medal inner circle */}
        <div 
          className="absolute rounded-full flex items-center justify-center"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: innerSize,
            height: innerSize,
            background: colors.inner,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          {/* Position number */}
          <span 
            className="font-bold"
            style={{ 
              fontSize: innerSize * 0.5,
              color: type === 'gold' ? '#8b6914' : type === 'silver' ? '#4a4a4a' : '#654321',
              textShadow: type === 'gold' 
                ? '0 1px 0 rgba(255,255,255,0.5)' 
                : type === 'silver'
                ? '0 1px 0 rgba(255,255,255,0.8)'
                : '0 1px 0 rgba(222,184,135,0.5)'
            }}
          >
            {position}
          </span>
        </div>
        
        {/* Shine effect */}
        <div 
          className="absolute rounded-full"
          style={{
            top: '10%',
            left: '15%',
            width: '30%',
            height: '20%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '50%',
            transform: 'rotate(-30deg)'
          }}
        />
      </div>
    </div>
  );
}

export function OlympicPodium({ data }: OlympicPodiumProps) {
  const { toggleUser, selectedUsers } = useFilter();
  
  const topThree = data.slice(0, 3);
  
  while (topThree.length < 3) {
    topThree.push({ 
      name: '', 
      messageCount: 0, 
      repliesReceived: 0,
      avgResponseTime: 0,
      initiations: 0,
      responses: 0
    });
  }
  
  const [silver, gold, bronze] = [topThree[1], topThree[0], topThree[2]];
  
  const maxCount = Math.max(...topThree.map(user => user.messageCount));
  
  const getHeight = (count: number) => {
    const minHeight = 50;
    const maxHeight = 120;
    if (maxCount === 0) return minHeight;
    return minHeight + (count / maxCount) * (maxHeight - minHeight);
  };

  const goldHeight = getHeight(gold.messageCount);
  const silverHeight = getHeight(silver.messageCount);
  const bronzeHeight = getHeight(bronze.messageCount);

  const podiumGradients = {
    gold: 'linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #8b6914 100%)',
    silver: 'linear-gradient(180deg, #c0c0c0 0%, #808080 50%, #606060 100%)',
    bronze: 'linear-gradient(180deg, #cd7f32 0%, #8b4513 50%, #654321 100%)'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🏆 Pódio dos Mais Ativos
      </h2>
      
      <div className="flex justify-center items-end pt-8 pb-4">
        {/* Silver - 2nd Place */}
        <div className="flex flex-col items-center mx-2">
          {silver.name && (
            <>
              <Medal 
                type="silver" 
                position={2} 
                size={50}
                onClick={() => toggleUser(silver.name)}
                dimmed={selectedUsers.length > 0 && !selectedUsers.includes(silver.name)}
              />
              <div className="text-center mt-2 mb-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[80px]">
                  {silver.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {silver.messageCount.toLocaleString()}
                </div>
              </div>
            </>
          )}
          <div 
            className="w-20 rounded-t-lg flex items-center justify-center"
            style={{ 
              height: `${silverHeight}px`,
              background: podiumGradients.silver,
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
              opacity: silver.name ? 1 : 0.3
            }}
          >
            <span className="text-white font-bold text-xl" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>2</span>
          </div>
        </div>
        
        {/* Gold - 1st Place */}
        <div className="flex flex-col items-center mx-2">
          {gold.name && (
            <>
              <Medal 
                type="gold" 
                position={1} 
                size={60}
                onClick={() => toggleUser(gold.name)}
                dimmed={selectedUsers.length > 0 && !selectedUsers.includes(gold.name)}
              />
              <div className="text-center mt-2 mb-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[90px]">
                  {gold.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {gold.messageCount.toLocaleString()}
                </div>
              </div>
            </>
          )}
          <div 
            className="w-24 rounded-t-lg flex items-center justify-center"
            style={{ 
              height: `${goldHeight}px`,
              background: podiumGradients.gold,
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)',
              opacity: gold.name ? 1 : 0.3
            }}
          >
            <span className="text-white font-bold text-2xl" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>1</span>
          </div>
        </div>
        
        {/* Bronze - 3rd Place */}
        <div className="flex flex-col items-center mx-2">
          {bronze.name && (
            <>
              <Medal 
                type="bronze" 
                position={3} 
                size={45}
                onClick={() => toggleUser(bronze.name)}
                dimmed={selectedUsers.length > 0 && !selectedUsers.includes(bronze.name)}
              />
              <div className="text-center mt-2 mb-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[70px]">
                  {bronze.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {bronze.messageCount.toLocaleString()}
                </div>
              </div>
            </>
          )}
          <div 
            className="w-16 rounded-t-lg flex items-center justify-center"
            style={{ 
              height: `${bronzeHeight}px`,
              background: podiumGradients.bronze,
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
              opacity: bronze.name ? 1 : 0.3
            }}
          >
            <span className="text-white font-bold text-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
