import io
import random
import json
import hashlib
import copy
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
    def __init__(self, engine_name=None, callback=None, eval_callback=None):
        self.logger = logging.getLogger(__name__)
        self.game = None
        self.board = chess.Board()
        self.opening_node = OpeningNode().load_eco_book()

        self.engine_path = f"engines/{engine_name}" if engine_name else None
        self.engine = None
        self.transport = None

        self.background_analysis_task = None
        self.prev_state_hash = None
        self.state_callback = callback
        self.eval_callback = eval_callback
        self.reset_board()

        if self.engine_path:
            asyncio.create_task(self.init_engine())

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
        self.game = chess.pgn.Game()
        self.prev_state_hash = self._generate_state_hash()

    def _generate_state_hash(self):
        game_tree = self.list_variations()
        game_tree_string = json.dumps(game_tree)  # Convert the dict to a JSON string
        # return hashlib.sha256(game_tree_string.encode()).hexdigest()
        return game_tree_string

    def has_state_changed(self):
        # Check if the current game state is different from the previous state
        current_state_hash = self._generate_state_hash()
        if current_state_hash != self.prev_state_hash:
            self.prev_state_hash = current_state_hash
            return current_state_hash
        else:
            return False

    def get_current_fen(self):
        return self.board.fen()

    def _get_current_node(self):
        node = self.game
        for move in self.board.move_stack:
            for var in node.variations:
                if var.move == move:
                    node = var
                    break
        return node

    def navigate_forward(self):
        current_node = self._get_current_node()
        if current_node.variations:
            next_move = current_node.variations[0].move
            self.board.push(next_move)
            return next_move.uci()
        return None

    def navigate_backward(self):
        if self.board.move_stack:
            last_move = self.board.pop()
            return last_move.uci()
        return None

    def _make_move(self, uci_move):
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

    def make_move_with_variation(self, uci_move):
        current_node = self._get_current_node()
        move = chess.Move.from_uci(uci_move)

        if move in [var.move for var in current_node.variations]:
            self.board.push(move)
            new_state = self.has_state_changed()
            if new_state and self.state_callback is not None:
                asyncio.create_task(self.state_callback(new_state))
        elif move not in self.board.legal_moves:
            self.logger.warning(f"Illegal move: {uci_move}")
            return False
        else:
            self._add_variation(current_node, uci_move)
            self.board.push(move)
            new_state = self.has_state_changed()
            if new_state and self.state_callback is not None:
                asyncio.create_task(self.state_callback(new_state))
        
        if self.background_analysis_task:
            asyncio.create_task(self.restart_background_analysis())
        return True

    def undo_move(self):
        if len(self.board.move_stack) > 0:
            self.board.pop()

    def _add_variation(self, current_node, move, comment=''):
        try:
            new_variation = current_node.add_variation(chess.Move.from_uci(move), comment=comment)
            return new_variation
        except Exception as e:
            self.logger.error(f"Error adding variation: {e}")
            return None
        
    def _promote_variation(self, node):
        try:
            node.parent.promote(node.move)
        except Exception as e:
            self.logger.error(f"Error promoting variation: {e}")

    def list_variations(self, node=None, depth=0, variation_lines=None):
        if variation_lines is None:
            variation_lines = []
        
        if node is None:
            node = self.game

        indent = " " * (2 * depth)
        for variation in node.variations:
            variation_line = f"{indent}Variation at depth {depth}: {variation.move.uci()}"
            variation_lines.append(variation_line)
            self.list_variations(variation, depth + 1, variation_lines)

        # Only return the result at the root call
        if depth == 0:
            return self._parse_to_tree(variation_lines)

    @staticmethod
    def _parse_to_tree(variation_lines):
        variation_string = "\n".join(variation_lines)  # Join the list into a single string
        lines = variation_string.split('\n')
        root = {'name': 'Start', 'children': []}
        stack = [root]

        for line in lines:
            if not line.strip():
                continue

            depth = line.count('  ')
            move_san = line.split(': ')[-1]
            
            node = {'name': move_san, 'children': []}

            # Move back up to the parent node at the correct depth
            while len(stack) > depth + 1:
                stack.pop()
            
            # Add the new node to the children of the current node
            stack[-1]['children'].append(node)

            # Add this node to the stack
            stack.append(node)

        return root

    def _navigate_to_node(self, path):
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
        try:
            if comment:
                node.comment = comment
            for nag in nags:
                node.nags.add(nag)
        except Exception as e:
            self.logger.error(f"Error annotating move: {e}")

    def _add_evaluation_to_node(self, node, evaluation):
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

    async def start_background_analysis(self, depth=20):
        self.background_analysis_task = asyncio.create_task(self._background_analysis(depth))

    async def stop_background_analysis(self):
        if self.background_analysis_task:
            self.background_analysis_task.cancel()
            await self.background_analysis_task

    async def restart_background_analysis(self):
        await self.stop_background_analysis()
        await self.start_background_analysis()

    async def _background_analysis(self, depth=20):
        try:
            with await self.engine.analysis(self.board, chess.engine.Limit(depth=depth)) as analysis:
                async for info in analysis:
                    # print("Received update from engine:", info)
                    score = info.get("score")
                    pv = info.get("pv")
                    engine_depth = info.get("depth")
                    if score is not None and pv is not None:
                        evaluation = {
                            "score": str(score),
                            "depth": engine_depth,
                            # "pv": [str(move) for move in pv]
                        }
                        if self.eval_callback:
                            await self.eval_callback(evaluation)
                    else:
                        self.logger.debug("Waiting for engine analysis...")

                    if depth and info.get("depth", 0) >= depth:
                        break
        except asyncio.CancelledError:
            # Analysis was cancelled
            pass
        except Exception as e:
            self.logger.error(f"Error in background analysis: {e}")

# Usage
sample_pgn = """
[Event "Fictitious Game"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 *
"""


def callback(game_tree):
    print(game_tree)

# opening_tree.print_opening_book()
async def main():
    game_board = GameBoard(engine_name="stockfish", callback=callback)
    game_board.pgn_to_game(sample_pgn)
    await game_board.init_engine()
    await game_board.start_background_analysis(depth=20)

    opening = game_board.get_opening()

    if opening:
        for code, name in opening:
            print(f"Opening: {code} - {name}")
    else:
        print("Opening not found or not in the ECO book.")

    # Traverse to the end of the game
    while game_board.navigate_forward():
        pass

    await asyncio.sleep(15)
    move_in_san = "Bg5"
    try:
        move_in_uci = game_board.board.parse_san(move_in_san).uci()
        if game_board.make_move_with_variation(move_in_uci):
            current_node = game_board._get_current_node()
            # game_board._promote_variation(current_node)
        else:
            print(f"Move {move_in_san} is not legal in the current position")
    except ValueError:
        print(f"Move {move_in_san} could not be parsed")

    await asyncio.sleep(15)
    move_in_san = "e6"
    try:
        move_in_uci = game_board.board.parse_san(move_in_san).uci()
    except ValueError:
        print(f"Move {move_in_san} could not be parsed")

    await asyncio.sleep(5)
    game_board.navigate_backward()
    await asyncio.sleep(5)
    game_board.navigate_backward()

    legal_moves = list(game_board.board.legal_moves)
    if legal_moves:
        new_move = legal_moves[0]
        game_board.make_move_with_variation(new_move.uci())
    else:
        print("No legal moves available")

    mainline_moves = list(game_board.game.mainline_moves())
    print("Mainline moves:", " ".join([move.uci() for move in mainline_moves]))

    variations = game_board.list_variations()
    print(variations)

    # analysis_results = await game_board.game_review(game_board.game)
    # for result in analysis_results:
    #     print(f"Move: {result['move']}, Score: {result['score']}")

    await asyncio.sleep(5)
    await game_board.stop_background_analysis()
    await game_board.close_engine()

if __name__ == "__main__":
    asyncio.run(main())