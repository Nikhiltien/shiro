import json
import asyncio
import logging
from game_board import GameBoard
from quart import Quart, websocket, request, jsonify, render_template
from quart_cors import cors

app = Quart(__name__)
cors(app, allow_origin="http://localhost:3000")
active_websockets = set()

async def game_tree_callback(new_tree):
    for ws in active_websockets:
        try:
            # print(new_tree)
            await ws.send(json.dumps({'game_tree': new_tree}))
        except Exception as e:
            # Handle exceptions, e.g., closed connections
            pass

async def eval_callback(value):
    for ws in active_websockets:
        try:
            # Parsing the score
            score = value.get('score')
            if score:
                # Handling 'Mate' scores
                if "Mate" in score:
                    mate_value = score.split('(')[1].split(')')[0]
                    parsed_score = mate_value
                    # if mate_value.lstrip("-").isdigit():
                    #     mate_in = int(mate_value)
                    # parsed_score = f"Mate in {mate_in}" if mate_in > 0 else f"Mated in {abs(mate_in)}"
                # Handling 'Cp' scores
                elif "Cp" in score:
                    is_negative = '-' in score  # Check if score is negative
                    cp_value = score.split('+')[1].split(')')[0] if '+' in score else score.split('-')[1].split(')')[0]
                    if cp_value.isdigit():
                        cp_score = int(cp_value)
                        if is_negative:  # Keep the score negative if originally negative
                            cp_score *= -1
                        if "BLACK" in score:
                            cp_score *= -1  # Invert score for BLACK
                        parsed_score = cp_score / 100
                    else:
                        parsed_score = None

                await ws.send(json.dumps({'value': parsed_score}))
            else:
                logging.error("No score found in evaluation value")
        except Exception as e:
            logging.error(f"Error sending evaluation value: {e}")

games = {}

@app.before_serving
async def initialize_games():
    games["default"] = GameBoard(engine_name="stockfish", callback=game_tree_callback, eval_callback=eval_callback)
    await asyncio.sleep(2)
    await games["default"].start_background_analysis(depth=20)

@app.route('/')
async def index():
    return await render_template('index.html')

@app.websocket('/ws')
async def ws():
    game_id = 'default'  # Using a fixed game ID for simplification
    game = games[game_id]

    ws = websocket._get_current_object()
    active_websockets.add(ws)

    # Send the current board state immediately upon WebSocket connection
    await websocket.send(json.dumps({'fen': game.get_current_fen()}))

    try:
        while True:
            data = await websocket.receive()
            move_data = json.loads(data)
            
            if 'navigate_forward' in move_data:
                move = game.navigate_forward()
                await websocket.send(json.dumps({'fen': game.get_current_fen()}))
            elif 'navigate_backward' in move_data:
                move = game.navigate_backward()
                await websocket.send(json.dumps({'fen': game.get_current_fen()}))
            else:
                is_legal = game.make_move_with_variation(move_data.get('move'))
                if is_legal:
                    await websocket.send(json.dumps({'fen': game.get_current_fen()}))
                else:
                    await websocket.send(json.dumps({'error': 'Illegal move'}))
    finally:
        active_websockets.remove(ws)

@app.route('/current_fen')
async def current_fen():
    game_id = 'default'  # Simplified to use a single game instance
    game_board = games.get(game_id)
    return jsonify({'fen': game_board.get_current_fen() if game_board else 'Game not found'}), \
           (200 if game_board else 404)

@app.route('/navigate_forward', methods=['POST'])
async def navigate_forward():
    game_id = 'default'
    game = games[game_id]
    move = game.navigate_forward()
    return jsonify({'fen': game.get_current_fen(), 'move': move}), 200 if move else 400

@app.route('/navigate_backward', methods=['POST'])
async def navigate_backward():
    game_id = 'default'
    game = games[game_id]
    move = game.navigate_backward()
    return jsonify({'fen': game.get_current_fen(), 'move': move}), 200 if move else 400

@app.route('/reset', methods=['POST'])
async def reset():
    game_id = 'default'
    game = games[game_id]
    game.reset_board()
    return jsonify({'fen': game.get_current_fen()}), 200

if __name__ == "__main__":
    app.run(debug=True)
