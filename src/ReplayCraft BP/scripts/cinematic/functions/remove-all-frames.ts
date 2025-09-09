import { Player } from "@minecraft/server";
import { frameDataMap, cineRuntimeDataMap } from "../data/maps";
import { removeAllFrameEntities } from "./entity/remove-all-frame-entities";
import { cinematicFramesDB } from "../cinematic";

export function removeAllFrames(player: Player) {
    const frames = frameDataMap.get(player.id) ?? [];

    const cineRuntimeData = cineRuntimeDataMap.get(player.id);
    if (cineRuntimeData.isCameraInMotion === true) {
        player.playSound("note.bass");
        player.sendMessage({
            translate: "dbg.rc2.mes.cannot.remove.all.frames.while.camera.is.in.motion",
        });
        return;
    }

    if (frames.length === 0) {
        player.playSound("note.bass");
        player.sendMessage({
            translate: "dbg.rc2.mes.no.frames.to.remove",
        });
        return;
    }
    removeAllFrameEntities(player);

    frameDataMap.set(player.id, []);
    cinematicFramesDB.set(player.id, []);

    player.sendMessage({
        translate: "dbg.rc2.mes.all.frames.have.been.removed",
    });
}
