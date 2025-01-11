'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ZoomIn, ZoomOut, X, RefreshCw, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSearchStore } from "@/lib/store/searchStore";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDebounce } from 'use-debounce';

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    communities: number;
    total_nodes: number;
    total_edges: number;
  };
}

interface SearchResult {
  text: string;
  score: number;
  metadata?: Record<string, any>;
}

// Update simulation node and link types
interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  data: {
    size: number;
    type: string;
  };
}

// Update SimulationLink interface to extend d3's type
interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  index?: number;
}

// Custom node component
const CustomNode = ({ data, id }: { data: any; id: string }) => {
  const baseWidth = Math.max(160, data.label.length * 10);
  const baseHeight = Math.min(80, Math.max(40, data.degree * 8 + 40));
  const width = Math.min(400, baseWidth);
  const height = baseHeight;

  // Calculate highlight styles
  const highlightStyle = data.matchScore ? {
    boxShadow: `0 0 12px hsla(var(--primary)/${Math.min(1, data.matchScore)})`,
    borderColor: 'hsl(var(--primary))',
    opacity: Math.max(0.6, data.matchScore)
  } : {};

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '13px',
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: 'pointer',
        textAlign: 'center',
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        position: 'relative',
        ...highlightStyle
      }}
      className="group bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input shadow-sm hover:shadow-md"
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-border !w-2 !h-2 !top-[-5px] border-none transition-all group-hover:!w-3 group-hover:!h-3"
      />
      <div className="truncate flex flex-col items-center gap-1">
        <span>{data.label}</span>
        {data.type && (
          <Badge 
            variant={data.matchScore ? "default" : "secondary"} 
            className="text-xs"
          >
            {data.type}
          </Badge>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-border !w-2 !h-2 !bottom-[-5px] border-none transition-all group-hover:!w-3 group-hover:!h-3"
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Add this helper function at the top level
const getNodeTypeForce = (type: string) => {
  switch (type) {
    case 'plan_type': return 0;
    case 'industry': return 1;
    case 'feature': return 2;
    default: return 1;
  }
};

// Add types for scored nodes and grouped results
interface ScoredNode {
  node: {
    id: string;
    label: string;
    size: number;
    type: string;
  };
  matchScore: number;
}

interface GroupedNode {
  id: string;
  data: {
    label: string;
    degree: number;
    size: number;
    community: number;
    type: string;
    matchScore: number;
  };
  [key: string]: any;
}

interface GroupedResults {
  [key: string]: GroupedNode[];
}

function Flow() {
  const defaultNodes: Node[] = [
    {
      id: 'default-1',
      type: 'custom',
      position: { x: 250, y: 100 },
      data: { label: 'Welcome to Knowledge Graph!', community: 0, degree: 2 }
    },
    {
      id: 'default-2',
      type: 'custom',
      position: { x: 100, y: 250 },
      data: { label: 'Upload documents', community: 1, degree: 1 }
    },
    {
      id: 'default-3',
      type: 'custom',
      position: { x: 400, y: 250 },
      data: { label: 'Search concepts', community: 1, degree: 1 }
    }
  ];

  const defaultEdges: Edge[] = [
    {
      id: 'default-e1',
      source: 'default-1',
      target: 'default-2',
      animated: true,
      label: 'requires',
      style: { stroke: '#94a3b8' }
    },
    {
      id: 'default-e2',
      source: 'default-1',
      target: 'default-3',
      animated: true,
      label: 'enables',
      style: { stroke: '#94a3b8' }
    }
  ];

  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [edges, setEdges] = useState<Edge[]>(defaultEdges);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [graphMetadata, setGraphMetadata] = useState<GraphData['metadata']>();
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [animateEdges, setAnimateEdges] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);
  const [layouting, setLayouting] = useState(false);
  const { zoomIn: zoomInFlow, zoomOut: zoomOutFlow } = useReactFlow();
  const { toast } = useToast();
  const { documents, useMockData, knowledgeGraph, setUseMockData } = useSearchStore();
  const [zoomLevel, setZoomLevel] = useState(1);
  const reactFlowInstance = useReactFlow();
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Add function to calculate node match score
  const calculateMatchScore = (nodeLabel: string, nodeType: string, searchTerm: string) => {
    if (!searchTerm) return 0;
    const searchLower = searchTerm.toLowerCase();
    const labelLower = nodeLabel.toLowerCase();
    const typeLower = nodeType.toLowerCase();
    
    // Exact matches get highest score
    if (labelLower === searchLower || typeLower === searchLower) return 1;
    
    // Word matches get high score
    if (labelLower.split(' ').some(word => word === searchLower)) return 0.9;
    
    // Contains matches get medium score
    if (labelLower.includes(searchLower)) return 0.7;
    
    // Partial word matches get lower score
    if (labelLower.split(' ').some(word => word.includes(searchLower))) return 0.5;
    
    // Type matches get lowest score
    if (typeLower.includes(searchLower)) return 0.3;
    
    return 0;
  };

  // SearchPanel component with access to all state
  const SearchPanel = ({ 
    onSearch, 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isLoading,
    graphMetadata,
    showEdgeLabels,
    setShowEdgeLabels,
    animateEdges,
    setAnimateEdges,
    selectedCommunity,
    setSelectedCommunity,
    onLayout,
    useMockData,
    setUseMockData
  }: { 
    onSearch: (query: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: SearchResult[];
    isLoading: boolean;
    graphMetadata?: GraphData['metadata'];
    showEdgeLabels: boolean;
    setShowEdgeLabels: (show: boolean) => void;
    animateEdges: boolean;
    setAnimateEdges: (animate: boolean) => void;
    selectedCommunity: number | null;
    setSelectedCommunity: (community: number | null) => void;
    onLayout: () => void;
    useMockData: boolean;
    setUseMockData: (use: boolean) => void;
  }) => {
    return (
      <Card className="w-80 absolute left-4 top-4 z-10 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-4 h-4" />
            Knowledge Graph Search
          </CardTitle>
          <CardDescription>
            {graphMetadata && (
              <div className="flex gap-2 text-xs">
                <Badge variant="outline">{graphMetadata.total_nodes} Nodes</Badge>
                <Badge variant="outline">{graphMetadata.total_edges} Edges</Badge>
                <Badge variant="outline">{graphMetadata.communities} Communities</Badge>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
            />
            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => onSearch(searchQuery)}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="filters" className="flex-1">Filters</TabsTrigger>
              <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
            </TabsList>
            <TabsContent value="filters" className="space-y-4 pt-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-labels">Show Edge Labels</Label>
                  <Switch 
                    id="show-labels" 
                    checked={showEdgeLabels}
                    onCheckedChange={setShowEdgeLabels}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="animate-edges">Animate Edges</Label>
                  <Switch 
                    id="animate-edges" 
                    checked={animateEdges}
                    onCheckedChange={setAnimateEdges}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-mock-data">Use Mock Data</Label>
                  <Switch 
                    id="use-mock-data" 
                    checked={useMockData}
                    onCheckedChange={(checked) => {
                      setUseMockData(checked);
                      // Refresh graph data when toggling mock data
                      fetchGraphData();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Filter by Community</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: graphMetadata?.communities || 0 }).map((_, idx) => (
                      <Badge
                        key={idx}
                        variant={selectedCommunity === idx ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedCommunity(selectedCommunity === idx ? null : idx)}
                        style={{
                          backgroundColor: selectedCommunity === idx ? `hsl(${idx * 60}, 70%, 60%)` : undefined,
                          borderColor: `hsl(${idx * 60}, 70%, 60%)`
                        }}
                      >
                        {idx + 1}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={onLayout}
                  disabled={layouting}
                >
                  {layouting ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Reorganize Layout
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="results" className="pt-2">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((result, idx) => (
                    <Card key={idx} className="p-2">
                      <div className="text-sm font-medium">{result.text}</div>
                      <div className="text-xs text-muted-foreground">
                        Score: {(result.score * 100).toFixed(1)}%
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No search results
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  const fetchGraphData = async () => {
    setIsLoading(true);
    try {
      if (useMockData) {
        if (!knowledgeGraph) {
          toast({
            title: "Error",
            description: "No mock data available",
            variant: "destructive",
          });
          return;
        }

        // Process mock nodes with better initial positions
        const processedNodes = knowledgeGraph.nodes.map((node: any) => ({
          id: node.id,
          type: 'custom',
          position: { 
            // Spread nodes out in a grid pattern initially
            x: 200 + (parseInt(node.id) % 3) * 300,
            y: 100 + Math.floor(parseInt(node.id) / 3) * 200
          },
          data: {
            label: node.label,
            degree: node.size / 5,
            size: node.size,
            community: ['plan_type', 'industry', 'feature'].indexOf(node.type),
            type: node.type
          }
        }));

        // Process mock edges with labels
        const processedEdges = knowledgeGraph.edges.map((edge: any, index: number) => ({
          id: `e${index}`,
          source: edge.source,
          target: edge.target,
          animated: animateEdges,
          label: edge.label,
          style: {
            stroke: 'hsl(var(--border))',
            strokeWidth: edge.weight,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: 'hsl(var(--border))',
            width: 6,
            height: 6,
          },
          labelStyle: {
            fontSize: '11px',
            fill: 'hsl(var(--muted-foreground))',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.025em',
          },
        }));

        setNodes(processedNodes);
        setEdges(processedEdges);
        setGraphMetadata({
          communities: 3,
          total_nodes: processedNodes.length,
          total_edges: processedEdges.length
        });

        // Automatically run layout after setting nodes
        setTimeout(() => handleLayout(), 100);

        toast({
          title: "Success",
          description: "Mock graph data loaded successfully",
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graph/`);
      if (!response.ok) throw new Error('Failed to fetch graph data');
      
      const data: GraphData = await response.json();
      
      // Process nodes with enhanced styling
      const processedNodes = data.nodes.map((node: any) => ({
        ...node,
        type: 'custom',
        data: {
          ...node.data,
          degree: node.data.degree || 1,
          community: node.data.community || 0,
        }
      }));

      // Process edges with enhanced styling
      const processedEdges = data.edges.map((edge: any) => ({
        ...edge,
        style: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: 'hsl(var(--border))',
          width: 6,
          height: 6,
        },
        labelStyle: {
          fontSize: '11px',
          fill: 'hsl(var(--muted-foreground))',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.025em',
        },
      }));

      setNodes(processedNodes);
      setEdges(processedEdges);
      setGraphMetadata(data.metadata);
      
      toast({
        title: "Success",
        description: "Graph data refreshed successfully",
      });
    } catch (error) {
      console.error('Error fetching graph data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh graph data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const queryGraph = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchGraphData();
      return;
    }
    
    try {
      setIsLoading(true);

      if (useMockData) {
        // Calculate match scores for all nodes
        const scoredNodes: ScoredNode[] = knowledgeGraph.nodes.map((node: any) => {
          const matchScore = calculateMatchScore(node.label, node.type, query);
          return {
            node,
            matchScore
          };
        });

        // Filter and sort nodes by match score
        const relevantNodes = scoredNodes
          .filter(({ matchScore }) => matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)
          .map(({ node, matchScore }) => ({
            id: node.id,
            type: 'custom',
            position: { 
              x: 200 + (parseInt(node.id) % 3) * 300,
              y: 100 + Math.floor(parseInt(node.id) / 3) * 200
            },
            data: {
              label: node.label,
              degree: node.size / 5,
              size: node.size,
              community: ['plan_type', 'industry', 'feature'].indexOf(node.type),
              type: node.type,
              matchScore
            }
          }));

        // Get connected edges with highlighted nodes
        const nodeIds = new Set(relevantNodes.map((n: GroupedNode) => n.id));
        const relevantEdges = knowledgeGraph.edges
          .filter((edge: any) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
          .map((edge: any, index: number) => ({
            id: `e${index}`,
            source: edge.source,
            target: edge.target,
            animated: animateEdges,
            label: showEdgeLabels ? edge.label : undefined,
            style: {
              stroke: 'hsl(var(--primary))',
              strokeWidth: edge.weight || 1,
              opacity: 0.6
            },
            markerEnd: {
              type: 'arrowclosed',
              color: 'hsl(var(--primary))',
              width: 6,
              height: 6,
            },
            labelStyle: showEdgeLabels ? {
              fontSize: '11px',
              fill: 'hsl(var(--muted-foreground))',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '-0.025em',
            } : undefined,
          }));

        setNodes(relevantNodes);
        setEdges(relevantEdges);
        setGraphMetadata({
          communities: 3,
          total_nodes: relevantNodes.length,
          total_edges: relevantEdges.length
        });

        // Group results by type for better presentation
        const groupedResults = relevantNodes.reduce<GroupedResults>((acc, node) => {
          const type = node.data.type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(node);
          return acc;
        }, {});

        setSearchResults(
          Object.entries(groupedResults).map(([type, nodes]) => ({
            text: `${type} (${nodes.length})`,
            score: nodes[0].data.matchScore,
            metadata: { type, count: nodes.length }
          }))
        );

        // Automatically run layout after setting nodes
        setTimeout(() => handleLayout(), 100);

        return;
      }

      const response = await fetch('/api/graph/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to query graph');
      }

      const data = await response.json();
      
      // Process nodes with relevance scores
      const processedNodes = data.subgraph.nodes.map((node: any) => ({
        ...node,
        type: 'custom',
        data: {
          ...node.data,
          degree: node.data.degree || 1,
          relevance: node.data.relevance || 0.5,
        }
      }));

      // Process edges with weights
      const processedEdges = data.subgraph.edges.map((edge: any) => ({
        ...edge,
        animated: animateEdges,
        label: showEdgeLabels ? edge.label : undefined,
        style: {
          stroke: 'hsl(var(--border))',
          strokeWidth: edge.weight || 1,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: 'hsl(var(--border))',
          width: 6,
          height: 6,
        },
        labelStyle: showEdgeLabels ? {
          fontSize: '11px',
          fill: 'hsl(var(--muted-foreground))',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.025em',
        } : undefined,
      }));

      setNodes(processedNodes);
      setEdges(processedEdges);
      setSearchResults(data.sources);
      setGraphMetadata(data.subgraph.metadata);

      toast({
        title: "Query Complete",
        description: data.answer,
      });
    } catch (error) {
      console.error('Error querying graph:', error);
      toast({
        title: "Error",
        description: "Failed to analyze knowledge graph. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeGraph, useMockData, showEdgeLabels, animateEdges]);

  // Use debounced search query
  useEffect(() => {
    queryGraph(debouncedSearchQuery);
  }, [debouncedSearchQuery, queryGraph]);

  useEffect(() => {
    if ((useMockData && knowledgeGraph) || !useMockData) {
      fetchGraphData();
    }
  }, [knowledgeGraph, useMockData]);

  // Zoom handlers
  const handleZoomIn = () => {
    reactFlowInstance.zoomIn();
    setZoomLevel(prev => Math.min(2, prev + 0.2));
  };

  const handleZoomOut = () => {
    reactFlowInstance.zoomOut();
    setZoomLevel(prev => Math.max(0.2, prev - 0.2));
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    fetchGraphData(); // Reset to full graph view
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      queryGraph(searchQuery);
    }
  }, [searchQuery]);

  // Update the handleLayout function
  const handleLayout = useCallback(() => {
    setLayouting(true);
    
    // Create simulation nodes
    const simulationNodes = nodes.map(node => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
      id: node.id,
        size: node.data.size,
        type: node.data.type
    }));

    // Create simulation links
    const simulationLinks = edges.map(edge => ({
      source: edge.source,
      target: edge.target
    }));

    const width = 1200;
    const height = 800;

    // Use force-directed layout algorithm
    const simulation = d3.forceSimulation(simulationNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(simulationLinks)
        .id((d: any) => d.id)
        .distance((d: any) => {
          const sourceNode = simulationNodes.find(n => n.id === d.source);
          const targetNode = simulationNodes.find(n => n.id === d.target);
          return sourceNode && targetNode ? 
            100 + (sourceNode.size + targetNode.size) / 2 : 100;
        })
      )
      .force('charge', d3.forceManyBody()
        .strength((d: any) => -500 - d.size * 10)
        .distanceMax(300)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius((d: any) => 80 + d.size)
        .strength(1)
      )
      .force('type', d3.forceY()
        .strength(0.5)
        .y((d: any) => {
          const typeForce = getNodeTypeForce(d.type);
          return height * (0.25 + typeForce * 0.25);
        })
      )
      .force('x', d3.forceX()
        .strength(0.1)
        .x((d: any) => {
          const typeForce = getNodeTypeForce(d.type);
          return width * (0.3 + (Math.random() * 0.4));
        })
      );

    // Run the simulation
    simulation.stop();
    for (let i = 0; i < 300; ++i) simulation.tick();

    // Update node positions with padding
    const padding = 50;
    const newNodes = nodes.map((node, i) => {
      const simNode = simulationNodes[i];
      const x = Math.max(padding, Math.min(width - padding, simNode.x || 0));
      const y = Math.max(padding, Math.min(height - padding, simNode.y || 0));
      return {
        ...node,
        position: { x, y }
      };
    });

    setNodes(newNodes);
    setLayouting(false);
  }, [nodes, edges]);

  // Filter nodes based on selected community
  const filteredNodes = useMemo(() => {
    if (selectedCommunity === null) return nodes;
    return nodes.filter(node => node.data.community === selectedCommunity);
  }, [nodes, selectedCommunity]);

  // Filter edges based on filtered nodes
  const filteredEdges = useMemo(() => {
    if (selectedCommunity === null) return edges;
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
  }, [edges, filteredNodes, selectedCommunity]);

  // Process edges with current settings
  const processedEdges = useMemo(() => {
    return filteredEdges.map(edge => ({
      ...edge,
      animated: animateEdges,
      label: showEdgeLabels ? edge.label : undefined,
      labelStyle: showEdgeLabels ? {
        fontSize: '11px',
        fill: 'hsl(var(--muted-foreground))',
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.025em',
      } : undefined
    }));
  }, [filteredEdges, showEdgeLabels, animateEdges]);

  return (
    <div className="w-full h-full relative">
      <SearchPanel
        onSearch={queryGraph}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isLoading={isLoading}
        graphMetadata={graphMetadata}
        showEdgeLabels={showEdgeLabels}
        setShowEdgeLabels={setShowEdgeLabels}
        animateEdges={animateEdges}
        setAnimateEdges={setAnimateEdges}
        selectedCommunity={selectedCommunity}
        setSelectedCommunity={setSelectedCommunity}
        onLayout={handleLayout}
        useMockData={useMockData}
        setUseMockData={setUseMockData}
      />
      
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={fetchGraphData}>
          <RefreshCw className={cn("w-4 h-4", { "animate-spin": isLoading })} />
        </Button>
      </div>

      <ReactFlow
        nodes={filteredNodes}
        edges={processedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/5"
      >
        <Background />
        <Controls className="!bg-background !border-border" />
        <MiniMap 
          className="!bottom-4 !right-4 !bg-background/80 !border-border"
          nodeColor={(node) => {
            const community = (node.data?.community ?? 0) % 6;
            return `hsl(${community * 60}, 70%, 60%)`;
          }}
          maskColor="hsl(var(--background)/50%)"
        />
      </ReactFlow>
    </div>
  );
}

export default function KnowledgeGraphPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground">
          Explore relationships between pension plans, companies, and concepts
        </p>
      </div>
      <div className="h-[800px] rounded-lg border bg-card text-card-foreground shadow-sm">
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>
    </div>
  );
} 