import "./style.css";
import "./script.ts";
import { MessageType, sendGossip } from "./backend.ts";

let elem = document.querySelector<HTMLDivElement>("#app")!;
elem.innerHTML = "<button> advert </button>";
elem.querySelector("button")!.addEventListener("click", () => {
  sendGossip({ type: MessageType.Ready, player: window.webxdc.selfAddr });
});
