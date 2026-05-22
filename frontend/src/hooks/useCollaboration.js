import { useEffect, useRef, useCallback, useState } from 'react';
import { getAccessToken } from '../services/api';

/**
 * useCollaboration — React hook for real-time collaboration WebSocket.
 * Manages connection, room join/leave, presence, and live quiz.
 */
export default function useCollaboration(roomId = null) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [members, setMembers] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [quizState, setQuizState] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [events, setEvents] = useState([]);
  const reconnectTimer = useRef(null);

  const addEvent = useCallback((evt) => {
    setEvents(prev => [...prev.slice(-49), { ...evt, _ts: Date.now() }]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = getAccessToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/collab${token ? `?token=${token}` : ''}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (roomId) ws.send(JSON.stringify({ type: 'join_room', roomId }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      // Auto-reconnect after 3s
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [roomId]);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'connected':
        setClientId(msg.clientId);
        break;
      case 'room_joined':
        setMembers(msg.members || []);
        addEvent({ type: 'joined', roomId: msg.roomId });
        break;
      case 'member_joined':
        setMembers(prev => [...prev, msg.member]);
        addEvent({ type: 'member_joined', name: msg.member?.name });
        break;
      case 'member_left':
        setMembers(prev => prev.filter(m => m.clientId !== msg.clientId));
        break;

      // Quiz events
      case 'quiz_created':
        setQuizState({ quizId: msg.quizId, role: 'host', status: 'waiting', questionCount: msg.questionCount });
        break;
      case 'quiz_available':
        addEvent({ type: 'quiz_available', quizId: msg.quizId, hostName: msg.hostName });
        break;
      case 'quiz_joined':
        setQuizState(prev => ({ ...prev, quizId: msg.quizId, role: 'participant', status: msg.status }));
        break;
      case 'quiz_participant_joined':
        addEvent({ type: 'participant_joined', name: msg.participant, count: msg.participantCount });
        break;
      case 'quiz_question':
        setQuizState(prev => ({
          ...prev, status: 'active',
          currentQuestion: { index: msg.questionIndex, total: msg.totalQuestions, question: msg.question, options: msg.options, timeLimit: msg.timeLimit },
          answered: false,
        }));
        if (msg.leaderboard) setLeaderboard(msg.leaderboard);
        break;
      case 'quiz_answer_result':
        setQuizState(prev => ({ ...prev, answered: true, lastResult: { isCorrect: msg.isCorrect, points: msg.points, totalScore: msg.totalScore, correctIndex: msg.correctIndex } }));
        break;
      case 'quiz_answer_received':
        addEvent({ type: 'answer_received', name: msg.participantName, count: msg.answeredCount, total: msg.totalParticipants });
        break;
      case 'quiz_finished':
        setQuizState(prev => ({ ...prev, status: 'finished' }));
        setLeaderboard(msg.leaderboard || []);
        break;
      case 'quiz_ended':
        setQuizState(null);
        addEvent({ type: 'quiz_ended', reason: msg.reason });
        break;

      case 'ping':
        wsRef.current?.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }, [addEvent]);

  // Send helper
  const sendMsg = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Public actions
  const joinRoom = useCallback((id) => sendMsg({ type: 'join_room', roomId: id }), [sendMsg]);
  const leaveRoom = useCallback(() => sendMsg({ type: 'leave_room' }), [sendMsg]);

  const createQuiz = useCallback((questions) => sendMsg({ type: 'quiz_create', questions }), [sendMsg]);
  const joinQuiz = useCallback((quizId) => sendMsg({ type: 'quiz_join', quizId }), [sendMsg]);
  const startQuiz = useCallback((quizId) => sendMsg({ type: 'quiz_start', quizId }), [sendMsg]);
  const answerQuiz = useCallback((quizId, answerIndex, timeTaken) =>
    sendMsg({ type: 'quiz_answer', quizId, answerIndex, timeTaken }), [sendMsg]);
  const nextQuestion = useCallback((quizId) => sendMsg({ type: 'quiz_next', quizId }), [sendMsg]);
  const endQuiz = useCallback((quizId) => sendMsg({ type: 'quiz_end', quizId }), [sendMsg]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    isConnected, clientId, members,
    quizState, leaderboard, events,
    joinRoom, leaveRoom,
    createQuiz, joinQuiz, startQuiz, answerQuiz, nextQuestion, endQuiz,
  };
}
