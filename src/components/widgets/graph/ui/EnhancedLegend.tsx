import React, { useState } from 'react';
import { Activity, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ThroughputLevel } from '../utils/GraphMetrics';

interface ThroughputIndicatorProps {
  level: ThroughputLevel;
  label: string;
}

const ThroughputIndicator: React.FC<ThroughputIndicatorProps> = ({ level, label }) => {
  // Define animation properties based on throughput level
  const getAnimationProps = (level: ThroughputLevel) => {
    switch (level) {
      case ThroughputLevel.VERY_HIGH:
        return { duration: '0.8s', dasharray: '3, 2' };
      case ThroughputLevel.HIGH:
        return { duration: '1.5s', dasharray: '4, 3' };
      case ThroughputLevel.MEDIUM:
        return { duration: '3s', dasharray: '5, 5' };
      case ThroughputLevel.LOW:
        return { duration: '5s', dasharray: '3, 7' };
      case ThroughputLevel.VERY_LOW:
        return { duration: '8s', dasharray: '2, 10' };
    }
  };

  const { duration, dasharray } = getAnimationProps(level);

  return (
    <div className="flex items-center gap-2">
      <svg width="30" height="12" viewBox="0 0 30 12">
        <line
          x1="0" 
          y1="6" 
          x2="30" 
          y2="6"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray={dasharray}
          style={{
            animation: `flowLegend ${duration} linear infinite`,
          }}
        />
      </svg>
      <span className="text-xs">{label}</span>
    </div>
  );
};

const EnhancedLegend: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [showThroughput, setShowThroughput] = useState(false);

  return (
    <div
      className="absolute bottom-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 z-50 transition-all duration-300"
      style={{
        backgroundColor: '#1f2937',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxWidth: expanded ? '300px' : '56px',
        opacity: expanded ? 1 : 0.7,
      }}
    >
      <div className="relative z-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className={`text-sm font-medium text-gray-200 ${!expanded && 'hidden'}`}>Legend</h4>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-gray-700 transition-colors"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        
        {expanded && (
          <>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="space-y-2 pb-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#4ade80] shadow-sm" />
                  <span className="relative z-50">Input Filter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm" />
                  <span className="relative z-50">Processing Filter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-sm" />
                  <span className="relative z-50">Output Filter</span>
                </div>
              </div>
              
              {/* Throughput section with toggle */}
              <div>
                <button 
                  onClick={() => setShowThroughput(!showThroughput)}
                  className="flex items-center justify-between w-full text-left py-1"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-gray-400" />
                    <span className="relative z-50">Data Flow Speed</span>
                  </div>
                  {showThroughput ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </button>
                
                {showThroughput && (
                  <div className="mt-2 pl-5 space-y-2 text-xs">
                    <ThroughputIndicator level={ThroughputLevel.VERY_HIGH} label="Very High" />
                    <ThroughputIndicator level={ThroughputLevel.HIGH} label="High" />
                    <ThroughputIndicator level={ThroughputLevel.MEDIUM} label="Medium" />
                    <ThroughputIndicator level={ThroughputLevel.LOW} label="Low" />
                    <ThroughputIndicator level={ThroughputLevel.VERY_LOW} label="Very Low" />
                    
                    <div className="flex items-start gap-2 mt-2 text-gray-400">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>
                        Speed is represented by animation speed and dash pattern. Hover over connections for details.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Global animation styles for the legend */}
            <style>
              {`
                @keyframes flowLegend {
                  from {
                    stroke-dashoffset: 24;
                  }
                  to {
                    stroke-dashoffset: 0;
                  }
                }
              `}
            </style>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(EnhancedLegend);