import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphFilterData } from '../../../../types/domain/gpac/model';


interface CustomNodeProps extends NodeProps {
  data: GraphFilterData & {
    label: string;
    filterType: string;
  } & Record<string, unknown>;
}

export const CustomNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  const { label, filterType, ipid, opid, nb_ipid, nb_opid } = data;
  // Determine node type for background color (according to legend, pastel style)
  const getNodeTypeColor = (): string => {
    if (nb_ipid === 0) return '#d1fae5';
    if (nb_opid === 0) return '#fee2e2';  
    return '#dbeafe'; 
  };

  // Determine node border color
  const getNodeBorderColor = (): string => {
    if (nb_ipid === 0) return '#34d399'; 
    if (nb_opid === 0) return '#f87171'; 
    return '#60a5fa';
  };

  // Create input handles only if nb_ipid > 0
  const inputHandles = nb_ipid > 0 ? Object.keys(ipid).map((pidId, index) => ({
    id: pidId,
    type: 'target' as const,
    position: Position.Left,
    index
  })) : [];

  // Create output handles only if nb_opid > 0
  const outputHandles = nb_opid > 0 ? Object.keys(opid).map((pidId, index) => ({
    id: pidId,
    type: 'source' as const,
    position: Position.Right,
    index
  })) : [];


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

      <div 
        className="rounded-t-xl -m-4 mb-2 px-4 py-3 shadow-sm bg-gray-800"
        
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm drop-shadow-sm">
            {label}
          </h3>
          <div 
            className="text-white text-xs font-medium px-2 py-1 bg-white/20 rounded-full"
            title={nb_ipid === 0 ? 'Input Filter' : nb_opid === 0 ? 'Output Filter' : 'Processing Filter'}
          >
            {filterType.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Contenu du nœud */}
      <div className="node-drag-handle cursor-move">
        
        {/* Informations détaillées sur les inputs/outputs */}
        <div className="space-y-1">
          {nb_ipid > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-medium text-green-700">INPUTS</span>
              <div className="ml-2">
                {Object.keys(ipid).map((pidId) => (
                  <div key={pidId} className="text-xs text-gray-500">
                    {pidId}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {nb_opid > 0 && (
            <div className="text-xs text-gray-800">
              <span className="font-medium text-blue-700">OUTPUTS</span>
              <div className="ml-2">
                {Object.keys(opid).map((pidId) => (
                  <div key={pidId} className="text-xs text-gray-800">
                    {pidId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Statistiques */}
        <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-500">
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


