import chess
import asyncio
from game_board import GameBoard

# Example PGN for the Sicilian Defense, Najdorf Variation
sicilian_najdorf_pgn = """
[Event "Fictitious Game"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. g4 *
"""

# Scholar's Mate sequence (in SAN format)
# scholars_mate_moves = ['e4', 'Bc4', 'Qh5', 'Qxf7#']

async def test_gameboard():
    gameboard = GameBoard()

    # Load and test Sicilian Najdorf
    game = gameboard.pgn_to_game(sicilian_najdorf_pgn)
    if game is not None:
        opening_name, eco_code = gameboard.find_opening_from_game(game)
        print(f"Detected: {opening_name}, ECO Code: {eco_code}")
    else:
        print("Failed to load Sicilian Najdorf PGN.")

    # Reset the board for the next test
    gameboard.reset_board()

    # # Play moves leading to Scholar's Mate
    # for move in scholars_mate_moves:
    #     # Assuming 'make_move' is implemented to handle SAN moves
    #     if not gameboard.make_move(chess.Move.from_uci(gameboard.board.parse_san(move).uci())):
    #         print(f"Invalid move: {move}")
    #         break

    # # Evaluate the board for mate-in-1
    # if gameboard.engine is not None:
    #     await gameboard.init_engine()
    #     board_evaluation = await gameboard.board_eval(gameboard.current_fen())
    #     print(f"Board evaluation: {board_evaluation}")
    #     await gameboard.close_engine()
    # else:
    #     print("Chess engine not initialized.")

# Run the test
asyncio.run(test_gameboard())
