import socket from "socket.io";

export default function socketManager(server) {
  const io = socket(server);
  io.on("connect", (socket) => {

    socket.emit('confirm', 'Success')

    socket.on("getHello", () => {
      console.log("Hello world!");
    });

    socket.on("disconnect", () => {
      console.log("Bot disconnected!");
    });
  });
}