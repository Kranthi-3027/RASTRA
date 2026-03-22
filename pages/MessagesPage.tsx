import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/mockApi.ts';
import { Send, Users, MessageSquare, Hash, ChevronRight, RefreshCw } from 'lucide-react';
import { COLORS } from '../constants';

const DEPT_LIST = ['Engineering', 'Water', 'Traffic', 'Ward', 'Admin'];

interface ChatMessage {
  id: string;
  channel: string;
  senderId: string;
  senderName: string;
  senderDept: string;
  text: string;
  timestamp: string;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
  currentDept: string; // "Engineering" | "Water" | "Traffic" | "Ward" | "Admin"
}

function makeChannel(a: string, b: string) {
  return [a, b].sort().join('-');
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function MessagesPage({ currentUserId, currentUserName, currentDept }: Props) {
  const [activeChannel, setActiveChannel] = useState<string>('GROUP');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // DM channels this dept can have
  const dmChannels = DEPT_LIST.filter(d => d !== currentDept).map(d => makeChannel(currentDept, d));

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(activeChannel);
      setMessages(data as ChatMessage[]);
    } catch {
      // silent fail on poll
    }
  }, [activeChannel]);

  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));

    // Poll every 5s for new messages
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.sendMessage({
        channel: activeChannel,
        senderId: currentUserId,
        senderName: currentUserName,
        senderDept: currentDept,
        text,
      });
      setInputText('');
      await fetchMessages();
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const channelLabel = (ch: string) => {
    if (ch === 'GROUP') return '# All Departments';
    const parts = ch.split('-');
    const other = parts.find(p => p !== currentDept) || ch;
    return `@ ${other} Dept`;
  };

  // Group messages by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach(msg => {
    const date = formatDate(msg.timestamp);
    if (!grouped.length || grouped[grouped.length - 1].date !== date) {
      grouped.push({ date, msgs: [msg] });
    } else {
      grouped[grouped.length - 1].msgs.push(msg);
    }
  });

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-wide uppercase">Messages</h2>
          <p className="text-xs text-gray-400 mt-0.5">{currentDept} Dept</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Group chat */}
          <div className="px-2 mb-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 mb-1">Channels</p>
            <button
              onClick={() => setActiveChannel('GROUP')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeChannel === 'GROUP'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Users size={14} />
              <span className="truncate">All Departments</span>
            </button>
          </div>

          {/* DM channels */}
          <div className="px-2 mt-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 mb-1">Direct</p>
            {DEPT_LIST.filter(d => d !== currentDept).map(dept => {
              const ch = makeChannel(currentDept, dept);
              return (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(ch)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeChannel === ch
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <MessageSquare size={14} />
                  <span className="truncate">{dept}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {channelLabel(activeChannel)}
            </h3>
            <p className="text-xs text-gray-400">
              {activeChannel === 'GROUP' ? 'All department officials' : 'Direct message'}
            </p>
          </div>
          <button
            onClick={fetchMessages}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            grouped.map(({ date, msgs }) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                  <span className="text-[11px] text-gray-400 font-medium">{date}</span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                </div>
                {msgs.map((msg, i) => {
                  const isMe = msg.senderId === currentUserId;
                  const showSender = i === 0 || msgs[i - 1].senderId !== msg.senderId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showSender && !isMe && (
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5 ml-1">
                            {msg.senderName} <span className="text-gray-400 font-normal">· {msg.senderDept}</span>
                          </span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 mx-1">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Message ${channelLabel(activeChannel)}…`}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition placeholder-gray-400"
              style={{ maxHeight: 120 }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
