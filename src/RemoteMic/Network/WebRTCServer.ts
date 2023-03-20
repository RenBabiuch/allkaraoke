import { Peer } from 'peerjs';
import { v4 } from 'uuid';
import RemoteMicManager from 'RemoteMic/RemoteMicManager';
import peerJSOptions from 'utils/peerJSOptions';
import { WebRTCEvents } from 'RemoteMic/Network/events';
import events from 'GameEvents/GameEvents';

const ROOM_ID_KEY = 'room_id_key';

class WebRTCServer {
    private roomId = window.sessionStorage.getItem(ROOM_ID_KEY)!;
    private peer: Peer | null = null;
    private started = false;

    public constructor() {
        if (!this.roomId) {
            this.roomId = v4();
        } else {
            this.start();
        }

        window.addEventListener('beforeunload', () => {
            RemoteMicManager.getRemoteMics().forEach((remoteMic) => remoteMic.connection.close());
            this.peer?.disconnect();
        });
    }

    public start = () => {
        if (this.started) return;
        this.started = true;
        window.sessionStorage.setItem(ROOM_ID_KEY, this.roomId);

        this.peer = new Peer(this.roomId, peerJSOptions);

        this.peer.on('open', function (id) {
            console.log('My peer ID is: ' + id);
        });

        this.peer.on('connection', (conn) => {
            conn.on('data', (data: WebRTCEvents) => {
                const type = data.t;
                if (type === 'register') {
                    RemoteMicManager.addRemoteMic(data.id, data.name, conn, data.silent);
                } else if (type === 'keystroke') {
                    events.remoteKeyboardPressed.dispatch(data.key);
                } else if (type === 'unregister') {
                    RemoteMicManager.removeRemoteMic(conn.peer, true);
                } else if (type === 'request-mic-select') {
                    events.playerChangeRequested.dispatch(conn.peer, data.playerNumber);
                }
            });

            conn.on('open', () => {
                console.log('connected');
            });

            conn.on('error', (data) => console.warn('error', data));

            // iceStateChanged works - close/disconnected/error doesn't for some reason
            // @ts-expect-error `iceStateChanged` is not included in TS definitions
            conn.on('iceStateChanged', (state) => {
                if (state === 'disconnected' || state === 'closed') {
                    RemoteMicManager.removeRemoteMic(conn.peer);
                }
            });

            conn.on('close', () => {
                RemoteMicManager.removeRemoteMic(conn.peer);
            });
        });
        this.peer.on('close', () => {
            this.started = false;
        });
    };

    public getRoomId = () => this.roomId;
}

export default new WebRTCServer();