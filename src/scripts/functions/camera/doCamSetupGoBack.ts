import { Player } from "@minecraft/server";
import { SharedVariables } from "../../data/replay-player-session";

export function doCamSetupGoBack(player: Player) {
    const session = SharedVariables.playerSessions.get(player.id);
    if (!session) {
        player.sendMessage("§c[ReplayCraft] Error: No replay session found for you.");
        return;
    }
    if (session.currentSwitch === true) {
        if (session.textPrompt) {
            player.sendMessage({
                rawtext: [
                    {
                        translate: "dbg.rc1.mes.please.wait.for.replay.to.be.completed",
                    },
                ],
            });
        }
        if (session.soundCue) {
            player.playSound("note.bass");
        }
        return;
    }
    session.replayStateMachine.setState("recCamSetup");
    session.replayCamPos = [];
    session.replayCamRot = [];
    session.wantLoadFrameTick = 0;
    if (session.textPrompt) {
        player.sendMessage({
            rawtext: [
                {
                    translate: "dbg.rc1.mes.please.do.the.cinematic.camera.setup",
                },
            ],
        });
    }
}
