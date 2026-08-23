import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import { io } from "socket.io-client";
import { api, getToken, SOCKET_URL } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/bloodUtils";
import PulseMark from "../components/PulseMark";

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [activeId, setActiveId] = useState(location.state?.withId || null);
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const sendingRef = useRef(false);

  // One persistent socket connection for the whole page -- messages arrive
  // instantly over this instead of the client polling the REST API.
  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token: getToken() } });
    socketRef.current = socket;
    socket.on("message:new", (message) => {
      setThread((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        if (message.threadId && message.threadId !== prev.threadIdHint) {
          // still append if it belongs to the currently open thread
        }
        return [...prev, message];
      });
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      const { contacts: rows } = await api.messages.contacts();
      setContacts(rows);
      setLoadingContacts(false);
    })();
  }, []);

  useEffect(() => {
    if (location.state?.withId) setActiveId(location.state.withId);
  }, [location.state]);

  const active = contacts.find((c) => c.id === activeId);

  useEffect(() => {
    if (!activeId) {
      setThread([]);
      return;
    }
    let cancelled = false;
    setLoadingThread(true);
    api.messages.thread(activeId).then(({ threadId, messages }) => {
      if (cancelled) return;
      setThread(messages.map((m) => ({ ...m, threadId })));
      setLoadingThread(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread]);

  // Only show messages belonging to the thread that's actually open right now.
  const visibleThread = useMemo(() => {
    if (!activeId) return [];
    return thread.filter((m) => !m.threadId || m.senderId === user.id || m.senderId === activeId);
  }, [thread, activeId, user.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId || sendingRef.current) return;
    sendingRef.current = true;
    setDraft("");

    // Optimistic append so sending FEELS instant, then reconcile with the
    // server response (and the socket echo, deduped by id, above).
    const tempId = `temp_${Date.now()}`;
    const optimistic = { id: tempId, senderId: user.id, senderName: user.fullName, body, createdAt: new Date().toISOString() };
    setThread((prev) => [...prev, optimistic]);

    setSending(true);
    try {
      const { message } = await api.messages.send(activeId, body);
      setThread((prev) => {
        // The socket "message:new" broadcast (sent to the sender's own room
        // too, for multi-device sync) can arrive before this HTTP response
        // does. If it already landed, just drop the optimistic placeholder
        // instead of also keeping this response's copy -- otherwise the
        // same message ends up rendered twice.
        if (prev.some((m) => m.id === message.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? message : m));
      });
    } catch {
      setThread((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-crimson-950 mb-6">Messages</h1>
      <div className="bg-white rounded-2xl border border-crimson-100 overflow-hidden flex h-[calc(100vh-220px)] min-h-[420px]">
        <div className={`w-full sm:w-72 shrink-0 border-r border-crimson-100 overflow-y-auto ${active ? "hidden sm:block" : ""}`}>
          {loadingContacts ? (
            <div className="flex justify-center py-10"><PulseMark size={36} ring /></div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-crimson-900/40 text-center py-10 px-4">
              No one to message yet. Contacts appear here once you view a donor or a blood request.
            </p>
          ) : (
            contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-crimson-50 transition-colors ${
                  activeId === c.id ? "bg-crimson-50" : "hover:bg-crimson-50/50"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-crimson-100 text-crimson-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {initials(c.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-crimson-950 truncate">{c.name}</p>
                  <p className="text-xs text-crimson-900/40 truncate">{c.subtitle}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className={`flex-1 flex-col ${active ? "flex" : "hidden sm:flex"}`}>
          {active ? (
            <>
              <div className="px-5 py-4 border-b border-crimson-100 flex items-center gap-3">
                <button
                  className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-crimson-50 text-crimson-700"
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="w-8 h-8 rounded-full bg-crimson-100 text-crimson-700 text-xs font-bold flex items-center justify-center">
                  {initials(active.name)}
                </div>
                <div>
                  <p className="font-semibold text-crimson-950 text-sm">{active.name}</p>
                  <p className="text-xs text-crimson-900/40">{active.subtitle}</p>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingThread ? (
                  <div className="flex justify-center py-10"><PulseMark size={32} ring /></div>
                ) : (
                  <>
                    {visibleThread.length === 0 && (
                      <p className="text-center text-sm text-crimson-900/40 mt-10">
                        Say hello to start the conversation.
                      </p>
                    )}
                    {visibleThread.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          m.senderId === user.id
                            ? "ml-auto gradient-brand text-white rounded-br-sm"
                            : "bg-crimson-50 text-crimson-950 rounded-bl-sm"
                        }`}
                      >
                        {m.body}
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-crimson-100 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-crimson-900/30">
              <MessageSquare size={40} />
              <p className="mt-3 text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
