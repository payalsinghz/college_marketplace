import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ArrowLeft, Send, MessageCircle, WandSparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000';
const getCurrentUserId = (authUser) => authUser?.id || authUser?._id || '';

const formatTime = (dateValue) =>
  new Date(dateValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Chat = () => {
  const { token, user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingCopilot, setIsGeneratingCopilot] = useState(false);
  const [copilotSuggestions, setCopilotSuggestions] = useState(null);
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeConversationId),
    [conversations, activeConversationId]
  );
  const currentUserId = useMemo(() => getCurrentUserId(user), [user]);

  const activePartner = useMemo(() => {
    if (!activeConversation || !user) return null;
    return activeConversation.participants.find((participant) => participant._id !== currentUserId);
  }, [activeConversation, currentUserId]);

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchConversations = async () => {
    const res = await axios.get(`${API_BASE}/api/chat/conversations`, authHeader);
    setConversations(res.data);
    return res.data;
  };

  const fetchMessages = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
        authHeader
      );
      setMessages(res.data);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    let mounted = true;

    const setup = async () => {
      try {
        setLoadingConversations(true);
        const recipientId = searchParams.get('user');
        const itemId = searchParams.get('item');

        if (recipientId && recipientId !== currentUserId) {
          await axios.post(
            `${API_BASE}/api/chat/conversations`,
            { recipientId, itemId: itemId || undefined },
            authHeader
          );
        }

        const data = await fetchConversations();
        if (!mounted) return;

        if (data.length > 0) {
          setActiveConversationId((current) => current || data[0]._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load chat data');
      } finally {
        if (mounted) setLoadingConversations(false);
      }
    };

    setup();
    return () => {
      mounted = false;
    };
  }, [token, user, searchParams, currentUserId]);

  useEffect(() => {
    if (!token || socketRef.current) return;

    const socket = io(API_BASE, {
      auth: { token }
    });

    socket.on('new_message', ({ conversationId, message }) => {
      setConversations((prev) =>
        prev
          .map((conversation) =>
            conversation._id === conversationId
              ? { ...conversation, lastMessage: message.text, lastMessageAt: message.createdAt }
              : conversation
          )
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );

      if (conversationId === activeConversationId) {
        setMessages((prev) => [...prev, message]);
      } else {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === conversationId
              ? { ...conversation, unreadCount: (conversation.unreadCount || 0) + 1 }
              : conversation
          )
        );
      }
    });

    socket.on('conversation_update', () => {
      fetchConversations().catch(() => {});
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    setCopilotSuggestions(null);
    fetchMessages(activeConversationId).catch(() => {
      setError('Failed to fetch messages for this conversation');
    });

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', { conversationId: activeConversationId });
    }

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation._id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
      )
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_conversation', { conversationId: activeConversationId });
      }
    };
  }, [activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateCopilotSuggestions = async () => {
    if (!activeConversationId || isGeneratingCopilot) return;

    try {
      setIsGeneratingCopilot(true);
      const res = await axios.post(
        `${API_BASE}/api/chat/conversations/${activeConversationId}/copilot`,
        {},
        authHeader
      );
      setCopilotSuggestions(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate negotiation suggestions');
    } finally {
      setIsGeneratingCopilot(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !activeConversationId || isSending) return;

    try {
      setIsSending(true);
      await axios.post(
        `${API_BASE}/api/chat/conversations/${activeConversationId}/messages`,
        { text: draft.trim() },
        authHeader
      );
      setDraft('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-page-shell">
        <aside className="chat-sidebar card">
          <div className="chat-sidebar-header">
            <Link to="/" className="chat-back-link">
              <ArrowLeft size={17} /> Marketplace
            </Link>
            <h2>Chats</h2>
          </div>

          {loadingConversations ? (
            <p className="chat-placeholder">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="chat-placeholder">Start a conversation from any item card.</p>
          ) : (
            <div className="chat-conversation-list">
              {conversations.map((conversation) => {
                const partner = conversation.participants.find(
                  (participant) => participant._id !== currentUserId
                );
                return (
                  <button
                    key={conversation._id}
                    onClick={() => setActiveConversationId(conversation._id)}
                    className={`chat-conversation-item ${
                      activeConversationId === conversation._id ? 'active' : ''
                    }`}
                  >
                    <div className="chat-conversation-top">
                      <strong>{partner?.name || 'Unknown user'}</strong>
                      <span>{formatTime(conversation.lastMessageAt || conversation.updatedAt)}</span>
                    </div>
                    <div className="chat-conversation-bottom">
                      <p>{conversation.lastMessage || 'No messages yet'}</p>
                      {(conversation.unreadCount || 0) > 0 && <em>{conversation.unreadCount}</em>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="chat-main card">
          {activeConversation ? (
            <>
              <header className="chat-main-header">
                <div>
                  <h3>{activePartner?.name || 'Conversation'}</h3>
                  <p>
                    {activeConversation.item?.title
                      ? `Discussing: ${activeConversation.item.title}`
                      : 'General conversation'}
                  </p>
                </div>
                <MessageCircle size={20} />
              </header>

              {loadingMessages ? (
                <div className="chat-message-feed chat-message-loading">Loading messages...</div>
              ) : (
                <div className="chat-message-feed">
                  {messages.map((message) => {
                    const isOwn = message.sender?._id === currentUserId;
                    return (
                      <div key={message._id} className={`chat-message-row ${isOwn ? 'own' : ''}`}>
                        <div className={`chat-message-bubble ${isOwn ? 'own' : ''}`}>
                          <p>{message.text}</p>
                          <span>{formatTime(message.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}

              <section className="chat-copilot">
                <div className="chat-copilot-head">
                  <div>
                    <h4>Negotiation Copilot</h4>
                    <p>Get polite reply, counter-offer, and deal summary suggestions.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={generateCopilotSuggestions}
                    disabled={isGeneratingCopilot || !activeConversationId}
                  >
                    <WandSparkles size={16} />
                    {isGeneratingCopilot ? 'Generating...' : 'Suggest Reply'}
                  </button>
                </div>

                {copilotSuggestions && (
                  <div className="chat-copilot-grid">
                    <button
                      type="button"
                      className="chat-copilot-card"
                      onClick={() => setDraft(copilotSuggestions.politeReply || '')}
                    >
                      <span>Polite Reply</span>
                      <p>{copilotSuggestions.politeReply}</p>
                    </button>
                    <button
                      type="button"
                      className="chat-copilot-card"
                      onClick={() => setDraft(copilotSuggestions.counterOffer || '')}
                    >
                      <span>Counter Offer</span>
                      <p>{copilotSuggestions.counterOffer}</p>
                    </button>
                    <button
                      type="button"
                      className="chat-copilot-card"
                      onClick={() => setDraft(copilotSuggestions.dealSummary || '')}
                    >
                      <span>Deal Summary</span>
                      <p>{copilotSuggestions.dealSummary}</p>
                    </button>
                  </div>
                )}
              </section>

              <form className="chat-compose" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Type your message..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={isSending || !draft.trim()}>
                  <Send size={16} />
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <MessageCircle size={32} />
              <h3>No chat selected</h3>
              <p>Open a chat from the left panel, or start one from an item.</p>
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
        </section>
      </div>
    </div>
  );
};

export default Chat;
