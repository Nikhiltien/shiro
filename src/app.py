import json
import os
import game_board
from quart import Quart, request, jsonify, websocket, render_template, send_from_directory
from quart_cors import cors

app = Quart(__name__)
app = cors(app, allow_origin="http://localhost:3000")

@app.route('/')
async def index():
    return 'Hello, Chess World!'

@app.route('/new-game', methods=['POST'])
async def new_game():
    global game
    game.reset()
    return json.dumps({'status': 'success', 'fen': game.fen()})

@app.route('/make-move', methods=['POST'])
async def make_move():
    global game
    data = await request.get_json()
    move = game_board.Move.from_uci(data['move'])
    if move in game.legal_moves:
        game.push(move)
        return json.dumps({'status': 'success', 'fen': game.fen()})
    else:
        return json.dumps({'status': 'illegal move'})

@app.route('/game-state', methods=['GET'])
async def game_state():
    return json.dumps({'fen': game.fen()})

if __name__ == "__main__":
    app.run(debug=True)