import { Player } from "@minecraft/server";
import { uiStateMap, frameDataMap, settingsDataMap, otherDataMap } from "./maps";

export function initMaps(player: Player) {
    if (!uiStateMap.has(player.id)) {
        uiStateMap.set(player.id, { state: "framePlacementMenu" });
    }
    if (!frameDataMap.has(player.id)) {
        frameDataMap.set(player.id, []);
    }
    if (!settingsDataMap.has(player.id)) {
        settingsDataMap.set(player.id, {
            hideHud: true,
            easeType: 0,
            easetime: 4,
            camFacingType: 0,
            camFacingX: 0,
            camFacingY: 0,
            cinePrevSpeed: 0.5,
            cinePrevSpeedMult: 5,

        });
    }
    if (!otherDataMap.has(player.id)) {
        otherDataMap.set(player.id, {
            isCameraInMotion: false,
        });
    }
}
