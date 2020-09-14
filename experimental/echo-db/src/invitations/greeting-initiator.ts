//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';

import { waitForEvent } from '@dxos/async';
import {
  Greeter, GreetingCommandPlugin, createEnvelopeMessage,
  createFeedAdmitMessage, createKeyAdmitMessage,
  createGreetingBeginMessage, createGreetingFinishMessage,
  createGreetingHandshakeMessage,
  createGreetingNotarizeMessage,
  Keyring
} from '@dxos/credentials';
import { keyToString } from '@dxos/crypto';
import { NetworkManager } from '@dxos/network-manager';

import { GreetingState } from './greeting-responder';
import { InvitationDescriptorType, InvitationDescriptor } from './invitation-descriptor';
import { greetingProtocolProvider } from './greeting-protocol-provider';
import { SecretProvider } from './common';
import { PartyFactory, PartyManager } from '../parties';

const log = debug('dxos:party-manager:greeting-initiator');

const DEFAULT_TIMEOUT = 30000;

/**
 * Attempts to connect to a greeting responder to 'redeem' an invitation, potentially with some out-of-band
 * authentication check, in order to be admitted to a Party.
 */
export class GreetingInitiator {
  // TODO(dboreham): can this be the same type as for the greeter? */
  _invitationDescriptor: InvitationDescriptor;

  _keyring: Keyring;

  _networkManager: any;

  _greeterPlugin?: GreetingCommandPlugin;

  // TODO(dboreham): can we use the same states as the responder? */
  _state: GreetingState;

  constructor (
    invitationDescriptor: InvitationDescriptor,
    keyring: Keyring,
    networkManager: any,
    private partyFactory: PartyFactory,
    private partyManager: PartyManager,
  ) {
    assert(keyring);
    assert(networkManager);
    assert(invitationDescriptor);
    assert(InvitationDescriptorType.INTERACTIVE === invitationDescriptor.type);

    this._invitationDescriptor = invitationDescriptor;
    this._keyring = keyring;
    this._networkManager = networkManager;
    this._state = GreetingState.INITIALIZED;
  }

  get state () {
    return this._state;
  }

  /**
   * Initiate a connection to a greeting responder node.
   * @param {number} timeout Connection timeout (ms).
   */
  async connect (timeout = DEFAULT_TIMEOUT) {
    assert(this._state === GreetingState.INITIALIZED);

    // TODO(telackey): Clarify what this comment means:
    // TODO(telackey): We don't have the descriptor yet, but it must include at least this.
    const { swarmKey, invitation } = this._invitationDescriptor;

    // Due to limitations in @dxos/protocol and hypercore-protocol, a requester in a request/response
    // interaction with a responder must know the responder's peer id. Therefore we communicate its peer
    // id in the invitation, as the greet swarm key. That is: greet swarm key, which is a unique key to serve
    // its purpose of uniquely identifying each greeter, is by convention also used as the peer id by the greeter
    // and so can be used here as the responder peer id in the greeting interaction.
    const responderPeerId = swarmKey;

    // Use the invitation ID as our peerId.
    // This is due to a bug in the protocol where the invitation id is omitted from the payload.
    // Therefore at present the greeter discovers the invitation id from session metadata, via the invitee's peer id.
    // TODO(dboreham): invitation is actually invitationId.
    const localPeerId = invitation;
    log('Local PeerId:', keyToString(localPeerId));

    this._greeterPlugin = new GreetingCommandPlugin(localPeerId, (new Greeter()).createMessageHandler());

    log('Connecting');
    const peerJoinedWaiter = waitForEvent(this._greeterPlugin, 'peer:joined',
      (remotePeerId: any) => remotePeerId && responderPeerId.equals(remotePeerId), timeout);

    await this._networkManager.joinProtocolSwarm(swarmKey,
      greetingProtocolProvider(swarmKey, localPeerId, [this._greeterPlugin]));

    await peerJoinedWaiter;
    log('Connected');
    this._state = GreetingState.CONNECTED;
  }

  /**
   * Called after connecting to initiate greeting protocol exchange.
   */
  async redeemInvitation (secretProvider: SecretProvider) {
    assert(this._state === GreetingState.CONNECTED);
    const { swarmKey } = this._invitationDescriptor;
    const responderPeerId = swarmKey;

    //
    // The first step in redeeming the Invitation is the BEGIN command.
    // On the Greeter end, this is when it takes action (e.g., generating a passcode)
    // starting the redemption of the Invitation.
    //

    assert(this._greeterPlugin);
    const { info } = await this._greeterPlugin.send(responderPeerId, createGreetingBeginMessage() as any) as any;

    //
    // The next step is the HANDSHAKE command, which allow us to exchange additional
    // details with the Greeter. This step requires authentication, so we must obtain
    // a signature in the case of bot/key auth, or interactively from the user in the
    // case of PIN/passphrase auth.
    //

    log('Requesting secret...');
    const secret = await secretProvider(info);
    log('Received secret');

    const handshakeResponse = await this._greeterPlugin.send(responderPeerId, createGreetingHandshakeMessage(secret) as any) as any;

    //
    // The last step is the NOTARIZE command, where we submit our signed credentials to the Greeter.
    // Until this point, we did not know the publicKey of the Party we had been invited to join.
    // Now we must know it, because it (and the nonce) are needed in our signed credentials.
    //

    // The result will include the partyKey and a nonce used when signing the response.
    const { nonce, partyKey } = handshakeResponse;

    const writeFeed = await this.partyFactory.initWritableFeed(partyKey);
    const feedKey = await this._keyring.getKey(writeFeed.key);

    const credentialMessages = [];
    // if (this._partyManager.isHalo(partyKey)) {
    //   // For the Halo, add the DEVICE directly.
    //   credentialMessages.push(
    //     createKeyAdmitMessage(this._keyring, partyKey,
    //       this._partyManager.identityManager.deviceManager.keyRecord,
    //       [],
    //       nonce)
    //   );
    //   // And Feed, signed for by the FEED and the DEVICE.
    //   credentialMessages.push(
    //     createFeedAdmitMessage(this._keyring, partyKey,
    //       feedKey,
    //       this._partyManager.identityManager.deviceManager.keyRecord,
    //       nonce)
    //   );
    // } else {
      // For any other Party, add the IDENTITY, signed by the DEVICE keychain, which links back to that IDENTITY.

      //keyAdmitMessage: createKeyAdmitMessage(keyring, Buffer.from(party.key), identityKeyPair),
      //feedAdmitMessage: createFeedAdmitMessage(keyring, Buffer.from(party.key), feedKeyPair, identityKeyPair)
      credentialMessages.push(
        createKeyAdmitMessage(this._keyring, partyKey, this.partyFactory.identityKey, nonce)
      )
      // And the Feed, signed for by the FEED and by the DEVICE keychain, as above.
      credentialMessages.push(
        createFeedAdmitMessage(this._keyring, partyKey, feedKey, this.partyFactory.identityKey, nonce)
      )
    // }

    // Send the signed payload to the greeting responder.
    const notarizeResponse = await this._greeterPlugin.send(responderPeerId,
      createGreetingNotarizeMessage(secret, credentialMessages) as any) as any;

    //
    // We will receive back a collection of 'hints' of the keys and feeds that make up the Party.
    // Without these 'hints' we would have no way to begin replicating, because we would not know whom to trust.
    //

    console.log({ hints: notarizeResponse.hints })
    const party = await this.partyManager.addParty(partyKey, notarizeResponse.hints.map((hint: any) => hint.publicKey)); // TODO(marik-d): Take full hint object here

    // Tell the Greeter that we are done.
    await this._greeterPlugin.send(responderPeerId, createGreetingFinishMessage(secret) as any);

    await this.disconnect();

    this._state = GreetingState.SUCCEEDED;
    return party;
  }

  async disconnect () {
    const { swarmKey } = this._invitationDescriptor;
    await this._networkManager.leaveProtocolSwarm(swarmKey);
    this._state = GreetingState.DISCONNECTED;
  }

  async destroy () {
    await this.disconnect();
    this._greeterPlugin = undefined;
    this._state = GreetingState.DESTROYED;
    log('Destroyed');
  }
}