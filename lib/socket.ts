import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  path: '/api/socket',
});

export default socket;