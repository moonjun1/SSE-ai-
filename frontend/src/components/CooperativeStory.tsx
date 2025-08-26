import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Send, Crown, Clock, Copy } from 'lucide-react';

interface CooperativeStoryProps {
  onBack: () => void;
  darkMode: boolean;
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isOnline: boolean;
}

interface StoryTurn {
  player: string;
  text: string;
  timestamp: number;
}

const CooperativeStory: React.FC<CooperativeStoryProps> = ({ onBack, darkMode }) => {
  const [gameState, setGameState] = useState<'setup' | 'waiting' | 'playing'>('setup');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurn, setCurrentTurn] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [storyContent, setStoryContent] = useState<StoryTurn[]>([]);
  const [myInput, setMyInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('fantasy');
  const [turnTimeLeft, setTurnTimeLeft] = useState(60);
  const [isConnected, setIsConnected] = useState(false);
  const websocket = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string>('');

  const genres = [
    { id: 'fantasy', name: '판타지', desc: '마법과 모험이 가득한 세계' },
    { id: 'sci-fi', name: 'SF', desc: '미래와 우주를 탐험하는 이야기' },
    { id: 'mystery', name: '미스터리', desc: '수수께끼와 추리가 중심인 스토리' },
    { id: 'horror', name: '호러', desc: '공포와 스릴이 넘치는 어두운 이야기' },
    { id: 'romance', name: '로맨스', desc: '사랑과 감정이 중심인 이야기' },
    { id: 'adventure', name: '어드벤처', desc: '액션과 모험이 가득한 스토리' }
  ];

  // 컴포넌트 언마운트 시 WebSocket 정리
  useEffect(() => {
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  // 턴 타이머
  useEffect(() => {
    if (gameState === 'playing' && isMyTurn && turnTimeLeft > 0) {
      const timer = setInterval(() => {
        setTurnTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState, isMyTurn, turnTimeLeft]);

  const createRoom = () => {
    if (!playerName.trim()) return;
    
    setIsHost(true);
    
    // WebSocket 연결 후 방 생성
    const playerId = 'player-' + Math.random().toString(36).substr(2, 9);
    playerIdRef.current = playerId;
    websocket.current = new WebSocket(`ws://localhost:8000/ws/${playerId}`);
    
    websocket.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket 연결됨');
      
      // 연결 후 즉시 방 생성 요청
      websocket.current?.send(JSON.stringify({
        type: 'create_room',
        player_name: playerName,
        game_settings: {
          genre: selectedGenre,
          model: 'openai-gpt3.5'
        }
      }));
    };

    websocket.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket 메시지:', message);
      
      if (message.type === 'room_created') {
        setRoomId(message.room_id);
        const playerData = Object.entries(message.room_info.players).map(([id, player]) => ({
          id,
          name: player.name,
          isHost: player.is_host,
          isOnline: player.is_online
        }));
        setPlayers(playerData);
        setGameState('waiting');
      } else if (message.type === 'room_joined') {
        const playerData = Object.entries(message.room_info.players).map(([id, player]) => ({
          id,
          name: player.name,
          isHost: player.is_host,
          isOnline: player.is_online
        }));
        setPlayers(playerData);
      } else if (message.type === 'player_joined') {
        const playerData = Object.entries(message.room_info.players).map(([id, player]) => ({
          id,
          name: player.name,
          isHost: player.is_host,
          isOnline: player.is_online
        }));
        setPlayers(playerData);
      } else if (message.type === 'game_started') {
        setGameState('playing');
        setStoryContent(message.story_content);
        setCurrentTurn(message.room_info.current_turn);
        setIsMyTurn(message.room_info.current_turn === playerIdRef.current);
      } else if (message.type === 'turn_submitted') {
        setStoryContent(message.story_content);
        setCurrentTurn(message.room_info.current_turn);
        setIsMyTurn(message.room_info.current_turn === playerIdRef.current);
      } else if (message.type === 'ai_turn_completed') {
        setStoryContent(message.story_content);
        setCurrentTurn(message.room_info.current_turn);
        setIsMyTurn(message.room_info.current_turn === playerIdRef.current);
      }
    };

    websocket.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket 연결 끊김');
    };

    websocket.current.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) return;
    
    setIsHost(false);
    
    // WebSocket 연결 후 방 참가
    const playerId = 'player-' + Math.random().toString(36).substr(2, 9);
    playerIdRef.current = playerId;
    websocket.current = new WebSocket(`ws://localhost:8000/ws/${playerId}`);
    
    websocket.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket 연결됨 (방 참가용)');
      
      // 연결 후 즉시 방 참가 요청
      websocket.current?.send(JSON.stringify({
        type: 'join_room',
        player_name: playerName,
        room_id: roomId
      }));
    };

    websocket.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket 메시지 (참가자):', message);
      
      if (message.type === 'room_joined') {
        const playerData = Object.entries(message.room_info.players).map(([id, player]) => ({
          id,
          name: player.name,
          isHost: player.is_host,
          isOnline: player.is_online
        }));
        setPlayers(playerData);
        setGameState('waiting');
      } else if (message.type === 'player_joined') {
        const playerData = Object.entries(message.room_info.players).map(([id, player]) => ({
          id,
          name: player.name,
          isHost: player.is_host,
          isOnline: player.is_online
        }));
        setPlayers(playerData);
      } else if (message.type === 'game_started') {
        setGameState('playing');
        setStoryContent(message.story_content);
        setCurrentTurn(message.room_info.current_turn);
        setIsMyTurn(message.room_info.current_turn === playerIdRef.current);
      } else if (message.type === 'turn_submitted') {
        setStoryContent(message.story_content);
        setCurrentTurn(message.room_info.current_turn);
        setIsMyTurn(message.room_info.current_turn === playerIdRef.current);
      } else if (message.type === 'ai_turn_completed') {
        setStoryContent(message.story_content);
        setCurrentTurn(message.room_info.current_turn);
        setIsMyTurn(message.room_info.current_turn === playerIdRef.current);
      } else if (message.type === 'error') {
        alert(`오류: ${message.message}`);
        setGameState('setup');
      }
    };

    websocket.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket 연결 끊김 (참가자)');
    };

    websocket.current.onerror = (error) => {
      console.error('WebSocket 오류 (참가자):', error);
    };
  };

  const startGame = () => {
    if (!isHost || !websocket.current) return;
    
    // WebSocket으로 게임 시작 요청
    websocket.current.send(JSON.stringify({
      type: 'start_game'
    }));
  };

  const submitTurn = () => {
    if (!myInput.trim() || !isMyTurn || !websocket.current) return;

    // WebSocket으로 턴 제출
    websocket.current.send(JSON.stringify({
      type: 'submit_turn',
      text: myInput
    }));

    setMyInput('');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  if (gameState === 'setup') {
    return (
      <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className={`border-b p-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Users className="w-6 h-6 text-blue-500" />
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              협력 스토리
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className={`p-6 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-purple-50'
            }`}>
              <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                AI와 함께하는 협력 스토리!
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                AI 어시스턴트와 함께 실시간으로 협력하여 흥미진진한 스토리를 만들어보세요. WebSocket 기반 실시간 게임입니다.
              </p>
            </div>

            {/* Player Name Input */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                플레이어 이름
              </h3>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="당신의 이름을 입력하세요"
                className={`w-full px-4 py-3 rounded-xl transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Room Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  새 방 만들기
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  새로운 게임 방을 생성하고 친구들을 초대하세요.
                </p>
                
                <div className="mb-4">
                  <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    장르 선택
                  </label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border focus:ring-2 focus:ring-blue-500`}
                  >
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name} - {genre.desc}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={createRoom}
                  disabled={!playerName.trim()}
                  className={`w-full p-3 rounded-xl font-semibold transition-all ${
                    !playerName.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : darkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Crown className="w-4 h-4 inline mr-2" />
                  방 만들기
                </button>
              </div>

              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  방 참가하기
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  친구가 만든 방의 코드를 입력하여 참가하세요.
                </p>
                
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="방 코드 입력 (예: ABC123)"
                  className={`w-full px-3 py-2 rounded-lg mb-4 transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                      : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                  } border focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
                
                <button
                  onClick={joinRoom}
                  disabled={!playerName.trim() || !roomId.trim()}
                  className={`w-full p-3 rounded-xl font-semibold transition-all ${
                    !playerName.trim() || !roomId.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : darkMode
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  방 참가하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className={`border-b p-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGameState('setup')}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Users className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                협력 스토리 - 대기실
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                방 코드: {roomId}
              </p>
            </div>
          </div>
          <button
            onClick={copyRoomId}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Copy className="w-4 h-4 inline mr-2" />
            복사
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className={`p-6 rounded-xl mb-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                플레이어 목록 ({players.length}/4)
              </h2>
              
              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        player.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {player.name}
                      </span>
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      player.isOnline 
                        ? darkMode ? 'text-green-400' : 'text-green-600'
                        : darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {player.isOnline ? '온라인' : '오프라인'}
                    </span>
                  </div>
                ))}
              </div>

              {(() => {
                console.log('게임 시작 버튼 조건:', { isHost, playersLength: players.length, condition: isHost && players.length >= 1 });
                return isHost && players.length >= 1;
              })() && (
                <button
                  onClick={startGame}
                  className={`w-full mt-6 p-3 rounded-xl font-semibold transition-all ${
                    darkMode
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  게임 시작하기
                </button>
              )}

              {!isHost && (
                <p className={`text-center mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  방장이 게임을 시작하기를 기다리고 있습니다...
                </p>
              )}
            </div>

            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                게임 정보
              </h3>
              <div className="space-y-2 text-sm">
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  <span className="font-medium">장르:</span> {genres.find(g => g.id === selectedGenre)?.name}
                </p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  <span className="font-medium">턴 제한:</span> 60초
                </p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  <span className="font-medium">최대 인원:</span> 4명
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className={`border-b p-4 flex items-center justify-between ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGameState('waiting')}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              협력 스토리
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isMyTurn ? '당신의 차례' : `${players.find(p => p.id === currentTurn)?.name}의 차례`}
            </p>
          </div>
        </div>
        
        {isMyTurn && (
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${
              turnTimeLeft <= 10 ? 'text-red-500' : darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{turnTimeLeft}초</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className={`p-6 rounded-xl mb-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              스토리
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-auto">
              {storyContent.map((turn, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    turn.player === 'AI'
                      ? darkMode ? 'bg-purple-900/20 border border-purple-700' : 'bg-purple-50 border border-purple-200'
                      : darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-sm ${
                      turn.player === 'AI' 
                        ? 'text-purple-500'
                        : darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {turn.player}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(turn.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className={`whitespace-pre-line ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {turn.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {isMyTurn && (
            <div className={`p-6 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                당신의 차례입니다!
              </h3>
              
              <textarea
                value={myInput}
                onChange={(e) => setMyInput(e.target.value)}
                placeholder="이야기를 이어서 작성해주세요... (최대 200자)"
                maxLength={200}
                className={`w-full px-4 py-3 rounded-lg h-32 transition-colors resize-none ${
                  darkMode
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              
              <div className="flex items-center justify-between mt-3">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {myInput.length}/200자
                </span>
                
                <button
                  onClick={submitTurn}
                  disabled={!myInput.trim()}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    !myInput.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : darkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Send className="w-4 h-4 inline mr-2" />
                  턴 완료
                </button>
              </div>
            </div>
          )}

          {!isMyTurn && (
            <div className={`p-6 rounded-xl text-center ${
              darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {players.find(p => p.id === currentTurn)?.name}님이 스토리를 작성 중입니다...
              </p>
              <div className="mt-3">
                <div className="animate-pulse flex justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Players Status */}
          <div className={`mt-6 p-4 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              플레이어 상태
            </h4>
            <div className="flex gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    player.id === currentTurn
                      ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    player.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  {player.name}
                  {player.isHost && <Crown className="w-3 h-3 text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CooperativeStory };