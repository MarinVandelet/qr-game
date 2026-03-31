// Instance Socket.IO partagée entre les pages
import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

export const socket = io(SOCKET_URL);



