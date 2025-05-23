import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CharacterTraits, TraitName, TRAIT_NAMES, BASE_TRAIT_VALUE, TOTAL_ALLOCATION_POINTS, MAX_ADDITIONAL_POINTS_PER_TRAIT, MAX_TRAIT_VALUE_AFTER_ALLOCATION, CharacterProfile, DEFAULT_MAX_HP } from '../types';
import { PlusIcon, MinusIcon, CheckIcon, SparklesIcon, UserCircleIcon as NameIcon, BookOpenIcon } from './Icons';

interface CharacterCreationProps {
  onPartyComplete: (profiles: CharacterProfile[]) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onPartyComplete }) => {
  const initialTraits = TRAIT_NAMES.reduce((acc, trait) => {
    acc[trait] = BASE_TRAIT_VALUE;
    return acc;
  }, {} as CharacterTraits);

  const [partyProfiles, setPartyProfiles] = useState<CharacterProfile[]>([]);
  
  const [characterName, setCharacterName] = useState<string>('');
  const [traits, setTraits] = useState<CharacterTraits>({ ...initialTraits });
  const [pointsRemaining, setPointsRemaining] = useState<number>(TOTAL_ALLOCATION_POINTS);
  const [characterClass, setCharacterClass] = useState<string>('');
  const [taleBeginning, setTaleBeginning] = useState<string>('');
  
  const [isAddingAnother, setIsAddingAnother] = useState(true); // Start by creating the first character

  const resetFormForNewCharacter = () => {
    setCharacterName('');
    setTraits({ ...initialTraits });
    setPointsRemaining(TOTAL_ALLOCATION_POINTS);
    setCharacterClass('');
    setTaleBeginning('');
  };

  const handleTraitChange = useCallback((traitName: TraitName, increment: boolean) => {
    setTraits(prevTraits => {
      const currentValue = prevTraits[traitName];
      let newValue = currentValue;

      if (increment) {
        if (pointsRemaining > 0 && currentValue < MAX_TRAIT_VALUE_AFTER_ALLOCATION && (currentValue - BASE_TRAIT_VALUE) < MAX_ADDITIONAL_POINTS_PER_TRAIT) {
          newValue = currentValue + 1;
          setPointsRemaining(pr => pr - 1);
        }
      } else {
        if (currentValue > BASE_TRAIT_VALUE) {
          newValue = currentValue - 1;
          setPointsRemaining(pr => pr + 1);
        }
      }
      return { ...prevTraits, [traitName]: newValue };
    });
  }, [pointsRemaining]);

  const handleAddCharacterToParty = useCallback(() => {
    if (pointsRemaining === 0 && characterName.trim() !== '' && characterClass.trim() !== '' && taleBeginning.trim() !== '') {
      const newProfile: CharacterProfile = {
        id: generateId(),
        characterName: characterName.trim(),
        traits,
        characterClass: characterClass.trim(),
        taleBeginning: taleBeginning.trim(),
        inventory: [], // Initial inventory handled by DM based on tale
        currentHealth: DEFAULT_MAX_HP, // Default starting health
        maxHealth: DEFAULT_MAX_HP,     // Default starting health
      };
      setPartyProfiles(prevParty => [...prevParty, newProfile]);
      resetFormForNewCharacter();
      // setIsAddingAnother(false); // User will explicitly click "Add another" or "Start"
    }
  }, [characterName, traits, pointsRemaining, characterClass, taleBeginning]);

  const handleFinishPartyCreation = () => {
    if (partyProfiles.length > 0) {
      onPartyComplete(partyProfiles);
    }
  };
  
  const allCurrentPointsAllocated = pointsRemaining === 0;
  const allCurrentFieldsFilled = characterName.trim() !== '' && characterClass.trim() !== '' && taleBeginning.trim() !== '';
  const canAddCurrentCharacter = allCurrentPointsAllocated && allCurrentFieldsFilled;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: "circOut",
        when: "beforeChildren",
        staggerChildren: 0.07 
      } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 120 } },
  };

  const inputFieldStyle = "w-full p-3 bg-slate-700/60 text-gray-100 border border-slate-600/80 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 ease-in-out shadow-inner placeholder-gray-400";
  const labelStyle = "block text-amber-300 font-cinzel text-lg mb-2";

  return (
    <motion.div 
      className="flex flex-col items-center justify-start min-h-screen p-4 selection:bg-amber-500 selection:text-black overflow-y-auto pt-10 pb-10" // Allow scroll
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="glassmorphic p-6 md:p-10 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700/50 mb-8"
        variants={itemVariants} 
      >
        <h1 className="text-4xl md:text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-orange-400 mb-4 font-cinzel">
          Forge Your Party
        </h1>
        <p className="text-center text-gray-300 mb-8">Create characters for your adventure. Current Party Size: {partyProfiles.length}</p>
        
        <h2 className="text-2xl font-cinzel text-amber-200 mb-6 text-center border-b border-amber-500/30 pb-3">
          {partyProfiles.length > 0 ? `Adding Adventurer #${partyProfiles.length + 1}` : "Create First Adventurer"}
        </h2>

        {/* Character Name Input */}
        <motion.div className="mb-6" variants={itemVariants}>
          <label htmlFor="characterName" className={labelStyle}>Character's Name</label>
          <div className="relative">
            <NameIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="characterName"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="e.g., Elara Meadowlight, Gorok Stonefist"
              className={`${inputFieldStyle} pl-10`}
              aria-label="Character Name"
            />
          </div>
        </motion.div>

        {/* Character Class Input */}
        <motion.div className="mb-6" variants={itemVariants}>
          <label htmlFor="characterClass" className={labelStyle}>Character Class</label>
          <div className="relative">
            <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="characterClass"
              value={characterClass}
              onChange={(e) => setCharacterClass(e.target.value)}
              placeholder="e.g., Warrior, Mage, Rogue, Bard"
              className={`${inputFieldStyle} pl-10`}
              aria-label="Character Class"
            />
          </div>
        </motion.div>

        {/* The Beginning of Your Tale Input */}
        <motion.div className="mb-8" variants={itemVariants}>
          <label htmlFor="taleBeginning" className={labelStyle}>The Beginning of Their Tale</label>
           <div className="relative">
            <BookOpenIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              id="taleBeginning"
              value={taleBeginning}
              onChange={(e) => setTaleBeginning(e.target.value)}
              placeholder="Describe this character's situation or the start of their adventure..."
              className={`${inputFieldStyle} pl-10 h-32 resize-none`}
              aria-label="The Beginning of Your Tale"
              rows={4}
            />
          </div>
        </motion.div>
        
        <motion.hr variants={itemVariants} className="border-slate-600/50 my-8" />

        <motion.p 
          className="text-center text-gray-300 mb-2"
          variants={itemVariants}
        >
          Distribute <strong className="text-amber-400 font-semibold text-lg">{TOTAL_ALLOCATION_POINTS}</strong> points among traits.
        </motion.p>
        <motion.p 
          className="text-center text-gray-400 text-sm mb-8"
          variants={itemVariants}
        >
          Each trait starts at <strong className="text-amber-300">{BASE_TRAIT_VALUE}</strong>, max <strong className="text-amber-300">{MAX_TRAIT_VALUE_AFTER_ALLOCATION}</strong>. (Max <strong className="text-amber-300">{MAX_ADDITIONAL_POINTS_PER_TRAIT}</strong> additional points per trait).
        </motion.p>

        <motion.div className="space-y-4 mb-8" variants={itemVariants}>
          {TRAIT_NAMES.map(traitName => (
            <motion.div 
              key={traitName} 
              className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg shadow-md border border-slate-600/70"
              variants={itemVariants}
            >
              <span className="text-lg font-semibold text-amber-400 font-cinzel w-1/3">{traitName}</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleTraitChange(traitName, false)}
                  disabled={traits[traitName] <= BASE_TRAIT_VALUE}
                  className="p-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow hover:shadow-md"
                  aria-label={`Decrease ${traitName}`}
                >
                  <MinusIcon className="w-5 h-5"/>
                </button>
                <span className="text-xl font-bold text-gray-100 w-10 text-center tabular-nums">{traits[traitName]}</span>
                <button
                  onClick={() => handleTraitChange(traitName, true)}
                  disabled={pointsRemaining === 0 || traits[traitName] >= MAX_TRAIT_VALUE_AFTER_ALLOCATION || (traits[traitName] - BASE_TRAIT_VALUE) >= MAX_ADDITIONAL_POINTS_PER_TRAIT}
                  className="p-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 shadow hover:shadow-md"
                  aria-label={`Increase ${traitName}`}
                >
                  <PlusIcon className="w-5 h-5"/>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="text-center mb-8" variants={itemVariants}>
          <p className="text-xl font-semibold font-cinzel">
            Points Unspent: <span className={`text-3xl font-bold ${pointsRemaining > 0 ? 'text-amber-400 animate-pulse' : 'text-green-400'}`}>{pointsRemaining}</span>
          </p>
        </motion.div>

        <motion.button
          onClick={handleAddCharacterToParty}
          disabled={!canAddCurrentCharacter}
          className="w-full p-3 mb-4 bg-gradient-to-br from-sky-600 to-blue-700 text-white rounded-lg text-lg font-semibold hover:from-sky-500 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          style={{ fontFamily: "'Cinzel', serif" }}
          variants={itemVariants}
          whileHover={{ scale: canAddCurrentCharacter ? 1.03 : 1 }}
          whileTap={{ scale: canAddCurrentCharacter ? 0.97 : 1 }}
        >
          <span>Add Adventurer to Party</span>
        </motion.button>

        {partyProfiles.length > 0 && (
          <motion.button
            onClick={handleFinishPartyCreation}
            className="w-full p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-gray-900 rounded-lg text-xl font-bold hover:from-amber-400 hover:to-orange-500 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            style={{ fontFamily: "'Cinzel', serif" }}
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <CheckIcon className="w-6 h-6" />
            <span>Start Adventure with Party ({partyProfiles.length} Player{partyProfiles.length > 1 ? 's' : ''})</span>
          </motion.button>
        )}
      </motion.div>
      {partyProfiles.length > 0 && (
        <motion.div className="w-full max-w-2xl mt-0 mb-8" variants={itemVariants}>
            <h3 className="text-2xl font-cinzel text-amber-300 mb-4 text-center">Current Party</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partyProfiles.map(p => (
                    <div key={p.id} className="glassmorphic p-4 rounded-lg border border-slate-700/50">
                        <p className="text-xl font-cinzel text-amber-400">{p.characterName}</p>
                        <p className="text-sm text-amber-200/80">{p.characterClass}</p>
                        <p className="text-xs text-gray-400 mt-1">HP: {p.currentHealth}/{p.maxHealth}</p>
                    </div>
                ))}
            </div>
        </motion.div>
      )}
      <motion.footer 
        className="mt-auto text-center text-xs text-gray-500" // Changed mt-10 to mt-auto
        initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.5}}
      >
        <p>&copy; {new Date().getFullYear()} AI Dungeon Master. The Fates Await.</p>
      </motion.footer>
    </motion.div>
  );
};

export default CharacterCreation;
