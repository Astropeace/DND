
import React, { useState, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, MessageSender, GameState, CharacterProfile, TRAIT_NAMES, DEFAULT_MAX_HP } from './types';
import { initializeChat, sendMessageToDM } from './services/gameService';
import ChatLog from './components/ChatLog';
import UserInput from './components/UserInput';
import LoadingSpinner from './components/LoadingSpinner';
import CharacterCreation from './components/CharacterCreation';
import { MenuIcon, InventoryIcon, UserCircleIcon, HeartIcon } from './components/Icons'; // Added HeartIcon

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    chatHistory: [],
    isLoading: false,
    error: null,
    geminiChat: null,
    isCreatingCharacter: true,
    playerProfiles: [],
    currentPlayerIndex: 0,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const parsePlayerSpecificData = (
    dmText: string, 
    allPlayerNames: string[],
    dataType: 'inventory' | 'health'
  ): { playerName: string; data: string[] | { currentHP: number; maxHP: number } } | null => {
    let regex;
    if (dataType === 'inventory') {
      // Regex tries to capture "[Player Name]'s current inventory is:" OR "Inventory for [Player Name]:" etc. then "Nothing." OR item list.
      regex = new RegExp(`(${allPlayerNames.join('|')})'s\\s+(?:current\\s+inventory|inventory|pack|items|possessions)\\s*(?:is|now\\s*contains?|contains|are):\\s*(Nothing(?:\\s*\\.)?|[\\w\\s,-]+(?:and\\s+[\\w\\s,-]+)*\\s*\\.)`, 'i');
    } else { // health
      // Regex for "PlayerName's HP: current/max" or "PlayerName now has current/max HP"
      regex = new RegExp(`(${allPlayerNames.join('|')})(?:'s\\s*HP|\\s*now\\s*has|\\s*is\\s*at|\\s*health\\s*is):\\s*(\\d+)\\s*\\/\\s*(\\d+)(?:\\s*HP)?(?:\\s*\\.)?`, 'i');
    }
  
    const match = dmText.match(regex);
  
    if (match) {
      const playerName = match[1];
      if (dataType === 'inventory') {
        let inventoryString = match[2].trim();
        if (inventoryString.toLowerCase().startsWith("nothing")) {
          return { playerName, data: [] };
        }
        if (inventoryString.endsWith('.')) {
          inventoryString = inventoryString.slice(0, -1);
        }
        const items = inventoryString
          .replace(/\band\b/gi, ',')
          .split(/,|\n/)
          .map(item => {
            let cleanedItem = item.trim();
            if (cleanedItem.startsWith('- ') || cleanedItem.startsWith('* ')) {
              cleanedItem = cleanedItem.substring(2);
            }
            return cleanedItem.trim();
          })
          .filter(item => item.length > 0);
        return { playerName, data: items };
      } else { // health
        const currentHP = parseInt(match[2], 10);
        const maxHP = parseInt(match[3], 10);
        return { playerName, data: { currentHP, maxHP } };
      }
    }
    return null;
  };
  
  const addMessage = useCallback((sender: MessageSender, text: string, characterName?: string): string => {
    const newMessageId = `${Date.now()}-${Math.random()}`;
    setGameState(prevState => ({
      ...prevState,
      chatHistory: [...prevState.chatHistory, { id: newMessageId, sender, text, characterName }], 
    }));
    return newMessageId;
  }, []);

  const processDMResponse = useCallback(async (dmTextFull: string) => {
    const narrativeText = dmTextFull.trim();
        
    if (narrativeText) {
      addMessage(MessageSender.DM, narrativeText);
    }

    const playerNames = gameState.playerProfiles.map(p => p.characterName);

    // Try to parse inventory for any player mentioned
    const inventoryUpdate = parsePlayerSpecificData(dmTextFull, playerNames, 'inventory');
    if (inventoryUpdate) {
      setGameState(prevState => ({
        ...prevState,
        playerProfiles: prevState.playerProfiles.map(profile => 
          profile.characterName === inventoryUpdate.playerName 
            ? { ...profile, inventory: inventoryUpdate.data as string[] } 
            : profile
        ),
      }));
    }

    // Try to parse health for any player mentioned
    const healthUpdate = parsePlayerSpecificData(dmTextFull, playerNames, 'health');
    if (healthUpdate) {
      // FIX: Correctly map properties from parsed health data to player profile.
      // The 'healthUpdate.data' from parsePlayerSpecificData is of type { currentHP: number; maxHP: number; }
      // when dataType is 'health'. This needs to be mapped to 'currentHealth' and 'maxHealth' in CharacterProfile.
      // The original code attempted to spread `healthUpdate.data` cast to a type with different property names.
      const parsedHealthData = healthUpdate.data as { currentHP: number; maxHP: number; };

      setGameState(prevState => ({
        ...prevState,
        playerProfiles: prevState.playerProfiles.map(profile =>
          profile.characterName === healthUpdate.playerName
            ? { 
                ...profile, 
                currentHealth: parsedHealthData.currentHP, 
                maxHealth: parsedHealthData.maxHP 
              }
            : profile
        ),
      }));
    }

  }, [addMessage, gameState.playerProfiles]);

  const initializeGameAndFirstMessage = useCallback(async (chat: Chat, profiles: CharacterProfile[]) => {
    setGameState(prevState => ({ ...prevState, isLoading: true, error: null }));
    
    let initialPlayerMessage = "Our party is ready to begin. Here are the adventurers:\n";
    profiles.forEach(profile => {
      const traitSummary = TRAIT_NAMES.map(trait => `${trait.substring(0,3).toUpperCase()}: ${profile.traits[trait]}`).join(', ');
      initialPlayerMessage += `\nCharacter: ${profile.characterName}\nClass: ${profile.characterClass}\nTraits: ${traitSummary}\nStarting HP: ${profile.currentHealth}/${profile.maxHealth}\nTheir Tale Begins: "${profile.taleBeginning}"\n---`;
    });
    initialPlayerMessage += "\nWe are ready to start. What happens?"
    
    // The first "message" is from the system, detailing the party. DM will respond to this.
    addMessage(MessageSender.SYSTEM, `Game starting with party: ${profiles.map(p => p.characterName).join(', ')}.`);

    try {
      const response = await sendMessageToDM(chat, initialPlayerMessage); // This message is like a system setup for DM
      await processDMResponse(response.text);
    } catch (err) {
      console.error("Error processing initial DM response:", err);
      const errorText = err instanceof Error ? err.message : "An unknown error occurred with the DM.";
      addMessage(MessageSender.SYSTEM, `Error starting game: ${errorText}`);
      setGameState(prevState => ({ ...prevState, error: errorText }));
    } finally {
      setGameState(prevState => ({ ...prevState, isLoading: false }));
    }
  }, [addMessage, processDMResponse]);
  
  useEffect(() => {
    // Initialize chat once character creation is done and profiles are set
    if (!gameState.isCreatingCharacter && gameState.playerProfiles.length > 0 && !gameState.geminiChat && gameState.chatHistory.length === 0) {
      const initChat = async () => {
        try {
          setGameState(prevState => ({ ...prevState, isLoading: true, error: null }));
          const chatInstance = initializeChat();
          setGameState(prevState => ({ ...prevState, geminiChat: chatInstance }));
          // The first message to DM establishes all players
          await initializeGameAndFirstMessage(chatInstance, gameState.playerProfiles);
        } catch (err) {
          console.error("Chat Initialization or first message failed:", err);
          const errorText = err instanceof Error ? err.message : "Failed to initialize. Check API Key & Gemini setup.";
          addMessage(MessageSender.SYSTEM, `Critical Error: ${errorText}.`);
          setGameState(prevState => ({ ...prevState, error: errorText, isLoading: false }));
        }
      };
      initChat();
    }
  }, [gameState.isCreatingCharacter, gameState.playerProfiles, gameState.geminiChat, initializeGameAndFirstMessage, addMessage, gameState.chatHistory.length]);

  const handleUserInput = useCallback(async (inputText: string) => {
    if (!gameState.geminiChat || gameState.isLoading || gameState.isCreatingCharacter || gameState.playerProfiles.length === 0) return; 

    const currentProfile = gameState.playerProfiles[gameState.currentPlayerIndex];
    setGameState(prevState => ({ ...prevState, isLoading: true, error: null }));
    
    addMessage(MessageSender.PLAYER, inputText, currentProfile.characterName);
    
    const messageToDM = `${currentProfile.characterName}: ${inputText}`;

    try {
      const response = await sendMessageToDM(gameState.geminiChat, messageToDM);
      await processDMResponse(response.text);
      // Advance to next player's turn
      setGameState(prevState => ({
        ...prevState,
        currentPlayerIndex: (prevState.currentPlayerIndex + 1) % prevState.playerProfiles.length,
      }));
    } catch (err) {
      console.error("Error processing user input:", err);
      const errorText = err instanceof Error ? err.message : "An unknown error occurred with the DM.";
      addMessage(MessageSender.SYSTEM, `Error: ${errorText}`);
      setGameState(prevState => ({ ...prevState, error: errorText }));
    } finally {
      setGameState(prevState => ({ ...prevState, isLoading: false }));
    }
  }, [gameState.geminiChat, gameState.isLoading, gameState.isCreatingCharacter, gameState.playerProfiles, gameState.currentPlayerIndex, addMessage, processDMResponse]);

  const handlePartyCreationComplete = useCallback((profiles: CharacterProfile[]) => {
    setGameState(prevState => ({
      ...prevState,
      playerProfiles: profiles,
      isCreatingCharacter: false,
      isLoading: true, 
      currentPlayerIndex: 0, // Start with the first player
    }));
  }, []);

  if (gameState.isCreatingCharacter) {
    return <CharacterCreation onPartyComplete={handlePartyCreationComplete} />;
  }
  
  const currentActiveProfile = gameState.playerProfiles[gameState.currentPlayerIndex];

  if (gameState.isLoading && gameState.chatHistory.length <= 1 && !gameState.error) { // Allow 1 for system message
    const loadingMessage = "The Fates Weave Your Party's Saga...";
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-radial-gradient-bottom" style={{ fontFamily: "'Cinzel', serif" }}>
        <LoadingSpinner size="w-20 h-20" color="text-amber-400" />
        <p className="mt-6 text-2xl text-amber-300 animate-pulse">{loadingMessage}</p>
      </div>
    );
  }
  
  const MotionDiv = motion.div; 
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <MotionDiv 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="flex h-screen max-h-screen antialiased text-gray-200"
    >
      {/* Sidebar */}
      <motion.aside 
        className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 glassmorphic shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none md:w-80 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        initial={false}
        animate={{ 
          x: window.innerWidth < 768 ? (isSidebarOpen ? 0 : '-100%') : 0,
          width: window.innerWidth >= 768 ? 320 : 256 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {currentActiveProfile && (
          <>
            <div className="p-6 border-b border-gray-700/50 flex flex-col items-center">
              <UserCircleIcon className="w-24 h-24 text-slate-500 mb-3" /> {/* Smaller Icon */}
              <h2 className="text-2xl font-cinzel text-amber-400 text-center">
                {currentActiveProfile.characterName}
              </h2>
              <p className="text-sm text-amber-200/80 font-medievalsharp">
                The {currentActiveProfile.characterClass}
              </p>
              <p className="mt-2 text-xs text-gray-400">(Currently Active Player)</p>
            </div>
            <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
              {/* Health Display */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold font-cinzel text-amber-300 mb-2 flex items-center">
                  <HeartIcon className="w-5 h-5 mr-2 text-red-400" />
                  Health
                </h3>
                <div className="p-2 bg-black/20 rounded">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">HP</span>
                        <span className="font-bold text-red-400">{currentActiveProfile.currentHealth} / {currentActiveProfile.maxHealth}</span>
                    </div>
                    <div className="w-full bg-red-900/70 rounded h-2.5">
                        <motion.div 
                            className="bg-gradient-to-r from-red-500 to-rose-600 h-2.5 rounded"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(currentActiveProfile.currentHealth / currentActiveProfile.maxHealth) * 100}%`}}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
              </div>

              {/* Traits Display */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold font-cinzel text-amber-300 mb-2">Traits</h3>
                {currentActiveProfile.traits && TRAIT_NAMES.map(trait => (
                  <motion.div 
                    key={trait}
                    className="flex justify-between items-center p-2 bg-black/20 rounded hover:bg-black/40 transition-colors duration-150"
                    variants={itemVariants}
                  >
                    <span className="text-sm text-gray-300">{trait}</span>
                    <span className="font-bold text-amber-400">{currentActiveProfile.traits[trait]}</span>
                  </motion.div>
                ))}
              </div>

              {/* Inventory Display */}
              <div>
                <h3 className="text-lg font-semibold font-cinzel text-amber-300 mb-2 flex items-center">
                  <InventoryIcon className="w-6 h-6 mr-2 text-amber-300" />
                  Inventory
                </h3>
                {currentActiveProfile.inventory.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    <AnimatePresence>
                      {currentActiveProfile.inventory.map((item, index) => (
                        <motion.li 
                          key={item + index}
                          className="p-2 bg-black/20 rounded hover:bg-black/40 transition-colors duration-150 text-gray-300"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm p-2">Their pack is empty.</p>
                )}
              </div>
            </nav>
          </>
        )}
        <div className="p-4 border-t border-gray-700/50 text-xs text-gray-500 text-center">
          Party Size: {gameState.playerProfiles.length}
          <br/>
          &copy; {new Date().getFullYear()} AI DM
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        <header className="p-4 bg-black/30 backdrop-blur-sm shadow-lg flex items-center justify-between md:justify-center relative">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="md:hidden p-2 text-amber-400 hover:text-amber-300 absolute left-4 top-1/2 -translate-y-1/2"
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="w-7 h-7"/>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-center font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-orange-400">
            AI Dungeon Master
          </h1>
        </header>
        
        <main className="flex-grow flex flex-col overflow-hidden p-3 md:p-4">
          <div className="flex-grow overflow-y-auto">
            <ChatLog messages={gameState.chatHistory} />
          </div>
        </main>

        {gameState.error && !gameState.isLoading && (
          <MotionDiv 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-800/80 text-center text-white text-sm font-medium"
          >
            <span className="font-bold">An Ominous Presence:</span> {gameState.error}
          </MotionDiv>
        )}
        
        <UserInput 
          onSubmit={handleUserInput} 
          isLoading={gameState.isLoading}
          currentPlayerName={currentActiveProfile?.characterName}
        />
      </div>
    </MotionDiv>
  );
};

export default App;
