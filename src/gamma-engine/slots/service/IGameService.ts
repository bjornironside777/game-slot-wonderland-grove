import Wallet from '../model/Wallet';
import SlotMachine from '../model/SlotMachine';
import { RoundResult } from '../model/RoundResult';
import { SettingsType } from '../model/SettingsType';
import EventEmitter from 'eventemitter3'

export default interface IGameService extends EventEmitter {
    initialize(): Promise<[Wallet, SlotMachine]>;
    spin(betValue: number, numLines: number): Promise<RoundResult>;
    buyFeature(): Promise<RoundResult>;
    lobby(): void;
    saveSettings(): void;
    get settings(): SettingsType;
}
