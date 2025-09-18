import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Bot } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/input';
import { apiService } from '../../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your Diagnosia assistant. Ask me to book a test, view a report, or check an appointment status.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    try {
      const resp = await apiService.agentChat.send(message, sessionId);
      if (!sessionId && resp.data?.session_id) setSessionId(resp.data.session_id);
      const replies = (resp.data?.messages || []).map((m, idx) => ({
        id: Date.now() + idx + 1,
        type: 'bot',
        content: m,
        timestamp: new Date()
      }));
      setMessages(prev => [...prev, ...replies]);
    } catch (e) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      const networkMsg = e?.message;
      let content;
      if (status) {
        content = serverMsg ? `Error ${status}: ${serverMsg}` : `Error ${status}: Unexpected server error.`;
      } else {
        content = serverMsg || `Network error: ${networkMsg || 'Request failed (no response). Check backend console.'}`;
      }
      setMessages(prev => [...prev, { id: Date.now() + 999, type: 'bot', content, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-96 h-16' : 'w-[30rem] h-[36rem]' /* 30rem ≈ 480px width, 36rem ≈ 576px height */
    }`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Diagnosia Assistant</h3>
              <p className="text-xs text-blue-100">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Expanded message bubble max width to better use enlarged container */}
                  <div className={`max-w-sm lg:max-w-lg px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    {message.type === 'bot' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Diagnosia Assistant</span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    
                    {/* (Previously tips/options - now dynamic free-form text from agents) */}
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              {/* Separate input and send button */}
              <div className="flex gap-2 w-full">
                <div className="flex-1 min-w-0">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    containerClassName="w-full"
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                  aria-label="Send message"
                  className="px-3 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Powered by intelligent agents. Ask me to book tests, view reports, or check appointment status.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
