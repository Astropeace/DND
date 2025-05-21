import requests
import json

def generate_response(prompt_history: list, max_length: int = 200) -> str | None:
    """
    Generates a response from the local LLM server.

    Args:
        prompt_history: A list of messages representing the conversation history.
        max_length: The maximum number of tokens for the generated response.

    Returns:
        The generated message content as a string, or None if an error occurs.
    """
    api_url = "http://127.0.0.1:1234/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    data = {
        "model": "qwen3-0.6b",
        "messages": prompt_history,
        "max_tokens": max_length,
        "temperature": 0.7
    }

    print(f"\n[Debug LM Request]")
    print(f"  Method: POST")
    print(f"  URL: {api_url}")
    print(f"  Headers: {json.dumps(headers, indent=2)}")
    print(f"  Payload: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(api_url, headers=headers, json=data)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        print(f"Full raw response text from LM: {response.text}")
        response_json = response.json()
        print(f"Parsed JSON response from LM: {json.dumps(response_json, indent=2)}")
        
        choices = response_json.get('choices')
        if not choices or not isinstance(choices, list) or len(choices) == 0:
            print(f"[LM Response Error] 'choices' array is missing, empty, or not a list in LM response.")
            # To aid debugging, print the whole problematic JSON if choices is bad
            print(f"Full problematic JSON: {json.dumps(response_json, indent=2)}") 
            return None

        choice = choices[0]
        if not isinstance(choice, dict):
            print(f"[LM Response Error] First choice is not a dictionary.")
            print(f"Problematic choice: {choice}")
            print(f"Full problematic JSON: {json.dumps(response_json, indent=2)}")
            return None
            
        message_obj = choice.get('message')
        message_content = None

        if isinstance(message_obj, dict):
            message_content = message_obj.get('content')

        if message_content is None:
            # If 'content' under 'message' is not found or message_obj is not a dict, 
            # try to get 'text' directly under the choice
            message_content = choice.get('text')

        if message_content is None:
            # If still None, it means the expected fields are not present.
            print(f"[LM Response Error] Could not find 'content' (under 'message') or 'text' directly in the first choice of LM response.")
            print(f"Full problematic choice object: {json.dumps(choice, indent=2)}")
            print(f"Full problematic response JSON: {json.dumps(response_json, indent=2)}")
            return None
        
        message = message_content
        return message
    except requests.exceptions.HTTPError as e:
        print(f"[LM Communication Error] Failed to get response from LM: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"[LM Communication Error] Status Code: {e.response.status_code}, Response: {e.response.text}")
        return None
    except requests.exceptions.RequestException as e: # Catches other network-related errors (e.g., connection refused)
        print(f"[LM Communication Error] Failed to connect or communicate with LM: {e}")
        return None
    except json.JSONDecodeError as e: # Specifically for when response.json() fails
        print(f"[LM Response Error] Failed to decode JSON from LM response: {e}")
        # 'response' variable should exist here from the try block
        if hasattr(response, 'text'):
            print(f"Problematic Raw Text from LM: {response.text}")
        return None
    except (KeyError, IndexError) as e: # For unexpected structure after successful JSON decoding
        print(f"[LM Response Error] Failed to access expected keys/indices in LM JSON response: {e}")
        # 'response_json' should exist if this block is reached after response.json()
        if 'response_json' in locals():
            print(f"Problematic Parsed JSON: {json.dumps(response_json, indent=2)}")
        elif hasattr(response, 'text'): # Fallback if response_json wasn't assigned for some reason
            print(f"Problematic Raw Text from LM (if JSON parsing failed before assignment): {response.text}")
        return None

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

    dm_response_text = generate_response(conversation_history)

    if not dm_response_text:
        print("\n[System Message] Failed to start the game. The DM (Language Model) is not responding. Please ensure your local LM server (e.g., LM Studio) is running and the model is loaded. Then, restart this game script.\n")
        return

    print(f"\nDM: {dm_response_text}\n")
    conversation_history.append({"role": "assistant", "content": dm_response_text})

    while True:
        user_input = input("Your action: ")
        if user_input.lower() == 'quit':
            print("Exiting game. Goodbye!")
            break

        conversation_history.append({"role": "user", "content": user_input})

        dm_response_text = generate_response(conversation_history)

        if dm_response_text:
            print(f"\nDM: {dm_response_text}\n")
            conversation_history.append({"role": "assistant", "content": dm_response_text})
        else:
            print("\nDM: [System Message] I'm having trouble connecting to my thoughts (the Language Model). Please check if the local LM server is running correctly. You can try your command again or type 'quit'.\n")
            # Optional: remove last user message if DM fails, so they can re-enter
            # conversation_history.pop() 

if __name__ == "__main__":
    game_loop()
