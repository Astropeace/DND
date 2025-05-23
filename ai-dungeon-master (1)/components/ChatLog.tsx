import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ChatBubble from './ChatBubble';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatLogProps {
  messages: ChatMessage[];
}

const ChatLog: React.FC<ChatLogProps> = ({ messages }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div 
      className="flex-grow p-4 md:p-6 space-y-1 overflow-y-auto relative" // Removed bg, it's inherited
      style={{ 
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
      }}
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          // FIX: Replaced 'positionTransition' with 'layout' for Framer Motion layout animations.
          <motion.div 
            key={msg.id} 
            className="flex flex-col"
            layout // Animate layout changes (e.g., when new messages push others)
          >
            <ChatBubble message={msg} />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatLog;