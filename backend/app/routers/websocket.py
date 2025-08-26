from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import json
import uuid
from ..services.websocket_manager import manager

router = APIRouter()


@router.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    """WebSocket 연결 엔드포인트"""
    await manager.connect(websocket, player_id)
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get('type')
            
            if message_type == 'create_room':
                # 새 방 생성
                room_id = manager.create_room(
                    host_player_id=player_id,
                    player_name=message['player_name'],
                    game_settings=message['game_settings']
                )
                
                await manager.send_personal_message({
                    'type': 'room_created',
                    'room_id': room_id,
                    'room_info': manager.get_room_info(room_id)
                }, player_id)
                
            elif message_type == 'join_room':
                # 기존 방 참가
                result = await manager.join_room(
                    player_id=player_id,
                    player_name=message['player_name'],
                    room_id=message['room_id']
                )
                
                if result['success']:
                    await manager.send_personal_message({
                        'type': 'room_joined',
                        'room_info': result['room_info']
                    }, player_id)
                else:
                    await manager.send_personal_message({
                        'type': 'error',
                        'message': result['error']
                    }, player_id)
                    
            elif message_type == 'start_game':
                # 게임 시작
                room_id = manager.get_player_room(player_id)
                if room_id:
                    result = await manager.start_game(player_id, room_id)
                    
                    if not result['success']:
                        await manager.send_personal_message({
                            'type': 'error',
                            'message': result['error']
                        }, player_id)
                        
            elif message_type == 'submit_turn':
                # 턴 제출
                room_id = manager.get_player_room(player_id)
                if room_id:
                    result = await manager.submit_turn(
                        player_id=player_id,
                        room_id=room_id,
                        text=message['text']
                    )
                    
                    if not result['success']:
                        await manager.send_personal_message({
                            'type': 'error',
                            'message': result['error']
                        }, player_id)
                        
            elif message_type == 'leave_room':
                # 방 나가기
                room_id = manager.get_player_room(player_id)
                if room_id:
                    manager.leave_room(player_id, room_id)
                    
                    # 방의 다른 플레이어들에게 알림
                    await manager.send_room_message({
                        'type': 'player_left',
                        'player_id': player_id,
                        'room_info': manager.get_room_info(room_id)
                    }, room_id)
                    
            elif message_type == 'get_room_info':
                # 방 정보 조회
                room_id = manager.get_player_room(player_id)
                if room_id:
                    room_info = manager.get_room_info(room_id)
                    await manager.send_personal_message({
                        'type': 'room_info',
                        'room_info': room_info
                    }, player_id)
                    
            elif message_type == 'heartbeat':
                # 연결 상태 확인
                await manager.send_personal_message({
                    'type': 'heartbeat_response',
                    'timestamp': message.get('timestamp')
                }, player_id)
                
    except WebSocketDisconnect:
        manager.disconnect(player_id)
        
        # 방의 다른 플레이어들에게 연결 해제 알림
        room_id = manager.get_player_room(player_id)
        if room_id:
            await manager.send_room_message({
                'type': 'player_disconnected',
                'player_id': player_id,
                'room_info': manager.get_room_info(room_id)
            }, room_id)
    except Exception as e:
        print(f"WebSocket error for player {player_id}: {e}")
        manager.disconnect(player_id)


@router.get("/ws/rooms")
async def get_active_rooms():
    """활성 방 목록 조회 (디버깅용)"""
    return {
        'active_connections': len(manager.active_connections),
        'active_rooms': len(manager.rooms),
        'rooms': {
            room_id: {
                'player_count': len(room['players']),
                'game_state': room['game_state'],
                'created_at': room['created_at']
            }
            for room_id, room in manager.rooms.items()
        }
    }


@router.get("/ws/test")
async def get_websocket_test_page():
    """WebSocket 테스트 페이지"""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>WebSocket Test</title>
    </head>
    <body>
        <h1>WebSocket Connection Test</h1>
        <div id="status">Disconnected</div>
        <br>
        
        <div>
            <h3>Create Room</h3>
            <input type="text" id="playerName" placeholder="Player Name" value="TestPlayer">
            <select id="genre">
                <option value="fantasy">Fantasy</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="mystery">Mystery</option>
            </select>
            <button onclick="createRoom()">Create Room</button>
        </div>
        
        <div>
            <h3>Join Room</h3>
            <input type="text" id="roomId" placeholder="Room ID">
            <button onclick="joinRoom()">Join Room</button>
        </div>
        
        <div>
            <h3>Game Actions</h3>
            <button onclick="startGame()">Start Game</button>
            <textarea id="turnText" placeholder="Your turn text"></textarea>
            <button onclick="submitTurn()">Submit Turn</button>
        </div>
        
        <div>
            <h3>Messages</h3>
            <div id="messages" style="height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px;"></div>
        </div>
        
        <script>
            const playerId = 'test-' + Math.random().toString(36).substr(2, 9);
            let ws = null;
            
            function connect() {
                ws = new WebSocket(`ws://localhost:8000/ws/${playerId}`);
                
                ws.onopen = function(event) {
                    document.getElementById('status').textContent = 'Connected';
                    addMessage('Connected to WebSocket');
                };
                
                ws.onmessage = function(event) {
                    const message = JSON.parse(event.data);
                    addMessage('Received: ' + JSON.stringify(message, null, 2));
                };
                
                ws.onclose = function(event) {
                    document.getElementById('status').textContent = 'Disconnected';
                    addMessage('WebSocket closed');
                };
                
                ws.onerror = function(error) {
                    addMessage('WebSocket error: ' + error);
                };
            }
            
            function addMessage(message) {
                const messages = document.getElementById('messages');
                messages.innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
                messages.scrollTop = messages.scrollHeight;
            }
            
            function createRoom() {
                const playerName = document.getElementById('playerName').value;
                const genre = document.getElementById('genre').value;
                
                ws.send(JSON.stringify({
                    type: 'create_room',
                    player_name: playerName,
                    game_settings: {
                        genre: genre,
                        model: 'openai-gpt3.5'
                    }
                }));
            }
            
            function joinRoom() {
                const playerName = document.getElementById('playerName').value;
                const roomId = document.getElementById('roomId').value;
                
                ws.send(JSON.stringify({
                    type: 'join_room',
                    player_name: playerName,
                    room_id: roomId
                }));
            }
            
            function startGame() {
                ws.send(JSON.stringify({
                    type: 'start_game'
                }));
            }
            
            function submitTurn() {
                const text = document.getElementById('turnText').value;
                
                ws.send(JSON.stringify({
                    type: 'submit_turn',
                    text: text
                }));
                
                document.getElementById('turnText').value = '';
            }
            
            // 페이지 로드 시 연결
            connect();
        </script>
    </body>
    </html>
    """)