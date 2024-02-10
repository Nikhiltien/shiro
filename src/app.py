import json
import os
from quart import Quart, request, jsonify, websocket, render_template, send_from_directory
from quart_cors import cors

app = Quart(__name__)
app = cors(app, allow_origin="http://localhost:3000")

@app.route('/')
async def index():
    return 'Hello, Chess World!'

if __name__ == '__main__':
    app.run()
