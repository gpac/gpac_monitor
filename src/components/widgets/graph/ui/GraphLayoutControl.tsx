// src/components/widgets/graph/ui/GraphLayoutControls.tsx
import React from 'react';
import { LayoutType, LayoutOptions } from '../utils/GraphLayout';
import {  ArrowRight, ArrowDown, Grid, Circle } from 'lucide-react';

interface GraphLayoutControlsProps {
  currentLayout: LayoutOptions;
  onLayoutChange: (layout: LayoutOptions) => void;
  onAutoLayout: () => void;
}

const GraphLayoutControls: React.FC<GraphLayoutControlsProps> = ({
  currentLayout,
  onLayoutChange,
  onAutoLayout,
}) => {
  const handleTypeChange = (type: LayoutType) => {
    onLayoutChange({ ...currentLayout, type });
  };

  const handleDagreWithDirection = (direction: 'LR' | 'RL' | 'TB' | 'BT') => {
    onLayoutChange({ 
      ...currentLayout, 
      type: LayoutType.DAGRE,
      direction 
    });
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-700 z-50 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">Layout</span>
        <button
          onClick={onAutoLayout}
          className="text-xs text-blue-400 hover:text-blue-300"
          title="Auto-arrange layout"
        >
          Auto
        </button>
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => handleDagreWithDirection('LR')}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.DAGRE && currentLayout.direction === 'LR'
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Horizontal Layout (Left to Right)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleDagreWithDirection('TB')}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.DAGRE && currentLayout.direction === 'TB'
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Vertical Layout (Top to Bottom)"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleTypeChange(LayoutType.FORCE)}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.FORCE
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Force-directed Layout"
        >
          <Circle className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleTypeChange(LayoutType.MANUAL)}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.MANUAL
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Manual Layout"
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>
      
      {currentLayout.type === LayoutType.DAGRE && (
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => handleDagreWithDirection('LR')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'LR'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Left to Right"
          >
            LR
          </button>
          <button
            onClick={() => handleDagreWithDirection('RL')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'RL'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Right to Left"
          >
            RL
          </button>
          <button
            onClick={() => handleDagreWithDirection('TB')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'TB'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Top to Bottom"
          >
            TB
          </button>
          <button
            onClick={() => handleDagreWithDirection('BT')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'BT'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Bottom to Top"
          >
            BT
          </button>
        </div>
      )}
      
      {currentLayout.type === LayoutType.DAGRE && (
        <div className="mt-1 flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input
              type="checkbox"
              className="rounded text-blue-600"
              checked={ false}
              onChange={(_e) =>
                onLayoutChange({
                  ...currentLayout,
               
                })
              }
            />
            Group by type
          </label>
        </div>
      )}
    </div>
  );
};

export default React.memo(GraphLayoutControls);