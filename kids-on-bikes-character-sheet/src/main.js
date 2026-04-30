import OBR from "@owlbear-rodeo/sdk";
import { initSheet } from "./sheet.js";
import { initGM } from "./gm.js";

OBR.onReady(async () => {
  const role = await OBR.player.getRole();
  const app = document.getElementById("app");

  if (role === "GM") {
    initGM(app);
  } else {
    initSheet(app);
  }
});