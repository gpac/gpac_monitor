import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FilterType } from '../../../../types/domain/gpac/index';




export const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as {
    label: string;
    filterType: string;
    pids: {
      input: Record<string, any>;
      output: Record<string, any>;
    };
    nb_ipid?: number;
    nb_opid?: number;
    [key: string]: any;
  };

  const { label, filterType, pids, nb_ipid = 0, nb_opid = 0 } = nodeData;

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

  // Couleur de fond selon le type de nœud
  const backgroundColor = nb_ipid === 0 ? '#4ade80' : // Source (vert)
                         nb_opid === 0 ? '#ef4444' : // Sink (rouge)  
                         getFilterColor(filterType as FilterType); // Filter (selon type)

  const inputPids = Object.keys(pids.input || {});
  const outputPids = Object.keys(pids.output || {});

  return (
    <div 
      className={`gpacer-node ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor,
        border: selected ? '2px solid #fff' : '1px solid #4b5563',
        borderRadius: '8px',
        minWidth: '180px',
        color: 'white',
        fontSize: '12px',
        overflow: 'hidden'
      }}
    >
   
      <div 
        className="node-drag-handle"
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          fontWeight: 'bold',
          textAlign: 'center',
          cursor: 'move'
        }}
      >
        {label}
      </div>

     
      {inputPids.length > 0 && (
        <div style={{ padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>INPUTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {inputPids.map((pid, _index) => (
              <div key={pid} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '2px 4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                fontSize: '10px'
              }}>
                <span>{pid}</span>
              
                <Handle
                  type="target"
                  position={Position.Left}
                  id={pid}
                  style={{
                    left: '-8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #333'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}


      {outputPids.length > 0 && (
        <div style={{ padding: '4px 8px' }}>
          <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>OUTPUTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {outputPids.map((pid, _index) => (
              <div key={pid} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '2px 4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                fontSize: '10px'
              }}>
                <span>{pid}</span>
        
                <Handle
                  type="source"
                  position={Position.Right}
                  id={pid}
                  style={{
                    right: '-8px',
                    width: '8px',
                    height: '8px', 
                    backgroundColor: '#fff',
                    border: '1px solid #333'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Handles par défaut si pas de PIDs spécifiques */}
      {inputPids.length === 0 && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            left: '-8px',
            width: '8px',
            height: '8px',
            backgroundColor: '#fff',
            border: '1px solid #333'
          }}
        />
      )}

      {outputPids.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            right: '-8px',
            width: '8px',
            height: '8px',
            backgroundColor: '#fff',
            border: '1px solid #333'
          }}
        />
      )}
    </div>
  );
};