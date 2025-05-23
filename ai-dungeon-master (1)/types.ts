import { Chat } from "@google/genai";

export enum MessageSender {
  PLAYER = "Player",
  DM = "DM",
  SYSTEM = "System"
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  characterName?: string; // For player messages in multiplayer
}

export interface CharacterTraits {
  Strength: number;
  Dexterity: number;
  Constitution: number;
  Intelligence: number;
  Wisdom: number;
  Charisma: number;
}

export type TraitName = keyof CharacterTraits;

export const TRAIT_NAMES: TraitName[] = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
export const BASE_TRAIT_VALUE = 8;
export const TOTAL_ALLOCATION_POINTS = 10;
export const MAX_ADDITIONAL_POINTS_PER_TRAIT = 7; 
export const MAX_TRAIT_VALUE_AFTER_ALLOCATION = BASE_TRAIT_VALUE + MAX_ADDITIONAL_POINTS_PER_TRAIT;
export const DEFAULT_MAX_HP = 30; // Default max health for all characters

export interface CharacterProfile {
  id: string; // Unique ID for each character
  characterName: string;
  traits: CharacterTraits;
  characterClass: string;
  taleBeginning: string; 
  inventory: string[];
  currentHealth: number;
  maxHealth: number;
}

export interface GameState {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  geminiChat: Chat | null;
  isCreatingCharacter: boolean; // True during the party creation phase
  playerProfiles: CharacterProfile[]; // Array of all player characters
  currentPlayerIndex: number; // Index in playerProfiles for the current turn
}
