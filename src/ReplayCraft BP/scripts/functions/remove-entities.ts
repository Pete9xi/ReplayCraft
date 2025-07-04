import { Player } from "@minecraft/server";

/**
 * Removes ReplayCraft Entities.
 * @param {player} player - The player who initiated the function.
 * @param {replayEntity} replayEntity - A boolean indicating whether to remove replay entities.
 * if true, removes only replay entities; if false, removes all replay entities and camera positions entities.
 */
export function removeEntities(player: Player, replayEntity: boolean) {
    const dimension = player.dimension;
    let types: string[];
    if (replayEntity) {
        types = ["dbg:replayentity_steve", "dbg:replayentity_alex"];
    } else {
        types = ["dbg:replayentity_steve", "dbg:replayentity_alex", "dbg:rccampos"];
    }

    for (const type of types) {
        const entities = dimension.getEntities({ type });
        for (const entity of entities) {
            if (entity.hasTag("owner:" + player.id)) {
                entity.remove();
            }
        }
    }
}
