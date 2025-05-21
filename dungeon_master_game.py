import requests
import json

# --- User Configurable Settings ---
# Please update these values if your local Language Model (LM) is running on a different
# IP address/port or if you are using a different model name.
LM_API_URL = "http://192.168.0.177:1234/v1/chat/completions"
LM_MODEL_NAME = "qwen3-4b"
# --- End User Configurable Settings ---

def generate_response(prompt_history: list, max_length: int = 200) -> str | None:
    """
    Generates a response from the local LLM server.

    Args:
        prompt_history: A list of messages representing the conversation history.
        max_length: The maximum number of tokens for the generated response.

    Returns:
        The generated message content as a string, or None if an error occurs.
    """
    api_url = LM_API_URL  # Use the global constant
    headers = {"Content-Type": "application/json"}
    data = {
        "model": LM_MODEL_NAME,  # Use the global constant
        "messages": prompt_history,
        "max_tokens": max_length,
        "temperature": 0.8, # Changed from 0.7
        "stream": True      # Added
    }

    print(f"\n[Debug LM Request]")
    print(f"  Method: POST")
    print(f"  URL: {api_url}")
    print(f"  Headers: {json.dumps(headers, indent=2)}")
    print(f"  Payload: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(api_url, headers=headers, json=data, stream=True) # Added stream=True
        response.raise_for_status()  # Check for HTTP errors before starting stream

        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith('data: '):
                    json_str = decoded_line[len('data: '):]
                    if json_str.strip() == "[DONE]":
                        # print("\n[Debug Stream] Received [DONE] signal.") # Optional debug
                        break # End of stream
                    try:
                        chunk = json.loads(json_str)
                        if chunk.get('choices') and len(chunk['choices']) > 0:
                            delta = chunk['choices'][0].get('delta', {})
                            content_piece = delta.get('content')
                            if content_piece:
                                yield content_piece
                    except json.JSONDecodeError:
                        print(f"\n[Debug Stream] Failed to decode JSON from stream: {json_str}")
                        # Decide if you want to continue or break on error
                        continue 
                    except KeyError:
                        # This might happen if the chunk structure is unexpected
                        # print(f"\n[Debug Stream] KeyError parsing chunk: {chunk}")
                        continue
        # After the loop, the generator naturally stops.

    except requests.exceptions.HTTPError as e:
        print(f"\n[LM Communication Error] Failed to get response from LM: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"[LM Communication Error] Status Code: {e.response.status_code}, Response: {e.response.text}")
        # No return/yield here, function just ends if it's a generator and an error occurs before first yield
    except requests.exceptions.RequestException as e: # Catches other network-related errors (e.g., connection refused)
        print(f"\n[LM Communication Error] Failed to connect or communicate with LM: {e}")
        # No return/yield here
    # The specific JSONDecodeError, KeyError, IndexError for the *full* response are removed
    # as errors during stream parsing are handled inside the loop.

def game_loop():
    print("Welcome to the AI Dungeon Master!")
    print("This is a text-based adventure game where the AI is your Dungeon Master.")
    print("Simply type what you want to do and press Enter.")
    print("For example: 'look around', 'go north', 'talk to the merchant', 'attack the goblin'.")
    print("Type 'quit' at any time to exit the game.")
    print("-" * 30)

    system_prompt = {
        "role": "system",
        "content": "You are a skilled Dungeon Master for a high-fantasy role-playing game. Your primary goal is to create an engaging, dynamic, and interactive story for the player. Describe environments, characters, and events with rich sensory detail (sights, sounds, smells, textures). Respond thoughtfully to player actions and decisions, ensuring their choices have meaningful consequences. Guide the narrative forward by presenting clear situations, challenges, puzzles, or social interactions. Introduce non-player characters (NPCs) with distinct personalities and motivations. When appropriate, ask the player clarifying questions about their intentions or actions (e.g., 'How do you try to do that?' or 'What are you hoping to achieve?'). Aim to conclude your responses by clearly setting the scene for the player's next decision or by prompting them for their next action. Maintain a consistent tone and style suitable for a fantasy adventure. Remember to manage the story's pacing, alternating between exploration, interaction, and potential conflict. Start the game by describing an interesting and immersive opening scenario that immediately presents the player with a situation requiring their attention or a decision."
    }
    
    initial_dm_prompt_message = {
        "role": "user",
        "content": "I'm ready to start my adventure. Please describe the opening scene."
    }

    conversation_history = [system_prompt, initial_dm_prompt_message]

    print("\nDM: ", end='', flush=True) # Print prefix once
    full_dm_response = ""
    initial_response_successful = False
    for token in generate_response(conversation_history):
        print(token, end='', flush=True)
        full_dm_response += token
        initial_response_successful = True
    print() # Newline after stream

    if not initial_response_successful: # If no tokens were yielded
        print("\n[System Message] Failed to start the game. The DM (Language Model) is not responding. Please ensure your local LM server is running and the model is loaded. Then, restart this game script.\n")
        return
    
    conversation_history.append({"role": "assistant", "content": full_dm_response})

    while True:
        user_input = input("Your action: ")
        if user_input.lower() == 'quit':
            print("Exiting game. Goodbye!")
            break

        conversation_history.append({"role": "user", "content": user_input})

        print("\nDM: ", end='', flush=True) # Print prefix once
        full_dm_response = ""
        response_successful_in_loop = False
        for token in generate_response(conversation_history):
            print(token, end='', flush=True)
            full_dm_response += token
            response_successful_in_loop = True
        print() # Newline after stream

        if response_successful_in_loop:
            conversation_history.append({"role": "assistant", "content": full_dm_response})
        else:
            # This else handles cases where the generator yielded nothing, 
            # implying an error during request or an empty stream.
            # The error messages from generate_response itself should have already printed.
            print("\n[System Message] The DM seems to be having trouble formulating a response. Try again or type 'quit'.\n")
            # Optional: remove last user message if DM fails, so they can re-enter
            # if conversation_history[-1]['role'] == 'user':
            #     conversation_history.pop()

if __name__ == "__main__":
    game_loop()
