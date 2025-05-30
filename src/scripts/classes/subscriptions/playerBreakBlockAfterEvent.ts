import { PlayerBreakBlockAfterEvent, world } from "@minecraft/server";
import { SharedVariables } from "../../data/replay-player-session";
import { saveBedParts } from "../../functions/saveBedsParts";
import { saveDoorParts } from "../../functions/saveDoorParts";

function recordBlocks(event: PlayerBreakBlockAfterEvent) {
    const { player, block } = event;
    const session = SharedVariables.playerSessions.get(player.id);

    if (!session) return;
    if (session.replayStateMachine.state !== "recPending") return;

    if (block.typeId === "minecraft:bed" || session.twoPartBlocks.includes(block.type.id)) {
        if (block.typeId === "minecraft:bed") {
            saveBedParts(block, player);
        } else {
            saveDoorParts(block, player);
        }
    } else {
        session.dbgBlockData[session.dbgRecTime] = {
            location: block.location,
            typeId: block.typeId,
            states: block.permutation.getAllStates(),
        };
    }
}

const replaycraftBreakBlockAfterEvent = () => {
    world.afterEvents.playerBreakBlock.subscribe(recordBlocks);
};

export { replaycraftBreakBlockAfterEvent };
