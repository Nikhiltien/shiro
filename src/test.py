import unittest
import asyncio
from game_board import GameBoard
import chess

class TestGameBoard(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.game_board = GameBoard()
        await self.game_board.init_engine()

    async def asyncTearDown(self):
        await self.game_board.close_engine()

    def test_initialization(self):
        self.assertIsNotNone(self.game_board.board)
        self.assertIsNotNone(self.game_board.game)

    def test_load_eco_book(self):
        # Test loading the ECO book
        self.assertIsNotNone(self.game_board.openings)
        with self.assertRaises(FileNotFoundError):
            self.game_board.load_eco_book('non_existent_path.eco')

    def test_pgn_to_game(self):
        valid_pgn = "[Event \"F/S Return Match\"]\n[Site \"Belgrade, Serbia JUG\"]\n[Date \"1992.11.04\"]\n[Round \"29\"]\n[White \"Fischer, Robert J.\"]\n[Black \"Spassky, Boris V.\"]\n[Result \"1/2-1/2\"]"
        game = self.game_board.pgn_to_game(valid_pgn)
        self.assertIsNotNone(game)
        
        invalid_pgn = "Not a real PGN"
        game = self.game_board.pgn_to_game(invalid_pgn)
        self.assertIsNone(game)

    def test_reset_board(self):
        self.game_board.make_move(chess.Move.from_uci("e2e4"))
        self.game_board.reset_board()
        self.assertEqual(self.game_board.current_fen(), chess.Board().fen())

    def test_current_fen(self):
        expected_fen = chess.Board().fen()
        self.assertEqual(self.game_board.current_fen(), expected_fen)

    def test_load_fen(self):
        fen = chess.Board().fen()
        self.game_board.load_fen(fen)
        self.assertEqual(self.game_board.board.fen(), fen)

        with self.assertRaises(ValueError):
            self.game_board.load_fen("invalid fen")

    def test_make_move(self):
        valid_move = chess.Move.from_uci("e2e4")
        self.assertTrue(self.game_board.make_move(valid_move))

        invalid_move = chess.Move.from_uci("h1h8")
        self.assertFalse(self.game_board.make_move(invalid_move))

    def test_undo_move(self):
        self.game_board.make_move(chess.Move.from_uci("e2e4"))
        self.game_board.undo_move()
        self.assertEqual(self.game_board.board.fen(), chess.Board().fen())

    # def test_add_variation(self):
    #     move = chess.Move.from_uci("e2e4")
    #     self.game_board.add_variation(move)
    #     self.assertIn(move, self.game_board.get_current_line())

    # def test_get_current_line(self):
    #     moves = [chess.Move.from_uci(move) for move in ["e2e4", "e7e5"]]
    #     for move in moves:
    #         self.game_board.make_move(move)
    #     self.assertEqual(self.game_board.get_current_line(), moves)

    # def test_get_move_stack(self):
    #     moves = ["e2e4", "e7e5"]
    #     for move in moves:
    #         self.game_board.make_move(chess.Move.from_uci(move))
    #     self.assertEqual(self.game_board.get_move_stack(), moves)

    async def test_async_init_engine(self):
        await self.game_board.init_engine()
        self.assertIsNotNone(self.game_board.engine)

    async def test_async_close_engine(self):
        await self.game_board.init_engine()
        await self.game_board.close_engine()
        self.assertIsNone(self.game_board.engine)

    async def test_async_board_eval(self):
        fen = chess.Board().fen()
        info = await self.game_board.board_eval(fen)
        self.assertIsNotNone(info)

    async def test_async_game_review(self):
        # This test would depend on the implementation of 'review_game' or similar functionality
        pass

if __name__ == '__main__':
    unittest.main()
