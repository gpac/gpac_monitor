
import React, { useEffect, useState } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';
import { useAppSelector } from '../../../../hooks/redux';
import { GpacNodeData } from '../../../../types/domain/gpac';
import { selectFilterNameById } from '../../../../store/slices/graphSlice';

interface ConnectionItem {
    name: string;
    targetId?: string;
    sourceId?: string;
    isHighlighted: boolean;
}

interface ConnectionsOverlayProps {
    selectedNodeId: string | null;
    nodes: Node[];
    edges: Edge[];
    onConnectionHover: (edgeId: string | null) => void;
    highlightedEdge: string | null;
}

const ConnectionsOverlay: React.FC<ConnectionsOverlayProps> = ({
    selectedNodeId,
    nodes,
    edges,
    onConnectionHover,
    highlightedEdge,
}) => {
    const [inputs, setInputs] = useState<ConnectionItem[]>([]);
    const [outputs, setOutputs] = useState<ConnectionItem[]>([]);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [title, setTitle] = useState('');
    const { getNode } = useReactFlow();
    
    // To retrieve the names of connected filters
    const getFilterName = useAppSelector(state => (id: string) => 
        selectFilterNameById(state, id));

    useEffect(() => {
        if (!selectedNodeId) {
            setInputs([]);
            setOutputs([]);
            return;
        }

        const node = getNode(selectedNodeId);
        if (!node) return;

        // Position the overlay near the selected node
        const nodeData = node.data as GpacNodeData;
        setTitle(nodeData.name || '');
        
        // Calculate position based on React Flow
        setPosition({
            x: node.position.x + (node.width || 180) + 10,
            y: node.position.y
        });

        // Prepare incoming connections (inputs)
        const nodeInputs: ConnectionItem[] = [];
        
        if (nodeData.ipid) {
            Object.entries(nodeData.ipid).forEach(([name, info]: [string, any]) => {
                const sourceId = info.source_idx?.toString();
                const relevantEdges = edges.filter(
                    e => e.target === selectedNodeId && 
                             e.source === sourceId
                );
                
                nodeInputs.push({
                    name,
                    sourceId,
                    isHighlighted: relevantEdges.some(
                        e => e.id === highlightedEdge
                    )
                });
            });
        }
        
        // Prepare outgoing connections (outputs)
        const nodeOutputs: ConnectionItem[] = [];
        
        if (nodeData.opid) {
            // Find all edges outgoing from this node
            const outgoingEdges = edges.filter(e => e.source === selectedNodeId);
            
            // Group by opid name
            const opidMap = new Map<string, string[]>();
            
            Object.keys(nodeData.opid).forEach(opidName => {
                opidMap.set(opidName, []);
            });
            
            // Associate edges with opids
            outgoingEdges.forEach(edge => {
                // For simplicity, associate the edge with the first opid
                // In a more advanced version, use handles
                const firstOpid = Object.keys(nodeData.opid)[0];
                const opidTargets = opidMap.get(firstOpid) || [];
                opidTargets.push(edge.target);
                opidMap.set(firstOpid, opidTargets);
            });
            
            // Create output items
            opidMap.forEach((targets, name) => {
                const relevantEdges = edges.filter(
                    e => e.source === selectedNodeId && 
                             targets.includes(e.target)
                );
                
                nodeOutputs.push({
                    name,
                    targetId: targets[0], 
                    isHighlighted: relevantEdges.some(
                        e => e.id === highlightedEdge
                    )
                });
            });
        }
        
        setInputs(nodeInputs);
        setOutputs(nodeOutputs);
    }, [selectedNodeId, edges, getNode, highlightedEdge, getFilterName]);

    if (!selectedNodeId || (!inputs.length && !outputs.length)) {
        return null;
    }

    return (
        <div 
            className="absolute z-10 bg-gray-900 bg-opacity-90 rounded-md border border-gray-700 shadow-lg"
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                minWidth: '240px',
                maxWidth: '320px',
                zIndex: 9999,
            }}
        >
            <div className="px-3 py-2 border-b border-gray-700 text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                <span>{title}</span>
                <div className="ml-1 text-xs text-gray-400">CONNECTIONS</div>
            </div>
            
            {/* Input connections */}
            {inputs.length > 0 && (
                <div className="px-2 py-1">
                    {inputs.map((input, idx) => (
                        <div 
                            key={`input-${idx}`}
                            className={`text-xs py-1 px-1 rounded flex items-center ${
                                input.isHighlighted ? 'bg-purple-900 bg-opacity-60' : 'hover:bg-gray-800'
                            }`}
                            onMouseEnter={() => {
                                if (input.sourceId) {
                                    const edgeId = edges.find(
                                        e => e.source === input.sourceId && e.target === selectedNodeId
                                    )?.id;
                                    if (edgeId) onConnectionHover(edgeId);
                                }
                            }}
                            onMouseLeave={() => onConnectionHover(null)}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${input.isHighlighted ? 'bg-red-500' : 'bg-gray-400'}`} />
                            <span className="text-gray-300">{input.name}</span>
                            {input.sourceId && (
                                <span className="ml-auto text-xs text-gray-500">
                                    ← {getFilterName(input.sourceId)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {/* Output connections */}
            {outputs.length > 0 && (
                <div className="px-2 py-1">
                    {outputs.map((output, idx) => (
                        <div 
                            key={`output-${idx}`}
                            className={`text-xs py-1 px-1 rounded flex items-center ${
                                output.isHighlighted ? 'bg-purple-900 bg-opacity-60' : 'hover:bg-gray-800'
                            }`}
                            onMouseEnter={() => {
                                if (output.targetId) {
                                    const edgeId = edges.find(
                                        e => e.source === selectedNodeId && e.target === output.targetId
                                    )?.id;
                                    if (edgeId) onConnectionHover(edgeId);
                                }
                            }}
                            onMouseLeave={() => onConnectionHover(null)}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${output.isHighlighted ? 'bg-red-500' : 'bg-green-400'}`} />
                            <span className="text-gray-300">{output.name}</span>
                            {output.targetId && (
                                <span className="ml-auto text-xs text-gray-500">
                                    → {getFilterName(output.targetId)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConnectionsOverlay;