from typing import Dict, List, Optional
from fastapi import WebSocket
import json
import asyncio
from datetime import datetime
import uuid


class ConnectionManager:
    def __init__(self):
        # 활성 연결 관리
        self.active_connections: Dict[str, WebSocket] = {}
        # 방별 플레이어 관리
        self.rooms: Dict[str, Dict[str, any]] = {}
        # 플레이어별 방 정보
        self.player_rooms: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, player_id: str):
        """새 클라이언트 연결"""
        await websocket.accept()
        self.active_connections[player_id] = websocket
        print(f"Player {player_id} connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, player_id: str):
        """클라이언트 연결 해제"""
        if player_id in self.active_connections:
            del self.active_connections[player_id]
        
        # 플레이어가 속한 방에서 제거
        if player_id in self.player_rooms:
            room_id = self.player_rooms[player_id]
            self.leave_room(player_id, room_id)
        
        print(f"Player {player_id} disconnected. Active connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, player_id: str):
        """특정 플레이어에게 메시지 전송"""
        if player_id in self.active_connections:
            try:
                await self.active_connections[player_id].send_text(json.dumps(message))
            except:
                # 연결이 끊어진 경우
                self.disconnect(player_id)

    async def send_room_message(self, message: dict, room_id: str, exclude_player: Optional[str] = None):
        """방의 모든 플레이어에게 메시지 전송"""
        if room_id not in self.rooms:
            return

        room = self.rooms[room_id]
        disconnected_players = []
        
        for player_id in room['players']:
            if player_id != exclude_player and player_id in self.active_connections:
                try:
                    await self.active_connections[player_id].send_text(json.dumps(message))
                except:
                    disconnected_players.append(player_id)
        
        # 연결이 끊어진 플레이어들을 정리
        for player_id in disconnected_players:
            self.disconnect(player_id)

    def create_room(self, host_player_id: str, player_name: str, game_settings: dict) -> str:
        """새 게임 방 생성"""
        room_id = str(uuid.uuid4())[:8].upper()
        
        self.rooms[room_id] = {
            'host': host_player_id,
            'players': {
                host_player_id: {
                    'name': player_name,
                    'is_host': True,
                    'is_online': True,
                    'joined_at': datetime.now().isoformat()
                }
            },
            'game_state': 'waiting',
            'game_settings': game_settings,
            'created_at': datetime.now().isoformat(),
            'story_content': [],
            'current_turn': None,
            'turn_start_time': None
        }
        
        self.player_rooms[host_player_id] = room_id
        return room_id

    async def join_room(self, player_id: str, player_name: str, room_id: str) -> dict:
        """기존 방에 참가"""
        if room_id not in self.rooms:
            return {'success': False, 'error': '존재하지 않는 방입니다.'}
        
        room = self.rooms[room_id]
        
        if len(room['players']) >= 4:
            return {'success': False, 'error': '방이 가득 찼습니다.'}
        
        if room['game_state'] != 'waiting':
            return {'success': False, 'error': '게임이 이미 시작되었습니다.'}
        
        # 플레이어 추가
        room['players'][player_id] = {
            'name': player_name,
            'is_host': False,
            'is_online': True,
            'joined_at': datetime.now().isoformat()
        }
        
        self.player_rooms[player_id] = room_id
        
        # 방의 다른 플레이어들에게 새 플레이어 참가 알림
        await self.send_room_message({
            'type': 'player_joined',
            'player_id': player_id,
            'player_name': player_name,
            'room_info': self.get_room_info(room_id)
        }, room_id, exclude_player=player_id)
        
        return {'success': True, 'room_info': self.get_room_info(room_id)}

    def leave_room(self, player_id: str, room_id: str):
        """방에서 나가기"""
        if room_id not in self.rooms:
            return
        
        room = self.rooms[room_id]
        
        if player_id in room['players']:
            del room['players'][player_id]
        
        if player_id in self.player_rooms:
            del self.player_rooms[player_id]
        
        # 방이 비어있으면 삭제
        if len(room['players']) == 0:
            del self.rooms[room_id]
        else:
            # 호스트가 나갔으면 다른 플레이어를 호스트로 지정
            if room['host'] == player_id:
                new_host_id = list(room['players'].keys())[0]
                room['host'] = new_host_id
                room['players'][new_host_id]['is_host'] = True

    async def start_game(self, host_player_id: str, room_id: str) -> dict:
        """게임 시작"""
        if room_id not in self.rooms:
            return {'success': False, 'error': '존재하지 않는 방입니다.'}
        
        room = self.rooms[room_id]
        
        if room['host'] != host_player_id:
            return {'success': False, 'error': '호스트만 게임을 시작할 수 있습니다.'}
        
        # AI 플레이어가 없으면 자동으로 추가
        ai_player_exists = any(player['name'] == 'AI 어시스턴트' for player in room['players'].values())
        if not ai_player_exists:
            ai_player_id = f"ai_{room_id}"
            room['players'][ai_player_id] = {
                'name': 'AI 어시스턴트',
                'is_host': False,
                'is_online': True,
                'joined_at': datetime.now().isoformat()
            }
        
        if len(room['players']) < 1:
            return {'success': False, 'error': '최소 1명의 플레이어가 필요합니다.'}
        
        # 게임 시작
        room['game_state'] = 'playing'
        player_ids = list(room['players'].keys())
        room['current_turn'] = player_ids[0]  # 첫 번째 플레이어부터 시작
        room['turn_start_time'] = datetime.now().isoformat()
        
        # AI 스토리 시작 생성
        from .story_game_service import StoryGameService
        story_service = StoryGameService()
        
        try:
            initial_story = story_service.start_cooperative_story(
                room['game_settings']['genre'],
                room['game_settings']['model']
            )
            
            room['story_content'] = [{
                'player': 'AI',
                'text': initial_story['story'],
                'timestamp': datetime.now().isoformat()
            }]
            
            # 방의 모든 플레이어에게 게임 시작 알림
            await self.send_room_message({
                'type': 'game_started',
                'room_info': self.get_room_info(room_id),
                'story_content': room['story_content']
            }, room_id)
            
            return {'success': True}
            
        except Exception as e:
            return {'success': False, 'error': f'스토리 생성 중 오류: {str(e)}'}

    async def submit_turn(self, player_id: str, room_id: str, text: str) -> dict:
        """플레이어 턴 제출"""
        if room_id not in self.rooms:
            return {'success': False, 'error': '존재하지 않는 방입니다.'}
        
        room = self.rooms[room_id]
        
        if room['game_state'] != 'playing':
            return {'success': False, 'error': '게임이 진행 중이 아닙니다.'}
        
        if room['current_turn'] != player_id:
            return {'success': False, 'error': '현재 당신의 차례가 아닙니다.'}
        
        # 턴 추가
        player_name = room['players'][player_id]['name']
        room['story_content'].append({
            'player': player_name,
            'text': text,
            'timestamp': datetime.now().isoformat()
        })
        
        # 다음 턴으로 이동
        player_ids = list(room['players'].keys())
        current_index = player_ids.index(player_id)
        next_index = (current_index + 1) % len(player_ids)
        room['current_turn'] = player_ids[next_index]
        room['turn_start_time'] = datetime.now().isoformat()
        
        # 방의 모든 플레이어에게 업데이트 알림
        await self.send_room_message({
            'type': 'turn_submitted',
            'room_info': self.get_room_info(room_id),
            'story_content': room['story_content']
        }, room_id)
        
        # 다음 턴이 AI인 경우 자동으로 AI 턴 생성
        if room['current_turn'].startswith('ai_'):
            await self.handle_ai_turn(room_id)
        
        return {'success': True}

    async def handle_ai_turn(self, room_id: str):
        """AI 턴 자동 처리"""
        if room_id not in self.rooms:
            return
        
        room = self.rooms[room_id]
        
        try:
            # AI 스토리 생성
            from .story_game_service import StoryGameService
            story_service = StoryGameService()
            
            # 현재 스토리 내용을 AI에게 전달
            current_story = "\n".join([turn['text'] for turn in room['story_content']])
            
            ai_response = story_service.continue_cooperative_story(
                current_story,
                room['game_settings']['genre'],
                room['game_settings']['model']
            )
            
            # AI 턴 추가
            room['story_content'].append({
                'player': 'AI 어시스턴트',
                'text': ai_response['continuation'],
                'timestamp': datetime.now().isoformat()
            })
            
            # 다음 턴으로 이동
            player_ids = list(room['players'].keys())
            ai_player_id = room['current_turn']
            current_index = player_ids.index(ai_player_id)
            next_index = (current_index + 1) % len(player_ids)
            room['current_turn'] = player_ids[next_index]
            room['turn_start_time'] = datetime.now().isoformat()
            
            # 방의 모든 플레이어에게 AI 턴 알림
            await self.send_room_message({
                'type': 'ai_turn_completed',
                'room_info': self.get_room_info(room_id),
                'story_content': room['story_content']
            }, room_id)
            
        except Exception as e:
            print(f"AI turn generation error: {e}")
            # AI 턴 생성 실패 시 스킵하고 다음 플레이어로 이동
            player_ids = list(room['players'].keys())
            ai_player_id = room['current_turn']
            current_index = player_ids.index(ai_player_id)
            next_index = (current_index + 1) % len(player_ids)
            room['current_turn'] = player_ids[next_index]

    def get_room_info(self, room_id: str) -> Optional[dict]:
        """방 정보 조회"""
        if room_id not in self.rooms:
            return None
        
        room = self.rooms[room_id]
        return {
            'room_id': room_id,
            'host': room['host'],
            'players': room['players'],
            'game_state': room['game_state'],
            'game_settings': room['game_settings'],
            'current_turn': room.get('current_turn'),
            'player_count': len(room['players'])
        }

    def get_player_room(self, player_id: str) -> Optional[str]:
        """플레이어가 속한 방 ID 조회"""
        return self.player_rooms.get(player_id)


# 전역 ConnectionManager 인스턴스
manager = ConnectionManager()