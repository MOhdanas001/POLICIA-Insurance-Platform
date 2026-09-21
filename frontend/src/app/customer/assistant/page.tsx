'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { Bot, Send, Sparkles, Plus, FileText, CheckCircle2, ShieldCheck, Terminal, BookOpen } from 'lucide-react';

export default function CustomerAIAssistantPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    "What is my next payment?",
    "How many active policies do I have?",
    "What is the status of my claim?",
    "Does my health policy cover hospitalization?",
    "What are the exclusions in my policy?",
    "What documents do I need for a claim?"
  ];

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const res = await apiRequest('/ai/assistant/conversations');
    if (res.success && res.data) {
      setConversations(res.data.conversations || []);
      if (res.data.conversations?.length > 0) {
        selectConversation(res.data.conversations[0].id);
      }
    }
  };

  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    const res = await apiRequest(`/ai/assistant/conversations/${convId}`);
    if (res.success && res.data) {
      setMessages(res.data.messages || []);
    }
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText || inputMessage;
    if (!textToSend.trim() || loading) return;

    setInputMessage('');
    setLoading(true);

    // Optimistic UI message
    const tempUserMsg = { id: `temp_${Date.now()}`, sender: 'user', content: textToSend };
    setMessages((prev) => [...prev, tempUserMsg]);

    const res = await apiRequest('/ai/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: textToSend,
        conversationId: activeConvId,
      }),
    });

    setLoading(false);

    if (res.success && res.data) {
      if (!activeConvId) {
        setActiveConvId(res.data.conversationId);
        fetchConversations();
      }
      setMessages((prev) => [
        ...prev.filter((m) => !m.id?.startsWith('temp_')),
        tempUserMsg,
        res.data.reply
      ]);
    } else {
      alert(res.message || 'AI assistant chat failed');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="AI Assistant" subtitle="Hybrid Tool Calling + Vector RAG powered by Google Gemini AI Engine." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6">
          
          {/* Left Conversations Sidebar */}
          <div className="w-full lg:w-72 bg-white rounded-3xl p-5 border border-warm-border shadow-soft-sm flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Conversations</span>
                <button
                  onClick={() => { setActiveConvId(null); setMessages([]); }}
                  className="p-2 rounded-xl bg-brand-peach text-brand-orange hover:bg-brand-orange hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[500px]">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`p-3 rounded-2xl text-left text-xs font-medium transition-all truncate ${
                      activeConvId === c.id
                        ? 'bg-brand-orange text-white font-bold shadow-soft-sm'
                        : 'bg-cream-50 text-charcoal hover:bg-brand-peach/50'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-warm-border text-center">
              <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider block">Authorized RAG Isolation</span>
              <span className="text-[10px] text-brand-orange font-semibold">Only your active policy docs indexed</span>
            </div>
          </div>

          {/* Main Chat Workspace */}
          <div className="flex-1 bg-white rounded-3xl border border-warm-border shadow-soft-sm flex flex-col justify-between min-h-[600px]">
            
            {/* Header */}
            <div className="p-5 border-b border-warm-border flex items-center gap-3 bg-cream-50/50">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-dark text-white flex items-center justify-center shadow-soft-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-charcoal">Gemini Hybrid Assistant</h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" /> Direct Tool Execution + Vector Cosine RAG
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="my-auto text-center max-w-md mx-auto py-8">
                  <div className="w-16 h-16 rounded-3xl bg-brand-peach text-brand-orange mx-auto flex items-center justify-center mb-4 ring-8 ring-brand-peach/40">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-extrabold text-charcoal">How can I help you today?</h3>
                  <p className="text-xs text-charcoal-muted mt-1">Ask questions about your insurance policies, claims status, payment deadlines, or terms & conditions.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6">
                    {suggestedPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSendMessage(p)}
                        className="p-3 rounded-2xl bg-cream-50 hover:bg-brand-peach/60 border border-warm-border text-left text-xs font-semibold text-charcoal transition-all shadow-soft-sm"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, idx) => {
                const isUser = m.sender === 'user';
                const toolCalls = typeof m.tool_calls === 'string' ? JSON.parse(m.tool_calls) : m.tool_calls;
                const citations = typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations;

                return (
                  <div key={m.id || idx} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isUser ? 'bg-charcoal text-white' : 'bg-brand-orange text-white'
                    }`}>
                      {isUser ? user?.firstName[0] || 'U' : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : ''}`}>
                      <div className={`p-4 rounded-3xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-brand-orange to-brand-dark text-white rounded-tr-none shadow-soft-sm'
                          : 'bg-cream-50/90 text-charcoal rounded-tl-none border border-warm-border'
                      }`}>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>

                      {/* Executed Tools Badge */}
                      {!isUser && toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {toolCalls.map((tc: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                              <Terminal className="w-3 h-3" /> Executed Tool: {tc}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* RAG Citation Card */}
                      {!isUser && citations && Array.isArray(citations) && citations.length > 0 && (
                        <div className="mt-1 p-3 rounded-2xl bg-white border border-brand-orange/30 shadow-soft-sm">
                          <span className="text-[10px] font-extrabold text-brand-orange uppercase flex items-center gap-1 mb-1">
                            <BookOpen className="w-3 h-3" /> Source Citation from Policy Document:
                          </span>
                          <p className="text-[11px] font-bold text-charcoal">{citations[0].policyName} — Section: {citations[0].section} (Page {citations[0].pageNumber})</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-orange text-white flex items-center justify-center animate-spin">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-muted">Thinking & executing authorized database tools...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-warm-border bg-cream-50/50">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about your policies, payments or claims..."
                  className="flex-1 bg-white border border-warm-border rounded-full px-5 py-3 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-orange/40 shadow-soft-sm"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="w-11 h-11 rounded-full bg-gradient-to-r from-brand-orange to-brand-dark text-white flex items-center justify-center shadow-soft-sm hover:opacity-95 transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
