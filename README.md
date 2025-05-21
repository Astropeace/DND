# AI Dungeon Master

## Description
This project is a simple text-based adventure game where a locally running Large Language Model (LM) acts as the Dungeon Master (DM). The player interacts with the game by typing commands, and the AI DM responds, narrating the story and managing the game world.

## Requirements
*   Python 3.7+
*   **A locally running Large Language Model (LM):**
    *   The game is configured to connect to an LM at: `http://127.0.0.1:1234/v1/chat/completions`.
    *   The LM should be compatible with the OpenAI chat completions API format. The user who requested this project uses `qwen3-0.6b`, so models with similar API behavior are expected.
    *   Ensure your LM server (e.g., LM Studio, Jan, Ollama with OpenAI compatibility) is running and the desired model is loaded before starting the game.
*   The `requests` Python library.

## Configuration

The game connects to a local Language Model. Key connection settings can be configured at the top of the `dungeon_master_game.py` script:

*   `LM_API_URL`: The full URL to your LM's chat completions endpoint.
    *   Default: `"http://192.168.0.177:1234/v1/chat/completions"`
*   `LM_MODEL_NAME`: The model identifier expected by your LM.
    *   Default: `"qwen3-4b"`

If your LM server runs on a different IP address, port, or if you are using a different model name, please update these constants in the script before running the game.

## Setup
1.  **Clone the repository (if you haven't already):**
    ```bash
    # git clone <repository-url>
    # cd <repository-directory>
    ```
2.  **Install Python dependencies:**
    It's recommended to use a virtual environment.
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    pip install -r requirements.txt
    ```
3.  **Ensure your Local LM is Running:**
    Start your local LM server and make sure it's accessible via the `LM_API_URL` configured in `dungeon_master_game.py` (default: `http://192.168.0.177:1234/v1/chat/completions`).

## How to Play
1.  **Run the game script:**
    ```bash
    python dungeon_master_game.py
    ```
2.  **Interact with the DM:**
    *   The game will start with an introductory message from the DM.
    *   Type your desired action or dialogue (e.g., "look around", "go east", "ask the old man about the amulet") and press Enter.
    *   To exit the game at any time, type `quit` and press Enter.

## LM API Interaction Details
For users who want to understand or adapt the LM interaction, the script sends requests to the LM endpoint as follows:

*   **Endpoint:** `POST` to the `LM_API_URL` (configurable in `dungeon_master_game.py`, default: `http://192.168.0.177:1234/v1/chat/completions`)
*   **Headers:** `{"Content-Type": "application/json"}`
*   **Example Request Body (Payload):**
    ```json
    {
        "model": "qwen3-4b", // This uses the LM_MODEL_NAME constant from the script
        "messages": [
            {"role": "system", "content": "You are a skilled Dungeon Master..."},
            {"role": "user", "content": "I look under the bed."}
        ],
        "max_tokens": 200,
        "temperature": 0.7
    }
    ```
*   **Expected Response Body Structure (Simplified):**
    ```json
    {
        "choices": [
            {
                "message": {
                    "content": "The DM's response text..."
                }
            }
        ]
    }
    ```

Enjoy your adventure!
