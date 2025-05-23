import React, { useState, useCallback } from 'react';
import { PaperPlaneIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'framer-motion';

interface UserInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  currentPlayerName?: string; // Added to show whose turn it is
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, isLoading, currentPlayerName }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSubmit(inputText.trim());
      setInputText('');
    }
  }, [inputText, isLoading, onSubmit]);

  const placeholderText = isLoading 
    ? "The DM ponders your party's fate..." 
    : currentPlayerName 
    ? `${currentPlayerName}, whisper your actions...` 
    : "Whisper your actions...";

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="p-4 md:p-5 border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-top-lg"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.2 }}
    >
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholderText}
          className="flex-grow p-3 bg-slate-700/60 text-gray-100 border border-slate-600/80 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 ease-in-out shadow-inner placeholder-gray-400"
          disabled={isLoading}
          style={{ fontFamily: "'Inter', sans-serif" }}
          aria-label="Your action input"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 flex items-center justify-center w-12 h-12 shadow-md hover:shadow-lg"
          aria-label="Send message"
        >
          {isLoading ? (
            <LoadingSpinner size="w-5 h-5" color="text-gray-900" />
          ) : (
            <PaperPlaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default UserInput;
