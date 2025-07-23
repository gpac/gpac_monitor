import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FilterType, GpacNodeData } from '../../../../types/domain/gpac/index';


interface CustomNodeProps extends NodeProps {
  data: GpacNodeData & {
    label: string;
    filterType: string;
    pids: {
      input: Record<string, any>;
      output: Record<string, any>;
    };
  };
}

export const CustomNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  const { label, filterType, pids } = data;
  

  // Couleurs selon le type (comme votre logique existante)
  const getFilterColor = (type: FilterType): string => {
    const colors = {
      video: '#3b82f6',
      audio: '#10b981', 
      text: '#f59e0b',
      image: '#8b5cf6',
      other: '#6b7280',
    };
    return colors[type];
  };
  const inputHandles = Object.keys(pids.input).map((pidId, index) => ({
    id: pidId,
    type: 'target' as const,
    position: Position.Left,
    index
  }));

  // Créer les handles de sortie 
  const outputHandles = Object.keys(pids.output).map((pidId, index) => ({
    id: pidId,
    type: 'source' as const,
    position: Position.Right,
    index
  }));

  // Calculer la position Y des handles (comme GPACER)
  const getHandleY = (index: number, total: number): string => {
    if (total === 1) return '50%';
    return `${(index / (total - 1)) * 100}%`;
  };

  return (
    <div 
      className={`
        gpacer-node border-2 border-gray-300 rounded-lg bg-white p-3 min-w-[180px]
        ${selected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
        transition-all duration-200
      `}
      style={{ borderColor: getFilterColor(filterType as FilterType) }}
    >
      {/* Handles d'entrée */}
      {inputHandles.map(({ id, type, position, index }) => (
        <Handle
          key={`input-${id}`}
          id={id}
          type={type}
          position={position}
          style={{
            top: getHandleY(index, inputHandles.length),
            transform: 'translateY(-50%)',
            background: '#374151',
            width: '8px',
            height: '8px',
            border: '2px solid white'
          }}
        />
      ))}

      {/* Contenu du nœud */}
      <div className="node-drag-handle cursor-move">
        <div className="font-semibold text-sm text-gray-800 mb-1">
          {label}
        </div>
        <div className="text-xs text-gray-500">
          Type: {filterType}
        </div>
        
        {/* Debug info */}
        <div className="text-xs text-gray-400 mt-1">
          In: {inputHandles.length} | Out: {outputHandles.length}
        </div>
      </div>

      {/* Handles de sortie */}
      {outputHandles.map(({ id, type, position, index }) => (
        <Handle
          key={`output-${id}`}
          id={id}
          type={type}
          position={position}
          style={{
            top: getHandleY(index, outputHandles.length),
            transform: 'translateY(-50%)',
            background: getFilterColor(filterType as FilterType),
            width: '8px',
            height: '8px',
            border: '2px solid white'
          }}
        />
      ))}
    </div>
  );
};

