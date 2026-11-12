from typing import List, Optional

from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    query: str = Field(..., min_length=1)
    force_agent: Optional[str] = Field(None, description="Skip the router and use this agent key")
    chain: Optional[List[str]] = Field(None, description="Pipeline of 2-3 agent keys; each output feeds the next agent")
    memory: Optional[List[dict]] = Field(None, description="Recent turns [{q, a}] used as conversation context")


class BatchRequest(BaseModel):
    queries: List[str] = Field(..., min_length=1)


class Step(BaseModel):
    step: str
    agent: str
    status: str
    ms: int


class AgentInfo(BaseModel):
    key: str
    role: str
    goal: str
    color: str
    icon: str


class RouteResponse(BaseModel):
    query: str
    category: str
    confidence: float
    reasoning: str
    agent: AgentInfo
    answer: str
    steps: List[Step]
    total_ms: int
    model: str
    used_fallback: bool
    forced: bool
