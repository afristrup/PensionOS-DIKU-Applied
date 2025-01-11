from llama_index import ServiceContext, VectorStoreIndex
from llama_index.graph_stores import SimpleGraphStore
from llama_index.storage.storage_context import StorageContext
from llama_index.indices.knowledge_graph import KnowledgeGraphIndex
from llama_index.llms import Anthropic
from llama_index.embeddings import HuggingFaceEmbedding
from typing import List, Dict, Any, Optional
import networkx as nx
from networkx.algorithms import community
import json
import os
from dotenv import load_dotenv

load_dotenv()

class GraphService:
    def __init__(self):
        # Initialize Anthropic
        self.llm = Anthropic(
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet"),
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.1,
        )

        # Initialize embedding model
        self.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

        # Create service context
        self.service_context = ServiceContext.from_defaults(
            llm=self.llm,
            embed_model=self.embed_model,
        )

        # Initialize graph store
        self.graph_store = SimpleGraphStore()
        self.storage_context = StorageContext.from_defaults(
            graph_store=self.graph_store
        )

        # Initialize the knowledge graph index
        self.kg_index = None

    async def process_documents(
        self, documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Process documents and create a knowledge graph."""
        # Convert documents to LlamaIndex format
        from llama_index import Document

        llama_docs = [
            Document(
                text=doc["content"],
                metadata={
                    "title": doc.get("title", ""),
                    "source": doc.get("source", ""),
                },
            )
            for doc in documents
        ]

        # Create or update knowledge graph index
        self.kg_index = KnowledgeGraphIndex.from_documents(
            llama_docs,
            service_context=self.service_context,
            storage_context=self.storage_context,
            max_triplets_per_chunk=10,
            include_embeddings=True,
        )

        # Get graph data for visualization
        graph_data = self._get_graph_visualization_data()

        return {
            "graph_data": graph_data,
            "message": f"Successfully processed {len(documents)} documents",
        }

    def _get_graph_visualization_data(self) -> Dict[str, Any]:
        """Convert the knowledge graph to a format suitable for visualization."""
        graph: nx.Graph = self.graph_store.get_networkx_graph()

        # Detect communities for node clustering
        communities = community.greedy_modularity_communities(graph)
        community_map = {}
        for i, comm in enumerate(communities):
            for node in comm:
                community_map[node] = i

        # Calculate node positions using force-directed layout
        pos = nx.spring_layout(graph, k=1 / pow(len(graph.nodes()), 0.3))

        nodes = []
        edges = []

        # Process nodes with community information
        for node_id in graph.nodes():
            community_id = community_map.get(node_id, 0)
            position = pos[node_id]
            nodes.append(
                {
                    "id": str(node_id),
                    "data": {
                        "label": str(node_id),
                        "community": community_id,
                        "degree": graph.degree(node_id),
                    },
                    "position": {
                        "x": float(position[0] * 1000),
                        "y": float(position[1] * 1000),
                    },
                }
            )

        # Process edges with relationship types
        for source, target, data in graph.edges(data=True):
            relationship = data.get("relationship", "related_to")
            # Calculate edge weight based on relationship frequency
            weight = data.get("weight", 1.0)
            edges.append(
                {
                    "id": f"e{source}-{target}",
                    "source": str(source),
                    "target": str(target),
                    "animated": True,
                    "data": {"relationship": relationship, "weight": weight},
                    "label": relationship,
                }
            )

        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "communities": len(communities),
                "total_nodes": len(nodes),
                "total_edges": len(edges),
            },
        }

    def _get_relevant_subgraph(self, query: str, max_nodes: int = 20) -> Dict[str, Any]:
        """Get a relevant subgraph based on the query."""
        if not self.kg_index:
            return {"nodes": [], "edges": [], "metadata": {}}

        # Get the full graph
        graph = self.graph_store.get_networkx_graph()

        # Get query embedding
        query_embedding = self.embed_model.get_text_embedding(query)

        # Calculate relevance scores for nodes
        node_scores = {}
        for node in graph.nodes():
            # Get node embedding from the index (simplified)
            node_embedding = self.embed_model.get_text_embedding(str(node))
            # Calculate cosine similarity
            similarity = self._cosine_similarity(query_embedding, node_embedding)
            node_scores[node] = similarity

        # Get top-k most relevant nodes
        relevant_nodes = sorted(node_scores.items(), key=lambda x: x[1], reverse=True)[
            :max_nodes
        ]
        relevant_node_ids = {node[0] for node in relevant_nodes}

        # Extract subgraph with relevant nodes
        subgraph = graph.subgraph(relevant_node_ids)

        # Calculate layout for subgraph
        pos = nx.spring_layout(subgraph)

        # Convert to visualization format
        nodes = []
        edges = []

        for node_id in subgraph.nodes():
            position = pos[node_id]
            nodes.append(
                {
                    "id": str(node_id),
                    "data": {
                        "label": str(node_id),
                        "relevance": float(node_scores[node_id]),
                        "degree": subgraph.degree(node_id),
                    },
                    "position": {
                        "x": float(position[0] * 1000),
                        "y": float(position[1] * 1000),
                    },
                }
            )

        for source, target, data in subgraph.edges(data=True):
            relationship = data.get("relationship", "related_to")
            edges.append(
                {
                    "id": f"e{source}-{target}",
                    "source": str(source),
                    "target": str(target),
                    "animated": True,
                    "data": {
                        "relationship": relationship,
                        "weight": data.get("weight", 1.0),
                    },
                    "label": relationship,
                }
            )

        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "query": query,
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "average_relevance": sum(node_scores[n] for n in subgraph.nodes())
                / len(subgraph.nodes())
                if subgraph.nodes()
                else 0,
            },
        }

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        import numpy as np

        v1_n = np.array(v1)
        v2_n = np.array(v2)
        return np.dot(v1_n, v2_n) / (np.linalg.norm(v1_n) * np.linalg.norm(v2_n))

    async def query_graph(self, query: str) -> Dict[str, Any]:
        """Query the knowledge graph."""
        if not self.kg_index:
            return {"error": "Knowledge graph not initialized"}

        # Create query engine
        query_engine = self.kg_index.as_query_engine(
            response_mode="tree_summarize", verbose=True
        )

        # Get response
        response = query_engine.query(query)

        # Get relevant subgraph
        subgraph = self._get_relevant_subgraph(query)

        return {
            "answer": str(response),
            "subgraph": subgraph,
            "sources": [
                {
                    "text": str(source.node.text),
                    "score": float(source.score),
                    "metadata": source.node.metadata,
                }
                for source in response.source_nodes
            ],
        }


# Initialize the graph service
graph_service = GraphService()
