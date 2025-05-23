import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage, MessageSender } from '../types';
import { DiceIcon } from './Icons'; 

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isPlayer = message.sender === MessageSender.PLAYER;
  const isDM = message.sender === MessageSender.DM;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const bubbleAlignment = isPlayer ? 'self-end' : 'self-start';
  const bubbleColors = isPlayer
    ? 'bg-sky-700/70 border-sky-500/80' 
    : isDM
    ? 'bg-slate-800/70 border-slate-600/80' 
    : 'bg-red-800/70 border-red-600/80'; 

  // Use characterName for players, "You" as fallback, or specific names for DM/System
  const senderName = isPlayer ? (message.characterName || "Adventurer") : isDM ? "Dungeon Master" : "System";
  const senderColor = isPlayer ? 'text-sky-300' : isDM ? 'text-amber-400' : 'text-red-300';

  const diceRollRegex = /You rolled an? (\d+)(?: out of \d+)?(!|\.)?/i; // Generic "You rolled"
  const playerDiceRollRegex = new RegExp(`(${message.characterName || 'Someone'}),?\\s*you rolled an? (\\d+)(?: out of \\d+)?(!|\\.)?`, 'i');

  let diceMatch = null;
  if (isDM) {
    diceMatch = message.text.match(playerDiceRollRegex) || message.text.match(diceRollRegex);
  }
  
  const cleanedText = message.text.trim();

  const formattedText = cleanedText.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`max-w-xl md:max-w-2xl w-fit mb-4 p-4 shadow-xl rounded-xl border ${bubbleAlignment} ${bubbleColors} glassmorphic`}
    >
      <p className={`text-xs font-semibold mb-1 ${senderColor} font-cinzel`}>
        {senderName}
      </p>
      
      {isDM && diceMatch ? (
        <motion.div 
          className="flex items-center my-2 p-3 bg-black/30 rounded-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <DiceIcon className="w-10 h-10 mr-3 text-amber-400 animate-spin-slow" />
          <div>
            <p className="text-lg font-medievalsharp text-gray-100">
              {/* Display text before match, then styled dice roll, then text after match */}
              {message.text.substring(0, diceMatch.index)}
              <span className="text-2xl font-bold text-yellow-400">{diceMatch[1].endsWith(',') ? diceMatch[2] : diceMatch[1]}</span> {/* Handles if player name is captured vs generic "You" */}
              {diceMatch[1].endsWith(',') ? diceMatch[3] : diceMatch[2]} {/* Correct punctuation index */}
            </p>
            <p className="text-sm font-medievalsharp text-gray-100 mt-1">
                {message.text.substring(diceMatch.index + diceMatch[0].length)}
            </p>
          </div>
        </motion.div>
      ) : (
        <p className={`whitespace-pre-wrap ${isDM ? 'font-medievalsharp text-lg text-gray-100' : 'text-sm text-gray-200'}`}>
          {formattedText}
        </p>
      )}
    </motion.div>
  );
};

export default ChatBubble;
