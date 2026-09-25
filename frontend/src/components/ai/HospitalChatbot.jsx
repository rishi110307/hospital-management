import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronDown } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "Hospital working hours?",
  "Doctor availability & appointments?",
  "How to access lab reports?",
  "Central pharmacy timings?",
  "Hospital floor map & navigation"
];

export const HospitalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am the SmartCare Hospital Information Assistant. How can I help you regarding hospital services, doctor schedules, or facilities today?",
      time: "Now"
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithHospitalBot(textToSend);
      const botMsg = {
        sender: 'bot',
        text: res.reply,
        disclaimer: res.disclaimer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I apologize, but I could not connect to the hospital database right now. Please try again or visit the front desk.",
          time: "Now"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.75rem',
            right: '1.75rem',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#0d9488',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 8px 20px rgba(13, 148, 136, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Open Hospital Information Chatbot"
        >
          <Bot size={26} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="card animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '1.75rem',
            right: '1.75rem',
            width: '380px',
            maxWidth: '90vw',
            height: '520px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 95,
            boxShadow: '0 15px 35px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Top Bar */}
          <div style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  SmartCare Assistant
                </div>
                <div style={{ fontSize: '0.65rem', color: '#38bdf8' }}>
                  Hospital Information Bot
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div style={{
            padding: '0.4rem 0.6rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundColor: '#ffffff'
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.825rem',
                  lineHeight: 1.45,
                  backgroundColor: m.sender === 'user' ? '#0d9488' : '#f1f5f9',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  whiteSpace: 'pre-line'
                }}>
                  {m.text}
                </div>
                {m.disclaimer && (
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    marginTop: '0.25rem',
                    maxWidth: '82%'
                  }}>
                    {m.disclaimer}
                  </div>
                )}
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  {m.time}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem' }}>
                <Bot size={14} color="#0d9488" />
                <span>SmartCare Bot is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '0.65rem 0.85rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
              placeholder="Ask hospital question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
