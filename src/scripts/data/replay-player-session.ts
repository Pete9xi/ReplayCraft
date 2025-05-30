import { Player, Vector3 } from "@minecraft/server";
import { ReplayStateMachine } from "../classes/replayStateMachine";
import { PlayerBlockData } from "../classes/types/types";

export interface PlayerReplaySession {
    playerName: string;
    soundIds: string[];
    easeTypes: string[];
    skinTypes: string[];
    dbgRecController?: Player;
    dbgRecTime: number;
    replayStateMachine: ReplayStateMachine;
    multiPlayers: Player[];
    multiToggle: boolean;
    replayBDataMap: Map<string, PlayerBlockData>; //Block Related Data (After placing/breaking)
    replayBDataBMap: Map<any, any>;
    replayBData1Map: Map<any, any>;
    replayPosDataMap: Map<any, any>;
    replayRotDataMap: Map<any, any>;
    replayMDataMap: Map<any, any>;
    replayODataMap: Map<any, any>;
    replaySDataMap: Map<any, any>;
    twoPartBlocks: string[];
    toggleSound: boolean;
    selectedSound: number;
    wantLoadFrameTick: number;
    frameLoaded: boolean;
    startingValueTick: number;
    replayCamPos: any[];
    replayCamRot: any[];
    soundCue: boolean;
    textPrompt: boolean;
    startingValueSecs: number;
    startingValueMins: number;
    startingValueHrs: number;
    repCamTout1Map: Map<any, any>;
    repCamTout2Map: Map<any, any>;
    settCameraType: number;
    replayCamEase: number;
    settReplayType: number;
    followCamSwitch: boolean;
    chosenReplaySkin: number;
    settNameType: number;
    settCustomName: string;
    currentSwitch: boolean;
    lilTick: number;
    replaySpeed: number;
    dbgCamFocusPlayer?: Player;
    dbgCamAffectPlayer: Player[];
    topDownCamSwitch: boolean;
    topDownCamSwitch2: boolean;
    topDownCamHight: number;
    focusPlayerSelection: number;
    affectCameraSelection: number;
    buildName: string;
    hideHUD: boolean;
    showCameraSetupUI: boolean;
    currentEditingCamIndex: number;
    useFullRecordingRange: boolean;
    dbgBlockData: Record<
        number,
        {
            location: Vector3;
            typeId: string;
            states: Record<string, boolean | number | string>;
        }
    >;
    dbgBlockData1: Record<
        number,
        {
            location: Vector3;
            typeId: string;
            states: Record<string, boolean | number | string>;
        }
    >;
}

export let SharedVariables = {
    playerSessions: new Map<string, PlayerReplaySession>(),
};
