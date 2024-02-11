import io
import asyncio
import logging
import chess
import chess.engine
import chess.pgn

class OpeningNode:
    def __init__(self):
        self.children = {}  # Maps move to the next OpeningNode
        self.openings = []  # List of tuples (ECO code, name)

    def load_eco_book(self, file_path='book/scid.eco'):
        try:
            with open(file_path, 'r') as eco_file:
                eco_book_content = eco_file.read()
            return self.build_opening_tree(eco_book_content)
        except FileNotFoundError:
            print(f"ECO book file not found at {file_path}")
            raise
        except Exception as e:
            print(f"Error loading ECO book: {e}")
            raise

    @staticmethod
    def build_opening_tree(eco_book):
        root = OpeningNode()
        current_opening_lines = ''

        for line in eco_book.splitlines():
            if line.startswith(tuple("ABCDE")) and '*' in current_opening_lines:
                # Parse the current opening
                code, name, moves = OpeningNode.parse_opening_line(current_opening_lines)
                move_list = moves.split()
                root.add_opening(move_list, code, name)
                # Reset for the next opening
                current_opening_lines = line
            else:
                # Continue building the current opening
                current_opening_lines += ' ' + line

        # Process the last opening if it exists
        if current_opening_lines:
            code, name, moves = OpeningNode.parse_opening_line(current_opening_lines)
            move_list = moves.split()
            root.add_opening(move_list, code, name)

        return root

    def find_opening(self, move_list):
        node = self
        last_opening = None
        for move in move_list:
            # print(f"Searching for move: {move}")
            # print(f"Available moves at this node: {list(node.children.keys())}")
            if move in node.children:
                node = node.children[move]
                if node.openings:
                    last_opening = node.openings
            else:
                # print(f"No matching move found for {move} in sequence {move_list}")
                break

        return last_opening if last_opening else None

    def add_opening(self, move_list, code, name):
        if not move_list:
            self.openings.append((code, name))
            return

        move = move_list[0]
        if move not in self.children:
            self.children[move] = OpeningNode()

        self.children[move].add_opening(move_list[1:], code, name)

    @staticmethod
    def parse_opening_line(line):
        parts = line.split('"')
        code = parts[0].strip()
        name = parts[1].strip()
        moves = parts[2].split('*')[0].strip()
        # print(f"Parsed opening: Code={code}, Name={name}, Moves={moves}")
        return code, name, moves

    def print_opening_book(self, move_sequence=''):
        if self.openings:
            for code, name in self.openings:
                full_sequence = move_sequence.strip()
                print(f"{code}: {name} ({full_sequence})")

        for move, node in self.children.items():
            # print(f"Child node move: {move}")
            node.print_openings(move_sequence + ' ' + move)

class GameBoard:
    def __init__(self, engine_name=None):
        self.logger = logging.getLogger(__name__)
        self.game = chess.pgn.Game()
        self.board = chess.Board()
        self.opening_node = OpeningNode().load_eco_book()

        self.engine_path = f"engines/{engine_name}" if engine_name else None
        self.engine = None
        self.transport = None

        self.reset_board()

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

    def get_current_fen(self):
        return self.board.fen()

    def make_move(self, uci_move):
        """
        Makes a move on the board.

        :param uci_move: The move to make, in UCI format (e.g., 'g1f3').
        :return: True if the move was successfully made, False otherwise.
        """
        try:
            move = chess.Move.from_uci(uci_move)
            if move in self.board.legal_moves:
                self.board.push(move)
                return True
            else:
                self.logger.warning(f"Illegal move: {uci_move}")
                return False
        except Exception as e:
            self.logger.error(f"Error making move: {e}")
            return False

    def undo_move(self):
        if len(self.board.move_stack) > 0:
            self.board.pop()

    def _add_variation(self, current_node, move, comment=''):
        """
        Adds a new variation to the game tree.
        
        :param current_node: The node from which the variation starts.
        :param move: The move (in UCI format) to add as a variation.
        :param comment: Optional comment for the new variation.
        :return: The new variation node.
        """
        try:
            new_variation = current_node.add_variation(chess.Move.from_uci(move), comment=comment)
            return new_variation
        except Exception as e:
            self.logger.error(f"Error adding variation: {e}")
            return None
        
    def _promote_variation(self, node):
        """
        Promotes the given variation to the main variation.

        :param node: The node (variation) to promote.
        """
        try:
            node.parent.promote(node.move)
        except Exception as e:
            self.logger.error(f"Error promoting variation: {e}")

    def _navigate_to_node(self, path):
        """
        Navigates to a specific node in the game tree based on a list of moves.

        :param path: List of moves (in UCI format) leading to the desired node.
        :return: The node if found, otherwise None.
        """
        current_node = self.game
        try:
            for move in path:
                found = False
                for variation in current_node.variations:
                    if variation.move == chess.Move.from_uci(move):
                        current_node = variation
                        found = True
                        break
                if not found:
                    return None
            return current_node
        except Exception as e:
            self.logger.error(f"Error navigating to node: {e}")
            return None

    def _annotate_move(self, node, comment='', nags=[]):
        """
        Adds annotations to a move.

        :param node: The node representing the move to annotate.
        :param comment: Optional comment for the move.
        :param nags: List of NAGs (Numeric Annotation Glyphs) for the move.
        """
        try:
            if comment:
                node.comment = comment
            for nag in nags:
                node.nags.add(nag)
        except Exception as e:
            self.logger.error(f"Error annotating move: {e}")

    def _add_evaluation_to_node(self, node, evaluation):
        """
        Adds an engine evaluation to a node.

        :param node: The node to add the evaluation to.
        :param evaluation: The evaluation score to add.
        """
        try:
            score = evaluation.get("score")
            depth = evaluation.get("depth", None)
            node.set_eval(score, depth)
        except Exception as e:
            self.logger.error(f"Error adding evaluation to node: {e}")

    def get_opening(self):
        board = self.game.board()
        moves_with_prefixes = []
        move_count = 1  # Start with move number 1

        for move in self.game.mainline_moves():
            san_move = board.san(move)
            # Add move number prefixes for each move (1.e4, 2.Nf3, etc.)
            move_with_prefix = f"{move_count}.{san_move}" if board.turn == chess.WHITE else san_move
            moves_with_prefixes.append(move_with_prefix)
            # print(f"PGN move with prefix: {move_with_prefix}")
            board.push(move)
            if board.turn == chess.WHITE:
                move_count += 1  # Increment move count after black's move

        return self.opening_node.find_opening(moves_with_prefixes)

    def _enhanced_get_opening(self):
        """
        Identifies the opening using the existing get_opening method and annotates the game tree.
        """
        try:
            opening = self.get_opening()
            if opening:
                # Assuming 'opening' is a list of tuples with code and name
                opening_code, opening_name = opening[0]  # Taking the first opening found
                self.game.root().comment = f"Opening: {opening_code} - {opening_name}"
                return opening
            else:
                print("Opening not found or not in the ECO book.")
                return None
        except Exception as e:
            self.logger.error(f"Error identifying opening: {e}")
            return None
        
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

# Usage
sample_pgn = """
[Event "Fictitious Game"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6
"""

# opening_tree.print_opening_book()
async def main():
    game_board = GameBoard(engine_name="stockfish")
    game_board.pgn_to_game(sample_pgn)
    await game_board.init_engine()
    analysis_results = await game_board.game_review(game_board.game)

    # Print the results of the analysis
    for result in analysis_results:
        print(f"Move: {result['move']}, Score: {result['score']}")

    # Close the engine
    await game_board.close_engine()

    opening = game_board.get_opening()

    if opening:
        for code, name in opening:
            print(f"Opening: {code} - {name}")
    else:
        print("Opening not found or not in the ECO book.")

    game_board.make_move("h2h3")

if __name__ == "__main__":
    asyncio.run(main())