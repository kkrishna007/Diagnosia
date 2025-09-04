import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Bot, User } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/input';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your Diagnosia health assistant. How can I help you today?',
      timestamp: new Date(),
      options: [
        'Book a test',
        'View test reports',
        'Check appointment status',
        'Get health tips'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Predefined responses for demonstration
  const botResponses = {
    'book a test': {
      content: 'I can help you book a test! Here are some popular options:',
      options: ['Blood Tests', 'Urine Tests', 'Health Packages', 'Browse all tests']
    },
    'blood tests': {
      content: 'Here are some popular blood tests we offer:',
      options: ['Complete Blood Count (CBC)', 'Lipid Profile', 'Blood Sugar', 'Thyroid Profile']
    },
    'view test reports': {
      content: 'To view your test reports, please visit your dashboard. You can access all your completed reports there with download options.',
      options: ['Go to Dashboard', 'Contact Support']
    },
    'check appointment status': {
      content: 'To check your appointment status, I\'ll need your booking ID. You can also check all your appointments in your dashboard.',
      options: ['Enter Booking ID', 'Go to Dashboard']
    },
    'get health tips': {
      content: 'Here are some important health tips:',
      tips: [
        '💧 Stay hydrated - drink at least 8 glasses of water daily',
        '🥗 Eat a balanced diet rich in fruits and vegetables',
        '🏃‍♂️ Exercise regularly - at least 30 minutes daily',
        '😴 Get 7-8 hours of quality sleep',
        '🚭 Avoid smoking and limit alcohol consumption'
      ]
    },
    'complete blood count (cbc)': {
      content: 'Complete Blood Count (CBC) is a comprehensive blood test that evaluates your overall health. Price: ₹350',
      options: ['Book CBC Test', 'Learn more about CBC', 'View other tests']
    },
    'default': {
      content: 'I\'m here to help! You can ask me about booking tests, viewing reports, or getting health information.',
      options: ['Book a test', 'View test reports', 'Health tips', 'Contact support']
    }
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(message.toLowerCase());
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date(),
        options: botResponse.options,
        tips: botResponse.tips
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (userInput) => {
    // Simple keyword matching for demonstration
    for (const [key, response] of Object.entries(botResponses)) {
      if (userInput.includes(key)) {
        return response;
      }
    }
    return botResponses.default;
  };

  const handleOptionClick = (option) => {
    handleSendMessage(option);
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
      isMinimized ? 'w-80 h-16' : 'w-80 h-96'
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
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
                    
                    {/* Health Tips */}
                    {message.tips && (
                      <div className="mt-3 space-y-2">
                        {message.tips.map((tip, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {tip}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick Options */}
                    {message.options && (
                      <div className="mt-3 space-y-1">
                        {message.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className="block w-full text-left text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                    
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
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ask me about tests, reports, appointments, or health tips!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
