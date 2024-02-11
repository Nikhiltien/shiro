import io
import os
import glob
import asyncio
import chess
import chess.engine
import chess.pgn
import logging

logging.basicConfig(level=logging.INFO)

class GameBoard:
    def __init__(self, engine_name="stockfish"):
        self.logger = logging.getLogger(__name__)
        self.board = chess.Board()
        self.game = chess.pgn.Game()
        self.openings = {}
        self.load_eco_book()

        self.engine_path = f"engines/{engine_name}" if engine_name else None
        self.engine = None
        self.transport = None
        # if self.engine_path:
        #     asyncio.run(self.init_engine())
            
        self.reset_board()

    def load_eco_book(self, file_path='book/scid.eco'):
        try:
            with open(file_path, 'r') as eco_file:
                self.openings = self.build_opening_hashmap(eco_file.read())
        except FileNotFoundError:
            self.logger.error(f"ECO book file not found at {file_path}")
            raise
        except Exception as e:
            self.logger.error(f"Error loading ECO book: {e}")
            raise

    @staticmethod
    def build_opening_hashmap(eco_book):
        openings = {}
        current_line = ""
        
        def parse_opening_line(line):
            # Extract the ECO code, opening name, and moves
            parts = line.split('"')
            code = parts[0].strip()
            name = parts[1].strip()
            moves = parts[2].split('*')[0].strip()  # Ignore anything after '*'
            return code, name, moves

        def update_openings(openings, code, name, moves):
            move_list = moves.split()
            for i in range(1, len(move_list) + 1):
                key = ' '.join(move_list[:i])
                if key not in openings:
                    openings[key] = []
                openings[key].append((code, name))

        for line in eco_book.splitlines():
            # Check if the line starts with an ECO code (A-E)
            if line.startswith(tuple("ABCDE")):
                # Process the previous line if it's not empty
                if current_line:
                    code, name, moves = parse_opening_line(current_line)
                    update_openings(openings, code, name, moves)
                current_line = line
            else:
                # Continue building the current opening
                current_line += " " + line

        # Process the last line
        if current_line:
            code, name, moves = parse_opening_line(current_line)
            update_openings(openings, code, name, moves)
        print(openings)
        return openings

    def find_opening_from_game(self, game):
        board = chess.Board()
        moves_san_with_numbers = []

        for i, move in enumerate(game.mainline_moves()):
            if board.is_legal(move):
                san_move = board.san(move)
                move_number = (i // 2) + 1
                formatted_move = f"{move_number}.{san_move}" if i % 2 == 0 else san_move
                moves_san_with_numbers.append(formatted_move)
                board.push(move)
            else:
                self.logger.error(f"Illegal move: {move.uci()} in {board.fen()}")
                break

        self.logger.info(f"Formatted SAN moves with numbers: {moves_san_with_numbers}")
        return self.find_opening(tuple(moves_san_with_numbers))

    def find_opening(self, moves_san_with_numbers):
        # The moves need to be converted back to a format that matches our hashmap keys
        eco_moves = self.convert_san_moves_to_tuple(moves_san_with_numbers)

        for length in range(len(eco_moves), 0, -1):
            for key in self.openings.keys():
                if key[1][:length] == eco_moves[:length]:
                    return self.openings[key]['name'], self.openings[key]['eco']
        return None, None

    def convert_san_moves_to_tuple(self, moves_san_with_numbers):
        # Convert the SAN moves with move numbers back to a format compatible with our hashmap keys
        moves = []
        for move in moves_san_with_numbers:
            moves.append(move.split('.')[1] if '.' in move else move)
        return tuple(moves)

    def convert_moves(self, game):
        pgn_parts = []
        board = chess.Board()

        for i, move in enumerate(game.mainline_moves()):
            move_number = (i // 2) + 1
            san_move = board.san(move)

            if i % 2 == 0:  # White's move
                formatted_move = f"{move_number}.{san_move}"
            else:  # Black's move
                formatted_move = f"{move_number}...{san_move}"

            pgn_parts.append(formatted_move)
            board.push(move)  # Update board to reflect the current move

        eco_moves = tuple(pgn_parts)
        return eco_moves

    def pgn_to_game(self, pgn_string):
        try:
            pgn_io = io.StringIO(pgn_string)
            self.game = chess.pgn.read_game(pgn_io)
            return self.game
        except Exception as e:
            self.logger.error(f"Error parsing PGN string: {e}")
            return None

    def reset_board(self):
        self.board.reset()
    
    def current_fen(self):
        return self.board.fen()

    def load_fen(self, fen):
        self.board.set_fen(fen)

    def make_move(self, move):
        try:
            self.board.push(move)
            return True
        except ValueError:
            return False

    def undo_move(self):
        if len(self.board.move_stack) > 0:
            self.board.pop()

    def add_variation(self, move, parent_node=None):
        if parent_node is None:
            parent_node = self.game.end()
        parent_node.add_variation(move)

    def get_current_line(self):
        return [node.move for node in self.game.mainline()]

    def get_move_stack(self):
        return [self.board.san(move) for move in self.board.move_stack]

    async def init_engine(self):
        if not self.engine:
            try:
                self.logger.info("Initializing chess engine")
                transport, engine = await chess.engine.popen_uci(self.engine_path)
                self.engine = engine
                self.transport = transport
                self.logger.info("Engine initialized")
            except Exception as e:
                self.logger.error(f"Failed to initialize chess engine: {e}")
                raise

    async def close_engine(self):
        if self.engine:
            await self.engine.quit()
            self.engine = None
        if self.transport:
            self.transport.close()
            self.transport = None

    async def board_eval(self, position_fen):
        self.board.set_fen(position_fen)
        info = await self.engine.analyse(self.board, chess.engine.Limit(depth=20))
        return info

    async def game_review(self, game):
        analysis_results = []

        board = game.board()

        for move in game.mainline_moves():
            board.push(move)
            info = await self.engine.analyse(board, chess.engine.Limit(depth=18))

            adjusted_score = info['score'].white() if board.turn == chess.BLACK else -info['score'].black()
            analysis_results.append({'score': adjusted_score, 'move': move})

        return analysis_results
    
    # def load_games_from_directory(self, directory_path="../games"):
    #     all_games = []
    #     pgn_files = glob.glob(os.path.join(directory_path, '*.pgn'))
    #     for pgn_file_path in pgn_files:
    #         with open(pgn_file_path, 'r') as pgn_file:
    #             while True:
    #                 game = chess.pgn.read_game(pgn_file)
    #                 if game is None:
    #                     break
    #                 all_games.append(game)
    #     return all_games