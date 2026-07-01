from langgraph.graph import StateGraph,END

from app.agent.state import TriageState
from app.agent.nodes import (
    intake_node,
    nlp_extract_node,
    esi_scorer_node,
    escalate_node,
    disposition_node
)

def route_after_esi(state:TriageState)->TriageState:
    if(state.get("life_threat")) is True:
        return "escalate"
    return "disposition"


def build_triage_graph():
    graph=StateGraph(TriageState)
    
    graph.add_node("intake",intake_node)
    graph.add_node('nlp_extract',nlp_extract_node)
    graph.add_node('esi_scorer',esi_scorer_node)
    graph.add_node('escalate',escalate_node)
    graph.add_node('disposition',disposition_node)
    
    graph.set_entry_point('intake')
    graph.add_edge('intake','nlp_extract')
    graph.add_edge('nlp_extract','esi_scorer')
    
    graph.add_conditional_edges(
        'esi_scorer',
        route_after_esi,{
            'escalate':'escalate',
            'disposition':'disposition'
        }
    )
    
    graph.add_edge('escalate',END)
    graph.add_edge('disposition',END)
    
    return graph.compile()

triage_graph=build_triage_graph()
        