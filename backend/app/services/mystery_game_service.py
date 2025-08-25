import json
import random
import uuid
from typing import List, Dict, Any, Optional
from ..services.simple_ai_service import SimpleAIService

class MysteryGameService:
    def __init__(self):
        self.ai_service = SimpleAIService()
        self.mystery_contexts = {}
        
    def create_new_mystery(self, session_id: str, difficulty: str = "normal", model: str = "openai-gpt3.5") -> Dict[str, Any]:
        """새로운 추리 게임 생성"""
        
        difficulty_settings = {
            "easy": {
                "suspects": 3,
                "clues": 5,
                "red_herrings": 1,
                "description": "초급 - 3명의 용의자, 단순한 사건"
            },
            "normal": {
                "suspects": 4,
                "clues": 7,
                "red_herrings": 2,
                "description": "중급 - 4명의 용의자, 적당한 복잡성"
            },
            "hard": {
                "suspects": 5,
                "clues": 10,
                "red_herrings": 3,
                "description": "고급 - 5명의 용의자, 복잡한 사건"
            }
        }
        
        settings = difficulty_settings.get(difficulty, difficulty_settings["normal"])
        
        system_prompt = f"""당신은 추리 게임 마스터입니다. 다음 조건으로 미스터리 사건을 생성하세요:

조건:
- 용의자 수: {settings['suspects']}명
- 단서 수: {settings['clues']}개
- 함정 단서: {settings['red_herrings']}개
- 한국어로 작성

JSON 형식으로 응답:
{{
  "case_title": "사건 제목",
  "case_description": "상황 설명 (3-4문장)",
  "location": "사건 발생 장소",
  "victim": "피해자 정보",
  "suspects": [
    {{
      "name": "용의자1 이름",
      "description": "외모/직업 설명",
      "alibi": "알리바이",
      "motive": "동기 (진범이 아닌 경우 빈 문자열)",
      "is_culprit": false
    }}
  ],
  "clues": [
    {{
      "id": 1,
      "description": "단서 설명",
      "is_red_herring": false,
      "points_to": "연관된 용의자 이름"
    }}
  ],
  "solution": {{
    "culprit": "진범 이름",
    "method": "범행 방법",
    "reasoning": "추리 과정"
  }}
}}

주의사항:
1. 한 명만 진범으로 설정
2. 진범에게만 명확한 동기 부여
3. 단서들이 논리적으로 연결되도록 구성
4. 함정 단서는 다른 용의자를 의심하게 만드는 내용"""

        creation_prompt = f"난이도 {difficulty}의 새로운 추리 사건을 생성해주세요."
        
        # AI로부터 추리 사건 생성
        mystery_response = self.ai_service.generate_response(creation_prompt, [], model, system_prompt=system_prompt)
        
        try:
            # JSON 파싱 시도
            mystery_data = json.loads(mystery_response)
            
            # 게임 세션 컨텍스트 저장
            self.mystery_contexts[session_id] = {
                "mystery": mystery_data,
                "difficulty": difficulty,
                "model": model,
                "questions_asked": [],
                "clues_found": [],
                "max_questions": settings["clues"] + 3,
                "solved": False,
                "attempts": 0
            }
            
            return {
                "session_id": session_id,
                "case_title": mystery_data["case_title"],
                "case_description": mystery_data["case_description"],
                "location": mystery_data["location"],
                "victim": mystery_data["victim"],
                "suspects": [
                    {
                        "name": suspect["name"],
                        "description": suspect["description"],
                        "alibi": suspect["alibi"]
                    } for suspect in mystery_data["suspects"]
                ],
                "max_questions": settings["clues"] + 3,
                "difficulty": settings["description"]
            }
            
        except json.JSONDecodeError:
            return {"error": "사건 생성 중 오류가 발생했습니다"}
    
    def ask_question(self, session_id: str, question: str) -> Dict[str, Any]:
        """질문하기"""
        if session_id not in self.mystery_contexts:
            return {"error": "게임 세션을 찾을 수 없습니다"}
        
        context = self.mystery_contexts[session_id]
        
        if context["solved"]:
            return {"error": "이미 해결된 사건입니다"}
        
        if len(context["questions_asked"]) >= context["max_questions"]:
            return {"error": f"최대 질문 수({context['max_questions']}개)에 도달했습니다"}
        
        # 질문 기록
        context["questions_asked"].append(question)
        
        # AI에게 질문에 대한 답변 요청
        mystery_info = context["mystery"]
        
        system_prompt = f"""당신은 추리 게임의 NPC입니다. 다음 사건 정보를 바탕으로 플레이어의 질문에 답하세요:

사건 정보:
- 제목: {mystery_info['case_title']}
- 상황: {mystery_info['case_description']}
- 장소: {mystery_info['location']}
- 피해자: {mystery_info['victim']}

용의자들:
{json.dumps(mystery_info['suspects'], ensure_ascii=False, indent=2)}

단서들:
{json.dumps(mystery_info['clues'], ensure_ascii=False, indent=2)}

규칙:
1. 질문에 대해 적절한 정보만 제공
2. 너무 쉽게 답을 알려주지 않음
3. 단서를 발견했을 때만 해당 정보 공개
4. 자연스럽고 몰입감 있게 답변
5. 한국어로 답변

플레이어 질문: {question}"""

        answer_prompt = f"플레이어가 '{question}'라고 질문했습니다. 적절한 답변을 해주세요."
        
        # AI로부터 답변 생성
        answer_response = self.ai_service.generate_response(answer_prompt, [], context["model"], system_prompt=system_prompt)
        
        # 새로운 단서 발견 체크
        new_clue = self._check_new_clue(question, mystery_info["clues"])
        if new_clue and new_clue not in context["clues_found"]:
            context["clues_found"].append(new_clue)
        
        return {
            "answer": answer_response,
            "question_count": len(context["questions_asked"]),
            "max_questions": context["max_questions"],
            "new_clue": new_clue,
            "total_clues_found": len(context["clues_found"])
        }
    
    def ask_question_stream(self, session_id: str, question: str):
        """질문하기 (스트리밍)"""
        if session_id not in self.mystery_contexts:
            yield "오류: 게임 세션을 찾을 수 없습니다"
            return
        
        context = self.mystery_contexts[session_id]
        
        if context["solved"]:
            yield "이미 해결된 사건입니다"
            return
        
        if len(context["questions_asked"]) >= context["max_questions"]:
            yield f"최대 질문 수({context['max_questions']}개)에 도달했습니다"
            return
        
        # 질문 기록
        context["questions_asked"].append(question)
        
        # AI에게 질문에 대한 답변 요청
        mystery_info = context["mystery"]
        
        system_prompt = f"""당신은 추리 게임의 NPC입니다. 다음 사건 정보를 바탕으로 플레이어의 질문에 답하세요:

사건 정보:
- 제목: {mystery_info['case_title']}
- 상황: {mystery_info['case_description']}
- 장소: {mystery_info['location']}
- 피해자: {mystery_info['victim']}

용의자들:
{json.dumps(mystery_info['suspects'], ensure_ascii=False, indent=2)}

단서들:
{json.dumps(mystery_info['clues'], ensure_ascii=False, indent=2)}

규칙:
1. 질문에 대해 적절한 정보만 제공
2. 너무 쉽게 답을 알려주지 않음
3. 단서를 발견했을 때만 해당 정보 공개
4. 자연스럽고 몰입감 있게 답변
5. 한국어로 답변

플레이어 질문: {question}"""

        answer_prompt = f"플레이어가 '{question}'라고 질문했습니다. 적절한 답변을 해주세요."
        
        # AI 서비스에서 스트리밍으로 답변 생성
        from ..services.ai_service import AIService
        ai_service = AIService()
        
        answer_chunks = []
        for chunk in ai_service.stream_chat(answer_prompt, [], context["model"], system_prompt=system_prompt):
            answer_chunks.append(chunk)
            yield chunk
        
        # 완전한 답변을 대화 기록에 저장하고 새로운 단서 확인
        complete_answer = ''.join(answer_chunks)
        new_clue = self._check_new_clue(question, mystery_info["clues"])
        if new_clue and new_clue not in context["clues_found"]:
            context["clues_found"].append(new_clue)
    
    def make_accusation(self, session_id: str, accused_name: str, reasoning: str) -> Dict[str, Any]:
        """범인 지목하기"""
        if session_id not in self.mystery_contexts:
            return {"error": "게임 세션을 찾을 수 없습니다"}
        
        context = self.mystery_contexts[session_id]
        mystery_info = context["mystery"]
        
        context["attempts"] += 1
        
        # 정답 확인
        correct_culprit = mystery_info["solution"]["culprit"]
        is_correct = accused_name.strip() == correct_culprit.strip()
        
        if is_correct:
            context["solved"] = True
            return {
                "correct": True,
                "message": f"정답입니다! {accused_name}이(가) 진범입니다.",
                "solution": mystery_info["solution"],
                "attempts": context["attempts"],
                "questions_used": len(context["questions_asked"])
            }
        else:
            # 3번 틀리면 게임 오버
            if context["attempts"] >= 3:
                context["solved"] = True
                return {
                    "correct": False,
                    "game_over": True,
                    "message": f"3번 모두 틀렸습니다. 정답은 {correct_culprit}이었습니다.",
                    "solution": mystery_info["solution"],
                    "attempts": context["attempts"]
                }
            else:
                return {
                    "correct": False,
                    "message": f"틀렸습니다. {accused_name}은(는) 범인이 아닙니다. ({context['attempts']}/3 시도)",
                    "attempts": context["attempts"],
                    "remaining_attempts": 3 - context["attempts"]
                }
    
    def get_game_status(self, session_id: str) -> Dict[str, Any]:
        """게임 상태 조회"""
        if session_id not in self.mystery_contexts:
            return {"error": "게임 세션을 찾을 수 없습니다"}
        
        context = self.mystery_contexts[session_id]
        
        return {
            "session_id": session_id,
            "questions_asked": len(context["questions_asked"]),
            "max_questions": context["max_questions"],
            "clues_found": len(context["clues_found"]),
            "attempts": context["attempts"],
            "solved": context["solved"],
            "difficulty": context["difficulty"]
        }
    
    def _check_new_clue(self, question: str, clues: List[Dict]) -> Optional[Dict]:
        """질문과 관련된 새로운 단서가 있는지 확인"""
        question_lower = question.lower()
        
        # 키워드 매칭을 통해 관련 단서 찾기
        for clue in clues:
            clue_desc = clue["description"].lower()
            # 간단한 키워드 매칭 (실제로는 더 정교한 로직 필요)
            if any(word in clue_desc for word in question_lower.split() if len(word) > 1):
                return clue
        
        return None