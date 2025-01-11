from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, ARRAY, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Association table for many-to-many relationship between clients and pension plans
client_pension_plans = Table(
    'client_pension_plans',
    Base.metadata,
    Column('client_id', Integer, ForeignKey('clients.id')),
    Column('pension_plan_id', Integer, ForeignKey('pension_plans.id'))
)

class PensionPlan(Base):
    __tablename__ = "pension_plans"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    plan_type = Column(String)
    description = Column(String)
    main_contact = Column(String)
    participants_count = Column(Integer)
    tags = Column(String)
    embedding = Column(ARRAY(Float))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    documents = relationship("Document", back_populates="pension_plan")
    clients = relationship("Client", secondary=client_pension_plans, back_populates="pension_plans")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    pension_plan_id = Column(Integer, ForeignKey("pension_plans.id"))
    filename = Column(String)
    content = Column(String)
    embedding = Column(ARRAY(Float))
    summary = Column(String)
    key_information = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    pension_plan = relationship("PensionPlan", back_populates="documents")
    uploads = relationship("Upload", back_populates="document")

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String)
    phone = Column(String)
    company = Column(String)
    status = Column(String)  # 'active' or 'inactive'
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    pension_plans = relationship("PensionPlan", secondary=client_pension_plans, back_populates="clients")
    chat_messages = relationship("ChatMessage", back_populates="client")
    uploads = relationship("Upload", back_populates="client")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    content = Column(String)
    role = Column(String)  # 'user' or 'assistant'
    created_at = Column(DateTime)

    # Relationships
    client = relationship("Client", back_populates="chat_messages")

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    filename = Column(String)
    file_type = Column(String)
    status = Column(String)  # 'pending', 'processed', 'failed'
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    client = relationship("Client", back_populates="uploads")
    document = relationship("Document", back_populates="uploads") 