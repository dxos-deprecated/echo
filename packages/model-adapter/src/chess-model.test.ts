import { ChessModel, TYPE_CHESS_GAME, TYPE_CHESS_MOVE, CHESS_BLACK_ROLE, CHESS_WHITE_ROLE } from '@dxos/chess-core';
import { createModelAdapter } from './adapter'
import { createModelTestBench } from '@dxos/echo-db';
import { waitForCondition } from '@dxos/async';

const ChessModelAdapter = createModelAdapter<any>(TYPE_CHESS_GAME, ChessModel);


const PLAYER_1 = Buffer.from([1]);
const PLAYER_2 = Buffer.from([2]);
const PLAYER_3 = Buffer.from([3]);

const WHITE = 'w'
const BLACK = 'b'

test('can play a chess game', async () => {
  const [player1, player2] = await createModelTestBench({ model: ChessModelAdapter });

  player1.model.model.appendMessage(genesisMessage(
    player1.testMeta.identityManager.identityKey.publicKey,
    player2.testMeta.identityManager.identityKey.publicKey,
  ))
  player1.model.model.appendMessage(moveMessage(0, 'e2', 'e3'))
  player2.model.model.appendMessage(moveMessage(1, 'a7', 'a6'))
  player1.model.model.appendMessage(moveMessage(2, 'd1', 'h5'))
  player2.model.model.appendMessage(moveMessage(3, 'a8', 'a7'))
  player1.model.model.appendMessage(moveMessage(4, 'f1', 'c4'))
  player2.model.model.appendMessage(moveMessage(5, 'b7', 'b6'))
  player1.model.model.appendMessage(moveMessage(6, 'h5', 'f7'))

  await waitForCondition(() => expect(player1.model.model.game.game_over()).toEqual(true));

  expect(player1.model.model.game.turn()).toEqual(BLACK)
  expect(player1.model.model.game.in_checkmate()).toEqual(true);
  expect(player1.model.model.game.game_over()).toEqual(true);

  expect(player2.model.model.game.turn()).toEqual(BLACK)
  expect(player2.model.model.game.in_checkmate()).toEqual(true);
  expect(player2.model.model.game.game_over()).toEqual(true);
})

const genesisMessage = (white: Buffer, black: Buffer) => ({
  __type_url: TYPE_CHESS_GAME,
  previousMessageId: 0,
  messageId: 1,
  members: [
    { publicKey: white, role: CHESS_WHITE_ROLE },
    { publicKey: black, role: CHESS_BLACK_ROLE },
  ],
});

const moveMessage = (seq: number, from: string, to: string) => ({
  __type_url: TYPE_CHESS_MOVE,
  messageId: seq + 2,
  previousMessageId: seq + 1,
  seq,
  from,
  to,
})