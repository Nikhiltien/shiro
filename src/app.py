from quart import Quart

app = Quart(__name__)

@app.route('/')
async def index():
    return 'Hello, Chess World!'

if __name__ == '__main__':
    app.run()
