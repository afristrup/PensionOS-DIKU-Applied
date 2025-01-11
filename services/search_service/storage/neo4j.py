from neo4j import GraphDatabase
from typing import List, Dict, Optional
import logging

class Neo4jStore:
    def __init__(self, uri: str, username: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(username, password))
        self._init_constraints()

    def _init_constraints(self):
        """Initialize Neo4j constraints."""
        with self.driver.session() as session:
            # Create constraints for Document nodes
            session.run("""
                CREATE CONSTRAINT document_id IF NOT EXISTS
                FOR (d:Document) REQUIRE d.id IS UNIQUE
            """)
            # Create constraints for Entity nodes
            session.run("""
                CREATE CONSTRAINT entity_name IF NOT EXISTS
                FOR (e:Entity) REQUIRE e.name IS UNIQUE
            """)

    def add_document(self, doc_id: str, title: str, content: str, metadata: Dict):
        """Add a document node to the graph."""
        with self.driver.session() as session:
            session.run("""
                MERGE (d:Document {id: $doc_id})
                SET d.title = $title,
                    d.content = $content,
                    d.metadata = $metadata
            """, doc_id=doc_id, title=title, content=content, metadata=metadata)

    def add_entity(self, name: str, entity_type: str, properties: Dict = None):
        """Add an entity node to the graph."""
        with self.driver.session() as session:
            session.run("""
                MERGE (e:Entity {name: $name})
                SET e.type = $type,
                    e.properties = $properties
            """, name=name, type=entity_type, properties=properties or {})

    def add_relationship(self, from_id: str, to_name: str, relationship_type: str, properties: Dict = None):
        """Add a relationship between a document and an entity."""
        with self.driver.session() as session:
            session.run("""
                MATCH (d:Document {id: $from_id})
                MATCH (e:Entity {name: $to_name})
                MERGE (d)-[r:$relationship_type]->(e)
                SET r += $properties
            """, from_id=from_id, to_name=to_name, 
                relationship_type=relationship_type,
                properties=properties or {})

    def get_document_entities(self, doc_id: str) -> List[Dict]:
        """Get all entities connected to a document."""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (d:Document {id: $doc_id})-[r]->(e:Entity)
                RETURN e.name as name, e.type as type, 
                       e.properties as properties,
                       type(r) as relationship_type
            """, doc_id=doc_id)
            return [dict(record) for record in result]

    def get_entity_documents(self, entity_name: str) -> List[Dict]:
        """Get all documents connected to an entity."""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (d:Document)-[r]->(e:Entity {name: $name})
                RETURN d.id as id, d.title as title,
                       type(r) as relationship_type
            """, name=entity_name)
            return [dict(record) for record in result]

    def delete_document(self, doc_id: str):
        """Delete a document and its relationships."""
        with self.driver.session() as session:
            session.run("""
                MATCH (d:Document {id: $doc_id})
                DETACH DELETE d
            """, doc_id=doc_id)

    def close(self):
        """Close the Neo4j driver connection."""
        self.driver.close() 