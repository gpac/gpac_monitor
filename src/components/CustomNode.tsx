import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FilterType, GpacNodeData } from '../types/domain/gpac/index';


interface CustomNodeProps extends NodeProps {
  data: GpacNodeData & {
    label: string;
    filterType: string;
    nb_ipid: number;
    nb_opid: number;
    pids: {
      input: Record<string, any>;
      output: Record<string, any>;
    };
  };
}

export const CustomNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  const { label, filterType, pids, nb_ipid, nb_opid } = data;
  

  // Couleurs selon le type (style pastel comme dans votre exemple)
  const getFilterColor = (type: FilterType): string => {
    const colors = {
      video: '#60a5fa',    // Bleu pastel
      audio: '#34d399',    // Vert pastel
      text: '#fbbf24',     // Jaune pastel
      image: '#a78bfa',    // Violet pastel
      other: '#9ca3af',    // Gris pastel
    };
    return colors[type];
  };

  // Déterminer le type de node pour la couleur de fond (selon la légende, style pastel)
  const getNodeTypeColor = (): string => {
    if (nb_ipid === 0) return '#d1fae5'; // Input Filter (source) - vert pastel très clair
    if (nb_opid === 0) return '#fee2e2'; // Output Filter (sink) - rouge pastel très clair  
    return '#dbeafe'; // Processing Filter - bleu pastel très clair
  };

  // Couleur de bordure selon le type de node (pastel plus saturé)
  const getNodeBorderColor = (): string => {
    if (nb_ipid === 0) return '#34d399'; // Input Filter - vert pastel
    if (nb_opid === 0) return '#f87171'; // Output Filter - rouge pastel
    return '#60a5fa'; // Processing Filter - bleu pastel
  };

  // Déterminer l'icône du type de node
  const getNodeTypeIcon = (): string => {
    if (nb_ipid === 0) return '●'; // Input Filter
    if (nb_opid === 0) return '●'; // Output Filter
    return '●'; // Processing Filter
  };
  
  // Créer les handles d'entrée seulement si nb_ipid > 0
  const inputHandles = nb_ipid > 0 ? Object.keys(pids.input).map((pidId, index) => ({
    id: pidId,
    type: 'target' as const,
    position: Position.Left,
    index
  })) : [];

  // Créer les handles de sortie seulement si nb_opid > 0
  const outputHandles = nb_opid > 0 ? Object.keys(pids.output).map((pidId, index) => ({
    id: pidId,
    type: 'source' as const,
    position: Position.Right,
    index
  })) : [];

  // Calculer la position Y des handles (comme GPACER)
  const getHandleY = (index: number, total: number): string => {
    if (total === 1) return '50%';
    return `${(index / (total - 1)) * 100}%`;
  };

  return (
    <div 
      className={`
        gpacer-node border-2 rounded-xl p-4 min-w-[200px] shadow-sm
        ${selected ? 'ring-2 ring-blue-400 shadow-lg' : ''}
        transition-all duration-200
      `}
      style={{ 
        borderColor: getNodeBorderColor(),
        backgroundColor: getNodeTypeColor(),
        borderWidth: '2px'
      }}
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
            background: getNodeBorderColor(),
            width: '10px',
            height: '10px',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      ))}

      {/* Contenu du nœud */}
      <div className="node-drag-handle cursor-move">
        {/* En-tête avec nom et icône de type */}
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-sm text-gray-800">
            {label}
          </div>
          <div 
            className="text-lg font-bold"
            style={{ 
              color: nb_ipid === 0 ? '#059669' : nb_opid === 0 ? '#dc2626' : '#2563eb'
            }}
            title={nb_ipid === 0 ? 'Input Filter' : nb_opid === 0 ? 'Output Filter' : 'Processing Filter'}
          >
            {getNodeTypeIcon()}
          </div>
        </div>
        
        {/* Type de filtre avec couleur pastel */}
        <div className="flex items-center mb-2">
          <div 
            className="w-3 h-3 rounded-full mr-2 shadow-sm"
            style={{ backgroundColor: getFilterColor(filterType as FilterType) }}
          ></div>
          <div className="text-xs font-medium text-gray-700">
            Type: {filterType}
          </div>
        </div>
        
        {/* Informations détaillées sur les inputs/outputs */}
        <div className="space-y-1">
          {nb_ipid > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-medium text-green-700">INPUTS</span>
              <div className="ml-2">
                {Object.keys(pids.input).map((pidId) => (
                  <div key={pidId} className="text-xs text-gray-500">
                    {pidId}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {nb_opid > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-medium text-blue-700">OUTPUTS</span>
              <div className="ml-2">
                {Object.keys(pids.output).map((pidId) => (
                  <div key={pidId} className="text-xs text-gray-500">
                    {pidId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Statistiques */}
        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
          IPIDs: {nb_ipid} | OPIDs: {nb_opid}
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
            background: getNodeBorderColor(),
            width: '10px',
            height: '10px',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      ))}
    </div>
  );
};


