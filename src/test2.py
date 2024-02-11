import io
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
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.game = chess.pgn.Game()
        self.opening_node = OpeningNode().load_eco_book()

    def pgn_to_game(self, pgn_string):
        try:
            pgn_io = io.StringIO(pgn_string)
            self.game = chess.pgn.read_game(pgn_io)
            return self.game
        except Exception as e:
            self.logger.error(f"Error parsing PGN string: {e}")
            return None

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


# Usage
sample_pgn = """
[Event "Fictitious Game"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5
"""

# opening_tree.print_opening_book()

game_board = GameBoard()
game_board.pgn_to_game(sample_pgn)
opening = game_board.get_opening()

if opening:
    for code, name in opening:
        print(f"Opening: {code} - {name}")
else:
    print("Opening not found or not in the ECO book.")
