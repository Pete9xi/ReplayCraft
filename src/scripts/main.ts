import { beforeChatSend } from "./classes/subscriptions/chat-send-before-event";
import { replaycraftBreakBlockAfterEvent } from "./classes/subscriptions/player-break-block-after-event";
import { replaycraftBreakBlockBeforeEvent } from "./classes/subscriptions/player-break-block-before-event";
import { replaycraftInteractWithBlockAfterEvent } from "./classes/subscriptions/player-interact-with-block-after-event";
import { replaycraftInteractWithBlockBeforeEvent } from "./classes/subscriptions/player-interact-with-block-before-event";
import { replaycraftItemUseAfterEvent } from "./classes/subscriptions/player-item-use-after-event";
import { replaycraftPlaceBlockBeforeEvent } from "./classes/subscriptions/player-place-block-before-event";
import { replaycraftPlaceBlockAfterEvent } from "./classes/subscriptions/player-place-block-after-event";
import { BlockPermutation, EasingType, EquipmentSlot, system, world } from "@minecraft/server";
import { clearStructure } from "./functions/clear-structure";
import { playBlockSound } from "./functions/play-block-sound";
import { onPlayerSpawn } from "./classes/subscriptions/player-spawn-after-event";
import { onPlayerLeave } from "./classes/subscriptions/player-leave-after-event";
import { subscribeToWorldInitialize } from "./classes/subscriptions/world-initialize";
//temp solution for the missing import this needs to be convered.
import "./ReplayCraft.js";
import { removeEntities } from "./functions/remove-entities";
import config from "./data/util/config";
import { replaySessions } from "./data/replay-player-session";

//Chat events
beforeChatSend();
//Events
replaycraftBreakBlockAfterEvent();
replaycraftBreakBlockBeforeEvent();
replaycraftPlaceBlockBeforeEvent();
replaycraftPlaceBlockAfterEvent();
replaycraftInteractWithBlockBeforeEvent();
replaycraftInteractWithBlockAfterEvent();
// soon to be removed from the API!
replaycraftItemUseAfterEvent();

//Show the player a useful message for the first time they join!
onPlayerSpawn();
//Handle player leaving the game
onPlayerLeave();

//data-hive
subscribeToWorldInitialize();

//Timer for each frame?
system.runInterval(() => {
    // Iterate all player sessions
    for (const session of replaySessions.playerSessions.values()) {
        if (session.replayStateMachine.state === "recPending") {
            session.recordingEndTick += 1;
        }
    }
}, 1);

/*
 * Handles replay playback for all active sessions.
 * When the replay reaches the end, sets the replay state to "recSaved"
 * Clears replay-related structures and entities for each player in the session
 * Resets the tick counter
 */
system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        if (session.replayStateMachine.state === "viewStartRep") {
            if (session.currentTick >= session.recordingEndTick - 1) {
                session.replayStateMachine.setState("recSaved");
                session.trackedPlayers.forEach((player) => {
                    session.isReplayActive = false;
                    clearStructure(player);
                    removeEntities(player, true);
                });
                session.currentTick = 0;
                continue; // Move to next session
            }
            session.currentTick++;
        }
    }
}, 1);
/*
 * Manages active replay playback for all sessions in the "recStartRep" state.
 * When the replay reaches its end:
 * Finalizes the replay by setting state to "recCompleted" (optionally triggering UI update)
 * Resets various camera modes and clears player cameras
 * Cleans up replay structures and entities for each player
 * Resets the tick counter
 */
system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        if (session.replayStateMachine.state === "recStartRep") {
            if (session.currentTick >= session.recordingEndTick - 1) {
                if (session.showCameraSetupUI === true) {
                    session.replayStateMachine.setState("recCompleted", true);
                    session.showCameraSetupUI = false;
                } else {
                    session.replayStateMachine.setState("recCompleted");
                }

                session.trackedPlayers.forEach((player) => {
                    session.isFollowCamActive = false;
                    session.isTopDownFixedCamActive = false;
                    session.isTopDownDynamicCamActive = false;
                    player.camera.clear();
                    session.isReplayActive = false;
                    clearStructure(player);
                    removeEntities(player, true);
                });

                session.currentTick = 0;
                continue; // go to next session
            }
            session.currentTick++;
        }
    }
}, 1);
/**
 * Runs every tick and iterates through each replay session in
 * SharedVariables.playerSessions. For each session, it iterates through the
 * session's players (trackedPlayers) and updates blocks according to the recorded
 * block data for the current replay tick.
 */
system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state === "viewStartRep" || session.replayStateMachine.state === "recStartRep") {
                if (session.currentTick <= session.recordingEndTick) {
                    const playerData = session.replayBlockStateMap.get(player.id);
                    const customEntityWrapper = session.replayEntityDataMap.get(player.id);
                    const customEntity = customEntityWrapper?.customEntity;
                    if (playerData && playerData.blockStateChanges[session.currentTick]) {
                        const blockData = playerData.blockStateChanges[session.currentTick];
                        const dimension = world.getDimension(player.dimension.id);

                        if (blockData.lowerPart && blockData.upperPart) {
                            const { lowerPart, upperPart } = blockData;
                            dimension.getBlock(lowerPart.location).setPermutation(BlockPermutation.resolve(lowerPart.typeId, lowerPart.states));
                            dimension.getBlock(upperPart.location).setPermutation(BlockPermutation.resolve(upperPart.typeId, upperPart.states));
                        } else if (blockData.thisPart && blockData.otherPart) {
                            const { thisPart, otherPart } = blockData;
                            dimension.getBlock(thisPart.location).setPermutation(BlockPermutation.resolve(thisPart.typeId, thisPart.states));
                            dimension.getBlock(otherPart.location).setPermutation(BlockPermutation.resolve(otherPart.typeId, otherPart.states));
                        } else {
                            const { location, typeId, states } = blockData;
                            if (session.settingReplayType === 0 && customEntity) {
                                customEntity.playAnimation("animation.replayentity.attack");
                            }
                            playBlockSound(blockData, player);
                            dimension.getBlock(location).setPermutation(BlockPermutation.resolve(typeId, states));
                        }
                    }
                }
            }
        });
    }
}, 1);

system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state === "viewStartRep" || session.replayStateMachine.state === "recStartRep") {
                if (session.currentTick <= session.recordingEndTick) {
                    const playerData = session.replayBlockInteractionAfterMap.get(player.id);
                    const entityData = session.replayEntityDataMap.get(player.id);
                    const blockData = playerData.blockSateAfterInteractions[session.currentTick];

                    if (blockData) {
                        if (session.settingReplayType === 0) {
                            entityData.customEntity.playAnimation("animation.replayentity.attack");
                        }

                        const dimension = world.getDimension(session.replayController.dimension.id);

                        // Inline type guard to check if it's a two-part block
                        if ("lowerPart" in blockData && "upperPart" in blockData) {
                            const { lowerPart, upperPart } = blockData;

                            const lowerBlock = dimension.getBlock(lowerPart.location);
                            lowerBlock.setPermutation(BlockPermutation.resolve(lowerPart.typeId, lowerPart.states));

                            const upperBlock = dimension.getBlock(upperPart.location);
                            upperBlock.setPermutation(BlockPermutation.resolve(upperPart.typeId, upperPart.states));
                        } else {
                            const { location, typeId, states } = blockData;
                            const block = dimension.getBlock(location);
                            block.setPermutation(BlockPermutation.resolve(typeId, states));
                        }
                    }
                }
            }
        });
    }
}, 1);

//Collect player position data based on the current tick time
system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state !== "recPending") return;
            const posData = session.replayPositionDataMap.get(player.id);
            const rotData = session.replayRotationDataMap.get(player.id);
            if (!posData) return;
            const ploc = player.location;
            const rotxy = player.getRotation();
            posData.recordedPositions.push(ploc);
            rotData.recordedRotations.push(rotxy);
        });
    }
}, 1);

//entity? maybe play back ?
system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state === "viewStartRep" || session.replayStateMachine.state === "recStartRep") {
                const entityData = session.replayEntityDataMap.get(player.id);
                const posData = session.replayPositionDataMap.get(player.id);
                const rotData = session.replayRotationDataMap.get(player.id);
                if (!posData) return;

                if (session.settingReplayType === 0) {
                    entityData.customEntity.teleport(posData.recordedPositions[session.currentTick], {
                        rotation: rotData.recordedRotations[session.currentTick],
                    });
                }
            }
        });
    }
}, 1);

/**Collect player sneak data based on the current tick time
 * We can expand this to collect the following data:
 * player.isClimbing
 * player.isFalling
 * player.isSwimming
 * player.isFlying
 * player.isGliding
 * player.isSleeping
 * */
system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state !== "recPending") return;
            const playerData = session.replayActionDataMap.get(player.id);
            if (!playerData) return;
            playerData.isSneaking.push(player.isSneaking ? 1 : 0);
            if (config.devAnimations === true) {
                // playerData.isSwimming.push(player.isSwimming ? 1 : 0);
                // playerData.isClimbing.push(player.isClimbing ? 1 : 0);
                // playerData.isFalling.push(player.isFalling ? 1 : 0);
                // playerData.isFlying.push(player.isFlying ? 1 : 0);
                // playerData.isGliding.push(player.isGliding ? 1 : 0);
                playerData.isSleeping.push(player.isSleeping ? 1 : 0);
            }
        });
    }
}, 1);

system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        if (session.settingReplayType !== 0) return;
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state === "viewStartRep" || session.replayStateMachine.state === "recStartRep") {
                const playerData = session.replayActionDataMap.get(player.id);
                const entityData = session.replayEntityDataMap.get(player.id);
                if (!playerData) return;
                entityData.customEntity.isSneaking = playerData.isSneaking[session.currentTick] === 1;
                // customEntity.setProperty("dbg:is_swimming", playerData.isSwimming[session.currentTick] === 1);
                // customEntity.setProperty("dbg:is_climbing", playerData.isClimbing[session.currentTick] === 1);
                // customEntity.setProperty("dbg:is_falling", playerData.isFalling[session.currentTick] === 1);
                // customEntity.setProperty("dbg:is_flying", playerData.isFlying[session.currentTick] === 1);
                // customEntity.setProperty("dbg:is_gliding", playerData.isGliding[session.currentTick] === 1);
                entityData.customEntity.setProperty("dbg:is_sleeping", playerData.isSleeping[session.currentTick] === 1);
            }
        });
    }
}, 1);

//Items/Weapons/Armor Data

system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state !== "recPending") return;
            const playerData = session.replayEquipmentDataMap.get(player.id);
            if (!playerData) return;
            playerData.weapon1.push(player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Mainhand)?.typeId || "air");
            playerData.weapon2.push(player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Offhand)?.typeId || "air");
            playerData.armor1.push(player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Head)?.typeId || "air");
            playerData.armor2.push(player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Chest)?.typeId || "air");
            playerData.armor3.push(player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Legs)?.typeId || "air");
            playerData.armor4.push(player.getComponent("minecraft:equippable").getEquipment(EquipmentSlot.Feet)?.typeId || "air");
        });
    }
}, 1);

//TODO This can be optimized to use native methods.

system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        if (session.settingReplayType !== 0) return;
        session.trackedPlayers.forEach((player) => {
            if (session.replayStateMachine.state === "viewStartRep" || session.replayStateMachine.state === "recStartRep") {
                const playerData = session.replayEquipmentDataMap.get(player.id);
                const entityData = session.replayEntityDataMap.get(player.id);

                if (!playerData) return;
                entityData.customEntity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${playerData.weapon1[session.currentTick]}`);
                entityData.customEntity.runCommand(`replaceitem entity @s slot.weapon.offhand 0 ${playerData.weapon2[session.currentTick]}`);
                entityData.customEntity.runCommand(`replaceitem entity @s slot.armor.head 0 ${playerData.armor1[session.currentTick]}`);
                entityData.customEntity.runCommand(`replaceitem entity @s slot.armor.chest 0 ${playerData.armor2[session.currentTick]}`);
                entityData.customEntity.runCommand(`replaceitem entity @s slot.armor.legs 0 ${playerData.armor3[session.currentTick]}`);
                entityData.customEntity.runCommand(`replaceitem entity @s slot.armor.feet 0 ${playerData.armor4[session.currentTick]}`);
            }
        });
    }
}, 1);

//???
system.runInterval(() => {
    for (const session of replaySessions.playerSessions.values()) {
        if (session.isFollowCamActive === true) {
            session.cameraAffectedPlayers.forEach((player) => {
                //const player = dbgRecController;
                const entityData = session.replayEntityDataMap.get(session.cameraFocusPlayer.id);
                const { x, y, z } = entityData.customEntity.location;
                const location = {
                    x,
                    y: y + 1.5,
                    z,
                };
                player.camera.setCamera("minecraft:free", {
                    facingLocation: location,
                    easeOptions: {
                        easeTime: 0.4,
                        easeType: EasingType.Linear,
                    },
                });
            });
        }
        if (session.isTopDownFixedCamActive === true) {
            session.cameraAffectedPlayers.forEach((player) => {
                //const player = dbgRecController;
                const entityData = session.replayEntityDataMap.get(session.cameraFocusPlayer.id);
                const { x, y, z } = entityData.customEntity.location;
                const location = {
                    x,
                    y: y + session.topDownCamHight,
                    z,
                };
                /**
             * left over code can this ben removed?
             * const location2 = {
                x,
                y,
                z
            };
             */

                player.camera.setCamera("minecraft:free", {
                    location: location,
                    //facingLocation: location2,
                    //facingEntity: customEntity,
                    rotation: {
                        x: 90,
                        y: 0,
                    },
                    easeOptions: {
                        easeTime: 0.4,
                        easeType: EasingType.Linear,
                    },
                });
            });
        }
        if (session.isTopDownDynamicCamActive === true) {
            session.cameraAffectedPlayers.forEach((player) => {
                //const player = dbgRecController;
                const entityData = session.replayEntityDataMap.get(session.cameraFocusPlayer.id);
                const { x, y, z } = entityData.customEntity.location;
                entityData.customEntity.getRotation();
                const location = {
                    x,
                    y: y + session.topDownCamHight,
                    z,
                };
                const rotation = entityData.customEntity.getRotation();
                const rotation2 = {
                    x: 90,
                    y: rotation.y,
                };
                player.camera.setCamera("minecraft:free", {
                    location: location,
                    rotation: rotation2,
                    easeOptions: {
                        easeTime: 0.4,
                        easeType: EasingType.Linear,
                    },
                });
            });
        }
    }
}, 1);
