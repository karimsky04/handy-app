"use client";

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase";
import type { Message } from "@/lib/types/expert";

interface MessagesTabProps {
  clientId: string;
  expertId: string;
  expertName: string;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return time;
  }

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}, ${time}`;
}

function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Mail icon for empty state
function MailIcon() {
  return (
    <svg
      className="w-12 h-12 text-gray-600 mx-auto mb-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

// Send icon
function SendIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

export default function MessagesTab({
  clientId,
  expertId,
  expertName,
}: MessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages on mount
  useEffect(() => {
    async function fetchMessages() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    }

    fetchMessages();
  }, [clientId]);

  // Scroll to bottom on initial load and when messages change
  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const lineHeight = 20;
      const maxHeight = lineHeight * 4 + 16; // 4 rows + padding
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || sending) return;

    setSending(true);
    setInputValue("");

    // Optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      sender_type: "expert",
      sender_id: expertId,
      sender_name: expertName,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .insert({
          client_id: clientId,
          sender_type: "expert",
          sender_id: expertId,
          sender_name: expertName,
          content,
        })
        .select()
        .single();

      if (error) {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        );
        console.error("Failed to send message:", error);
      } else if (data) {
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMessage.id ? (data as Message) : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
    } finally {
      setSending(false);
    }
  }, [inputValue, sending, clientId, expertId, expertName]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Build message groups with date dividers
  function renderMessages() {
    if (messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MailIcon />
            <p className="text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    let lastDateKey = "";
    let lastSenderType = "";
    let lastSenderId: string | null = "";

    messages.forEach((message, index) => {
      const currentDateKey = getDateKey(message.created_at);

      // Date divider
      if (currentDateKey !== lastDateKey) {
        elements.push(
          <div
            key={`date-${currentDateKey}-${index}`}
            className="flex items-center justify-center my-4"
          >
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="h-px w-12 bg-gray-700" />
              <span>{formatDateDivider(message.created_at)}</span>
              <span className="h-px w-12 bg-gray-700" />
            </div>
          </div>
        );
        lastSenderType = "";
        lastSenderId = "";
      }

      const isSameSender =
        message.sender_type === lastSenderType &&
        message.sender_id === lastSenderId &&
        message.sender_type !== "system";

      if (message.sender_type === "system") {
        elements.push(
          <div key={message.id} className="flex justify-center my-2">
            <p className="text-xs text-gray-500 italic max-w-[85%] text-center">
              {message.content}
            </p>
          </div>
        );
      } else if (message.sender_type === "expert") {
        elements.push(
          <div
            key={message.id}
            className={`flex flex-col items-end ${isSameSender ? "mt-1" : "mt-3"}`}
          >
            {!isSameSender && (
              <span className="text-xs text-gray-500 mr-1 mb-1">
                {message.sender_name}
              </span>
            )}
            <div className="bg-teal text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[75%] text-sm">
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
            <span className="text-xs text-gray-500 mr-1 mt-0.5">
              {formatTimestamp(message.created_at)}
            </span>
          </div>
        );
      } else {
        // client message
        elements.push(
          <div
            key={message.id}
            className={`flex flex-col items-start ${isSameSender ? "mt-1" : "mt-3"}`}
          >
            {!isSameSender && (
              <span className="text-xs text-gray-500 ml-1 mb-1">
                {message.sender_name}
              </span>
            )}
            <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[75%] text-sm">
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
            <span className="text-xs text-gray-500 ml-1 mt-0.5">
              {formatTimestamp(message.created_at)}
            </span>
          </div>
        );
      }

      lastDateKey = currentDateKey;
      lastSenderType = message.sender_type;
      lastSenderId = message.sender_id;
    });

    return (
      <div className="px-4 py-2">
        {elements}
        <div ref={messagesEndRef} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-280px)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading messages...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">{renderMessages()}</div>

      {/* Input area */}
      <div className="border-t border-gray-700 px-4 py-3 bg-navy-light">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gold/50 transition-colors"
            style={{ maxHeight: "96px" }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="bg-gold text-navy font-semibold rounded-lg px-4 py-2 text-sm hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            <SendIcon />
            Send
          </button>
        </div>
        <p className="text-[11px] text-gray-600 mt-1.5">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
