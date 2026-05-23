import { useContext } from "react";
import { SocketContext } from "../context/socketContextValue";

export const useSocketContext = () => {
  return useContext(SocketContext);
};
