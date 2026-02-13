from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = FastAPI()

class CardData(BaseModel):
    menteeName: str
    menteeContext: Optional[str] = ""
    menteeGoal: Optional[str] = ""
    mentorPerception: Optional[str] = ""
    mentorResistance: Optional[str] = ""
    mentorAttention: Optional[str] = ""
    mentorEmotion: Optional[str] = ""
    phase: Optional[str] = ""
    energyMentee: Optional[int] = 0
    energyMentor: Optional[int] = 0
    decisionsTaken: Optional[str] = ""
    decisionsOpen: Optional[str] = ""
    reflections: Optional[str] = ""

class AnalysisResponse(BaseModel):
    analysis: str
    suggestions: List[str]

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_card(card: CardData):
    # Check for Gemini Key (Free Tier)
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if gemini_key:
        print("Gemini Key found. Attempting to use AI...")
        return await analyze_with_gemini(card, gemini_key)
    else:
        print("Gemini Key NOT found. Using Smart Mock.")
        return analyze_with_smart_mock(card)

@app.post("/api/ai/analyze", response_model=AnalysisResponse)
async def analyze_card_vercel(card: CardData):
    return await analyze_card(card)

async def analyze_with_gemini(card: CardData, api_key: str):
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Você é um Copiloto Cognitivo para mentores experientes. Sua função NÃO é dar conselhos óbvios, mas sim provocar reflexão estratégica, espelhar padrões e identificar pontos cegos.
        
        Analise os dados deste cartão de mentoria:
        
        DADOS DO MENTORADO:
        - Nome: {card.menteeName}
        - Contexto: {card.menteeContext}
        - Objetivo Principal: {card.menteeGoal}
        
        LEITURA DO MENTOR (SUBJETIVA):
        - Percepção do Mentor: {card.mentorPerception}
        - Resistências Observadas: {card.mentorResistance}
        - Pontos de Atenção: {card.mentorAttention}
        - Emoção Despertada no Mentor: {card.mentorEmotion}
        
        ESTADO:
        - Energia do Mentorado (0-10): {card.energyMentee}
        - Energia do Mentor (0-10): {card.energyMentor}
        
        DECISÕES:
        - Decisões Tomadas: {card.decisionsTaken}
        - Decisões em Aberto: {card.decisionsOpen}
        - Reflexões: {card.reflections}
        
        SAÍDA ESPERADA (JSON):
        {{
            "analysis": "Um parágrafo denso e direto, usando a técnica de espelhamento ('Você percebe que...') e conectando os pontos (ex: a baixa energia do mentor pode estar ligada à resistência X). Seja provocativo.",
            "suggestions": ["Sugestão de pergunta poderosa 1", "Sugestão de ação estratégica 2", "Sugestão de reflexão 3"]
        }}
        """
        
        response = model.generate_content(prompt)
        import json
        
        # Clean up response text to ensure it's valid JSON
        text = response.text.replace('```json', '').replace('```', '').strip()
        
        try:
            data = json.loads(text)
            return AnalysisResponse(analysis=data.get('analysis', ''), suggestions=data.get('suggestions', []))
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return AnalysisResponse(analysis=text, suggestions=["Não foi possível estruturar as sugestões."])
            
    except Exception as e:
        print(f"Gemini Error: {e}")
        return analyze_with_smart_mock(card)

def analyze_with_smart_mock(card: CardData) -> AnalysisResponse:
    """
    Simulates a Cognitive Copilot using heuristic patterns.
    Fallback when no API key is present.
    """
    
    analysis_parts = []
    suggestions = []
    
    # 1. Espelhamento (Mirroring)
    if card.mentorPerception:
        analysis_parts.append(f"Você percebe que {card.menteeName} está '{card.mentorPerception}'.")
    else:
        analysis_parts.append(f"Analisando o contexto de {card.menteeName}.")

    # 2. Leitura de Padrões (Pattern Recognition)
    
    # Pattern: Low Mentor Energy (Burnout/Countertransference)
    if card.energyMentor is not None and card.energyMentor < 4:
        analysis_parts.append("⚠️ Padrão Detectado: Sua energia está baixa para este caso. Isso pode indicar uma barreira invisível ou contratransferência.")
        suggestions.append("Antes da próxima sessão, pergunte-se: O que neste mentorado drena minha energia?")
    
    # Pattern: High Resistance vs Low Mentee Energy (Stalemate)
    if card.mentorResistance and (card.energyMentee is not None and card.energyMentee < 4):
        analysis_parts.append("Há uma resistência clara combinada com baixa energia do mentorado. O processo pode estar travado por falta de 'buy-in'.")
        suggestions.append("Pare de empurrar a solução. Tente investigar a resistência validando o sentimento do mentorado primeiro.")
    
    # Pattern: High Energy Alignment (Flow)
    if (card.energyMentor is not None and card.energyMentor > 7) and (card.energyMentee is not None and card.energyMentee > 7):
        analysis_parts.append("⚡ Sincronia Alta: Ambos estão com alta energia. É o momento ideal para desafios maiores (Stretch Goals).")
        suggestions.append("Aproveite o momento de fluxo para propor o passo mais ousado do plano.")

    # Pattern: Vague Goal
    if not card.menteeGoal or len(card.menteeGoal) < 10:
        analysis_parts.append("O objetivo principal parece vago ou não definido.")
        suggestions.append("A primeira missão é clarificar o objetivo. Sem meta clara, qualquer caminho serve.")

    # 3. Provocação Estratégica
    if card.decisionsOpen:
        analysis_parts.append(f"Você tem decisões em aberto: '{card.decisionsOpen}'.")
        suggestions.append("O que te impede de tomar essa decisão agora? Medo do erro ou falta de dados?")
    
    if not analysis_parts:
        analysis_parts.append("Ainda não há dados suficientes para uma leitura profunda. Preencha mais campos sobre sua percepção e energia.")
        suggestions.append("Comece avaliando o nível de energia de ambos na escala.")

    # Combine text
    final_analysis = " ".join(analysis_parts)
    
    # Default suggestions if none generated
    if not suggestions:
        suggestions = [
            "Tente identificar qual emoção esse mentorado desperta em você.",
            "Qual seria o 'pequeno passo' mais impactante para esta semana?"
        ]
    
    if "Smart Mock" not in final_analysis:
         final_analysis += " (Modo Offline - Configure GEMINI_API_KEY para IA Real)"

    return AnalysisResponse(analysis=final_analysis, suggestions=suggestions)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
