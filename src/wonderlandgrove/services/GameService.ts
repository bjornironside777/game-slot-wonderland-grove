import axios, { AxiosInstance, AxiosResponse } from 'axios';
import EventEmitter from 'eventemitter3';
import jwtDecode from 'jwt-decode';
import { container, singleton } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import ICommonGameService from '../../gamma-engine/common/services/ICommonGameService';
import Logger from '../../gamma-engine/core/utils/Logger';
import {
    CombinationWin,
    LineWin, MultiplierMap,
    RoundResult,
    ScatterWin,
    SpinResult
} from '../../gamma-engine/slots/model/RoundResult';
import SlotMachine from '../../gamma-engine/slots/model/SlotMachine';
import {
    PatternType,
    ReelDescription,
    RuleDescription,
    SlotMachineDescription,
    SlotMachineType
} from '../../gamma-engine/slots/model/SlotMachineDescription';
import Wallet from '../../gamma-engine/slots/model/Wallet';
import { getFromLocalStorage, saveToLocalStorage } from '../model/LocalStorageUtils';
import { SettingsType } from '../model/SettingsType';
import { TransactionType } from '../model/TransactionType';
import { GameServiceEvent } from './event/GameServiceEvent';
import { LineDirection, LoginResponse, TransactResponse } from './Responses';
import { currencyCode } from './text-json-files/DataSource';
import History from '../../gamma-engine/common/model/History';

@singleton()
export default class GameService extends EventEmitter implements ICommonGameService {

    // token will refresh if less than X seconds left to expiry
    private tokenRefreshThreshold: number = 300;

    private gameCode: string;
    private jwtToken: string;
    private ax: AxiosInstance;
    private hx: AxiosInstance;

    private lobbyUrl: string;

    private description: SlotMachineDescription;
    private featureBuy: {
        RoundType: number,
        Rate: number,
        Total: number
    };

    private _doubleChanceEnabled: boolean = false;
    private _settings: SettingsType;

    constructor(baseUrl: string, jwtToken: string, gameCode: string, lobbyUrl: string = '') {
        super();
        this.jwtToken = jwtToken;
        this.gameCode = gameCode;
        this.lobbyUrl = lobbyUrl;

        this.hx = axios.create({
			baseURL: baseUrl.replace('/engine-eleven',''),
			headers: {
				Authorization: `Bearer ${this.jwtToken}`,
			},
		});

        this.ax = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': `Bearer ${this.jwtToken}`
            }
        });

        this.ax.interceptors.request.use(async config => {
            if (config.url != 'Game/KeepAlive') {
                await this.checkAndUpdateToken();
            }
            return config;
        }, error => {
            Promise.reject(error);
        });

        this._settings = getFromLocalStorage('settings') ?? {
            quickSpin: false,
            batterySaver: false,
            ambientMusic: true,
            soundFx: true,
            introScreen: true,
        };
    }

    // PUBLIC API
    public async initialize(): Promise<[Wallet, SlotMachine]> {
        const data: LoginResponse = await this.login();
        //this.getHistoryResponse();
        if(!data?.Current) {
            data.Current = {
              Type: 1,
              TotalWin: 0,
              AccWin: 0,
              MaxWin:0,
              Multiplier:1,
              MultiplierMap:{},
              Result: {
                SC: 0,
                R: "103,103,105,105|102,201,104,104|103,103,201,105|104,104,104,102|104,101,102,103",
                WR: []
              },
              Round: {
                RoundType: 1,
                Bet: 4,
                ActualBet: 4,
                BetValue: 4,
                Line: 20,
                LineBet: 0.2,
                Payout: 0,
                Items: ['1']
              },
              FreeSpin:null
            }
            };

        const denomination: number = 1;
        const wallet: Wallet = new Wallet(denomination, [1], data.Player.Currency ?? "USD", "tr-TR", 2);

        const description: SlotMachineDescription = {
            rtp: 'unknown',
            type: SlotMachineType.COMBINATIONS,
            betLimits: data.GameInfo.LineBet,
            betMaxQuantity: 10,
            totalWinMultipliers: [
                1, 2, 3, 4, 5
            ],
            combinations: 20,
            bigWinMultiplierLevels: [10, 20, 30, 40],
            symbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],

            reels: {
                regular: {
                    cascading: false,
                    reels: [
                        {
                            numRows: 4,
                            availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                        },
                        {
                            numRows: 4,
                            availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                        },
                        {
                            numRows: 4,
                            availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                        },
                        {
                            numRows: 4,
                            availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                        },
                        {
                            numRows: 4,
                            availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                        }
                    ]
                },
                freeSpins: [
                    {
                        id: 0,
                        cascading: false,
                        reels: [
                            {
                                numRows: 4,
                                availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                            },
                            {
                                numRows: 4,
                                availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                            },
                            {
                                numRows: 4,
                                availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                            },
                            {
                                numRows: 4,
                                availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                            },
                            {
                                numRows: 4,
                                availableSymbols: [25, 105, 104, 103, 102, 101, 204, 203, 202, 201, 302, 301, 205, 206, 207, 208, 106, 107, 108, 109, 110],
                            }
                        ]
                    },
                ]
            },
            rules: [
                {
                    id: 0,
                    pattern: {
                        symbolId: 105,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.25
                        }
                    },
                    symbolDoubled: 110
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 105,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.5
                        }
                    },
                    symbolDoubled: 110
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 105,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.1
                        }
                    },
                    symbolDoubled: 110
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.5
                        }
                    },
                    symbolDoubled: 109
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.75
                        }
                    },
                    symbolDoubled: 109
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.15
                        }
                    },
                    symbolDoubled: 109
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 2.5
                        }
                    },
                    symbolDoubled: 108
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    },
                    symbolDoubled: 108
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.25
                        }
                    },
                    symbolDoubled: 108
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount:[5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 3
                        }
                    },
                    symbolDoubled: 107
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount:  [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.25
                        }
                    },
                    symbolDoubled: 107
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.5
                        }
                    },
                    symbolDoubled: 107
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 4
                        }
                    },
                    symbolDoubled: 106
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.5
                        }
                    },
                    symbolDoubled: 106
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.6
                        }
                    },
                    symbolDoubled: 106
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 204,
                        symbolCount:[5] ,
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 5
                        }
                    },
                    symbolDoubled: 208
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 204,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 2
                        }
                    },
                    symbolDoubled: 208
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 204,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.75
                        }
                    },
                    symbolDoubled: 208
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 7.5
                        }
                    },
                    symbolDoubled: 207
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 2.5
                        }
                    },
                    symbolDoubled: 207
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    },
                    symbolDoubled: 207
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount:[5] ,
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 10
                        }
                    },
                    symbolDoubled: 206
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 3.75
                        }
                    },
                    symbolDoubled: 206
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.25
                        }
                    },
                    symbolDoubled: 206
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount:[5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 25
                        }
                    },
                    symbolDoubled: 205
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [4],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 5
                        }
                    },
                    symbolDoubled: 205
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [3],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.5
                        }
                    },
                    symbolDoubled: 205
                },
            ]
        };
        this.description = description;
        wallet.balance = data.Player.Balance;

        const slotMachine: SlotMachine = new SlotMachine(description, {
            gameSpeedLevels: 2
        });

        const restoredResult: RoundResult = this.parseTransactDataToRoundResult(data, false);
        slotMachine.initialLineBet = restoredResult.lineBetValue;
        this.removeBlockElementFromSpinResult(restoredResult);

        slotMachine.roundResult = restoredResult;
        slotMachine.previousRoundResult = slotMachine.getDummyRoundResult(null);

        if(data.Next.Bonus) {
            slotMachine.currentSpinResult.bonus = {
                bonusGameid: data.Next.Bonus.id,
                lineBet: data.Next.Bonus.lineBet,
                expiredInMS: Math.max(new Date(data.Next.Bonus.expiredAt).getTime() - new Date().getTime(), 0),
                totalCount: data.Next.Bonus.spinCount,
                remainingCount: data.Next.Bonus.spinLeft,
                winAmount: data.Next.Bonus.totalWin,
                roundComplete: false
            }
        }

        this.featureBuy = {
            RoundType: data.GameInfo.BuyFeature[0].RoundType,
            Total: data.GameInfo.BuyFeature[0].Total,
            Rate: data.GameInfo.BuyFeature[0].Rate
        };


        slotMachine.currentGameSpeedLevel = !this._settings.quickSpin ? 0 : 1;

        return [wallet, slotMachine];
    }

    public get doubleUpChance(): boolean {
        return this._doubleChanceEnabled;
    }

    public set doubleUpChance(isActive: boolean) {
        if (this._doubleChanceEnabled == isActive)
            return;

        this._doubleChanceEnabled = isActive;
        this.emit(GameServiceEvent.DOUBLE_CHANCE_CHANGED);
    }

    // public async spin(): Promise<RoundResult> {
    //     const sm: SlotMachine = container.resolve(SlotMachine);
    //     const wallet: Wallet = container.resolve(Wallet);

    //     const totalBet: number = (sm.totalBet  * wallet.coinValue);
    //     const singleBet: number = totalBet/sm.combinations;
    //     return this.getFullRoundResultFromTransact(1, singleBet);
    // }

    public async spin(): Promise<RoundResult> {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);

        const totalBet: number = (sm.totalBet * wallet.coinValue);
        const singleBet: number = totalBet/sm.combinations;
        return this.getFullRoundResultFromTransact(1, singleBet);
    }

    private removeBlockElementFromSpinResult(roundResult: RoundResult): void {
        roundResult.spins.forEach((spin) => {
            for (let i = 0; i < spin.result.length; i++) {
                for (let j = 0; j < spin.result[i].length; j++) {
                    if (spin.result[i][j] == 0) {
                        spin.result[i].splice(j, 1);
                    }
                }
            }
        });
    }

    // public async buyFeature(): Promise<RoundResult> {
    //     const sm: SlotMachine = container.resolve(SlotMachine);

    //     const totalBet: number = 1;

    //     return this.getFullRoundResultFromTransact(2, totalBet);
    // }

    public async buyFeature(): Promise<RoundResult> {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);

        const totalBet: number = (sm.totalBet  * wallet.coinValue);
        const singleBet: number = totalBet/sm.combinations;
        return this.getFullRoundResultFromTransact(2, singleBet);
    }

    public async keepAlive(): Promise<void> {
        Logger.debug('GameService.keepAlive');

        const res: AxiosResponse = await this.ax.post('Game/KeepAlive', {
            GameCode: this.gameCode
        });
        this.jwtToken = res.data.Jwt;
        this.ax.defaults.headers.Authorisation = `Bearer ${this.jwtToken}`;
    }

  

    public async login(): Promise<LoginResponse> {
        Logger.debug('GameService.login');
        const res: AxiosResponse = await this.ax.post('preload', {
            GameCode: this.gameCode
        });
        return res.data.data;
    }

   

    // Round type: 1 - base game, 2 - feature buy
    public async transact(lineBet: number, numLines: number, type: number, roundType: number = 1, bonusId: string = null): Promise<TransactResponse> {
        Logger.debug('GameService.transact');
        const res: AxiosResponse = await this.ax.post('transact', {
            bonusId: bonusId,
            Type: type ?? 1,
            BetValue: 1,
            Line: 20,
            LineBet: lineBet,
            RoundType: roundType,
        });
        return res.data.data;
    }

    public lobby(): void {
        Logger.debug('GameService.lobby');
        if (typeof this.lobbyUrl != 'undefined' && this.lobbyUrl)
            window.open(this.lobbyUrl, '_self');
        else
            history.back();
    }

    public get featureBuyConfig() {
        return this.featureBuy;
    }

    public saveSettings() {
        saveToLocalStorage('settings', this._settings);
        this.emit(GameServiceEvent.SETTINGS_CHANGED, this);
    }

    public get settings() {
        return this._settings;
    }

    // PRIVATE API
    private async checkAndUpdateToken(): Promise<void> {
        const expirationTimestamp: number = jwtDecode(this.jwtToken)['exp'] * 1000;
        const timeLeftSeconds: number = (expirationTimestamp - Date.now()) / 1000;

        if (timeLeftSeconds < this.tokenRefreshThreshold) {
            await this.keepAlive();
        }
    }

    protected async getFullRoundResultFromTransact(roundType: number = 1, bet: number): Promise<RoundResult> {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);
        let data: TransactResponse = null;
        const lastRound: SpinResult = sm.previousRoundResult.spins[sm.previousRoundResult.spins.length - 1];
        const totalBet: number = (sm.totalBet * wallet.coinValue);
        try {
            data = await this.transact(bet, sm.combinations, sm.previousRoundResult.nextType, roundType, lastRound.bonus?.bonusGameid ?? null);
            sm.isTransact = true;
        } catch (e) {
            this.emit(GameServiceEvent.ERROR);
            throw (e);
        }
        let roundResult: RoundResult = this.parseTransactDataToRoundResult(data);
        const previousSpins: SpinResult[] = roundResult.spins;
        const freespins = roundResult.spins[0].freespins;
        //get cascade spins till its finished
        while (roundResult.nextType && (roundResult.nextType === TransactionType.RESPIN || roundResult.nextType === TransactionType.RESPIN_IN_FREESPIN)) {
            try {
                data = await this.transact(totalBet / Wallet.denomination, sm.combinations, roundResult.nextType, roundType, lastRound.bonus?.bonusGameid ?? null);
                sm.isTransact = true;
            } catch (e) {
                this.emit(GameServiceEvent.ERROR);
                throw (e);
            }
            const newResult: RoundResult = this.parseTransactDataToRoundResult(data);
            newResult.spins.forEach((spinResult) => {
                previousSpins.push(spinResult);
            });
            roundResult = newResult;
            roundResult.spins = previousSpins
        }

        roundResult.spins.forEach((spin) => {
            if (roundResult.spins[0].freespins) {
                spin.freespins = freespins;
            }
        });
        return roundResult;
    }

    private parseTransactDataToRoundResult(data: TransactResponse | LoginResponse, fullParse: boolean = true): RoundResult {
        //const sm: SlotMachine = container.resolve(SlotMachine);
     
        const roundResult: RoundResult = {
            complete: false,
            id: uuidv4(),
            lineBetValue: data.Current ? data.Current.Round.LineBet * Wallet.denomination : 0,
            betLines: data.Current ? data.Current.Round.Line : 0,
            totalBet: data.Current ? data.Current.Round.Bet : 0,
            totalWinValue: data.Current ? data.Current.Round.Payout : 0,
            accWin: data.Current.AccWin,
            payout: data.Current.Round.Payout,
            multiplierMap: data.Current ? this.parseMultiplierMap(data.Current.MultiplierMap) : null,
            spinIndex: 0,
            nextType: data.Next.Type,
            currentType : data.Current,
            balance: data.Player.Balance,
            spins: [
                {
                    result: data.Current ? this.parseReelsOutput(data.Current.Result.R) : this.dummyResultArray(),
                    winValue: data.Current ? data.Current.AccWin : 0,
                    currentTotalWinValue: data.Current ? data.Current.Round.Payout : 0,
                    win: (data.Current && data.Current.Result.WR.length > 0 && fullParse) ? {
                        multiWinShown: false,
                        combinations: this.parseCombinationWin(data.Current.Result.WR),
                        //lines: data.Current.Result.WR[0].T === 1 ? this.parseLineWins(data.Current.Result.WR[0].R) : null,
                        scatterWinShown: true,
                        scatters: data.Current.Result.SC > 0 ? this.parseScatterWins(data.Current.Result.R, data.Current.Result.R) : null,
                    } : {multiWinShown: true},
                    freespins: (data.Current && (data.Next.FreeSpin || data.Current.FreeSpin)) ? {
                        freespinId: data.Current.FreeSpin ? data.Current.FreeSpin.Current : 0,
                        totalCount: data.Current.FreeSpin ? data.Current.FreeSpin.Total : data.Next.FreeSpin.Total,
                        remainingCount: (data.Current.FreeSpin ? data.Current.FreeSpin.Total - data.Current.FreeSpin.Current : data.Next.FreeSpin.Total),//data.Next.FreeSpin? data.Next.FreeSpin.Total - (data.Next.FreeSpin.Next-1):data.Current.FreeSpin? data.Current.FreeSpin.Total - data.Current.FreeSpin.Current: 0,// (data.Current.FreeSpin ? data.Current.FreeSpin.Total - (data.Current.FreeSpin.Current+1) :(data.Next.FreeSpin?data.Next.FreeSpin.Total:0)),
                        roundStarted: (data.Current.FreeSpin && data.Current.FreeSpin.Current > 0),
                        roundComplete: false,
                    } : null,
                    bonus: (data.Current?.Bonus || data.Next.Bonus) ? {
                        bonusGameid: data.Current?.Bonus?.id ?? data.Next.Bonus.id,
                        lineBet: data.Current?.Bonus?.lineBet ?? data.Next?.Bonus?.lineBet,
                        expiredInMS: Math.max(new Date(data.Current?.Bonus?.expiredAt ?? data.Next?.Bonus?.expiredAt).getTime() - new Date().getTime(), 0),
                        totalCount: data.Current?.Bonus?.spinCount ?? data.Next?.Bonus?.spinCount,
                        remainingCount: data.Current?.Bonus?.spinLeft ?? data.Next?.Bonus?.spinLeft,
                        winAmount: data.Current?.Bonus?.totalWin ?? data.Next?.Bonus?.totalWin,
                        roundComplete: false
                    } : null,
                    nextBonus: (data.Next.Bonus && data.Current?.Bonus?.spinLeft === 0) ? {
                        bonusGameid: data.Next.Bonus.id,
                        lineBet: data.Next.Bonus.lineBet,
                        expiredInMS: Math.max(new Date(data.Next.Bonus.expiredAt).getTime() - new Date().getTime(), 0),
                        totalCount: data.Next.Bonus.spinCount,
                        remainingCount: data.Next.Bonus.spinLeft,
                        winAmount: data.Next.Bonus.totalWin,
                        roundComplete: false
                    } : null
                }
            ]
        };
        this.showScatterAnimation(roundResult, data);
        return roundResult;
    }

    private showScatterAnimation(roundResult: RoundResult, data: TransactResponse | LoginResponse) {
        const result = roundResult.spins[0].result.map(innerArray => innerArray.slice());
        let scatterCount = 0;
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < result[i].length; j++) {
                if (result[i][j] === 25) scatterCount++;
            }
        }
        if (scatterCount >= 4) {
            roundResult.spins[0].win.multiWinShown = false;
            roundResult.spins[0].win.scatterWinShown = false;
            // roundResult.spins[0].win.scatters = this.parseScatterWins(data.Current.Result.WR[0].R, data.Current.Result.R);
            let winResult = `${data.Current.Round.Payout},${scatterCount},25`;
            roundResult.spins[0].win.scatters = this.parseScatterWins(winResult, data.Current.Result.R);
        }

    }

    private dummyResultArray(): number[][] {
        const pattern: number[][] = [];
        for (let i = 0; i < this.description.reels.regular.reels.length; i++) {
            pattern.push([]);
            for (let j = 0; j < this.description.reels.regular.reels[0].numRows; j++) {
                pattern[i].push(this.description.symbols[Math.floor(Math.random() * this.description.symbols.length)]);
            }
        }
        return pattern;
    }

    private parseWaysWins(winRoundResult: string, patternResult: number[][]) {
        const roundResult: number[][] = this.buildScatterPattern(winRoundResult);
        const pattern: number[][] = [];

        //Initialize empty pattern
        for (let i = 0; i < roundResult.length; i++) {
            const reel: number[] = [];
            for (let j = 0; j < roundResult[i].length; j++) {
                reel.push(0);
            }
            pattern.push(reel);
        }


        for (let i = 0; i < patternResult.length; i++) {
            for (let j = 0; j < patternResult[i].length; j++) {
                pattern[i][patternResult[i][j]] = 1;
            }
        }

        return {
            winValue: 0,
            symbolId: 0,
            pattern: pattern
        };
    }

    private parseReelsOutput(data: string): number[][] {
        return data.split('|')
            .map((value: string): number[] => {
                return value.split(',')
                    .map((value: string): number => {
                        return parseInt(value);
                    });
            });
    }

    private parseCombinationWin(wrResult): CombinationWin[] {
        return wrResult.map(item => {
            const symbol = item.symbol;
            const wayPayout = item.wayPayout;
            const way = item.way.map(w => w.split('-').map(Number) as [number, number]);
            const multiplier = item.multiplier;
            const pattern = this.buildCombinationPattern(way);
            return {
                multiplier: multiplier,
                symbol: symbol,
                way: way,
                wayPayout: wayPayout,
                pattern: pattern
            };
        });

    }

    private parseMultiplierMap(data): MultiplierMap[] {
        return Object.entries(data).map(([key, value]: [string, number]) => {
            const [x, y] = key.split(',').map(Number);
            return {x: x, y: y, multiplier: value};
        });
    }

    private parseLineWins(data: string): LineWin[] {
        const sm: SlotMachine = container.resolve(SlotMachine);

        return data.split('|')
            .map((lineWinData: string): LineWin => {
                const lwd: string[] = lineWinData.split(',');
                // CoinPayout,Line,TotalSymbolMatched,Multiplier,Symbol,PayDirection(1-LTR,2-RTL)
                const winValue: number = parseFloat(lwd[0]) * Wallet.denomination;
                const lineIndex: number = parseInt(lwd[1]) - 1;

                const symbolId: number = parseInt(lwd[4]);
                const symbolCount: number = parseInt(lwd[2]);

                // TODO: check if win is premultiplied or not!!
                const multiplier: number = parseInt(lwd[3]);
                const payDirection: LineDirection = parseInt(lwd[5]) == 1 ? LineDirection.LTR : LineDirection.RTL;

                const winningRule: RuleDescription = sm.findRule(symbolId, symbolCount);

                return {
                    ruleId: winningRule.id,
                    lineIndex: lineIndex,
                    pattern: this.buildLinePattern(lineIndex, symbolCount, payDirection),
                    winMultiplier: winningRule.reward.line.multiplier,
                    winValue: winValue
                };
            });

    }

    private parseScatterWins(winRoundResult: string, roundResult: string): ScatterWin {
        const swd: string[] = winRoundResult.split(',');
        // CoinPayout,Line,TotalSymbolMatched,Symbol
        const winValue: number = parseFloat(swd[0]) * Wallet.denomination;
        const symbolId: number = parseInt(swd[2]);

        return {
            winValue: winValue,
            symbolId: symbolId,
            pattern: this.buildScatterPattern(roundResult, symbolId)
        };
    }

    private buildCombinationPattern(indexArray: number[]) {
        const desc: SlotMachineDescription = this.description;
        const pattern: number[][] = [];

        desc.reels.regular.reels.forEach((rd: ReelDescription) => {
            pattern.push(new Array<number>(rd.numRows).fill(0));
        });
        for (let i: number = 0; i < indexArray.length; i++) {
            pattern[indexArray[i][0]][indexArray[i][1]] = 1;
        }
        return pattern;
    }

    private buildLinePattern(lineIndex: number, symbolCount: number, payDirection: LineDirection): number[][] {
        const desc: SlotMachineDescription = container.resolve(SlotMachine).description;
        const linePattern: number[] = desc.lines[lineIndex];
        const pattern: number[][] = [];
        desc.reels.regular.reels.forEach((rd: ReelDescription) => {
            pattern.push(new Array<number>(rd.numRows).fill(0));
        });

        for (let i = 0; i < symbolCount; i++) {
            if (payDirection == LineDirection.LTR) {
                pattern[i][linePattern[i]] = 1;
            } else {
                pattern[pattern.length - 1 - i][linePattern[linePattern.length - 1 - i]] = 1;
            }
        }


        return pattern;
    }


    private buildScatterPattern(data: string, symbolId: number = null): number[][] {
        const pattern: number[][] = [];

        data.split('|')
            .map((reelData: string): void => {
                const lwd: string[] = reelData.split(',');
                const reel: number[] = [];

                lwd.forEach((symbol: string) => {
                    const id: number = parseInt(symbol);
                    reel.push(id === symbolId ? 1 : 0);
                });
                pattern.push(reel);
            });
        return pattern;
    }

    // // DEBUG CODE ONLY
    // private randomResult(sm: SlotMachine): number[][] {
    //     const reelSetDescription: ReelSetDescription = sm.description.reels.regular;
    //     return [
    //         [randomArrayElement(reelSetDescription.reels[0].availableSymbols), randomArrayElement(reelSetDescription.reels[0].availableSymbols), randomArrayElement(reelSetDescription.reels[0].availableSymbols)],
    //         [randomArrayElement(reelSetDescription.reels[1].availableSymbols), randomArrayElement(reelSetDescription.reels[1].availableSymbols), randomArrayElement(reelSetDescription.reels[1].availableSymbols)],
    //         [randomArrayElement(reelSetDescription.reels[2].availableSymbols), randomArrayElement(reelSetDescription.reels[2].availableSymbols), randomArrayElement(reelSetDescription.reels[2].availableSymbols)],
    //         [randomArrayElement(reelSetDescription.reels[3].availableSymbols), randomArrayElement(reelSetDescription.reels[3].availableSymbols), randomArrayElement(reelSetDescription.reels[3].availableSymbols)],
    //         [randomArrayElement(reelSetDescription.reels[4].availableSymbols), randomArrayElement(reelSetDescription.reels[4].availableSymbols), randomArrayElement(reelSetDescription.reels[4].availableSymbols)],
    //     ];
    // }

    private pickOneConverter(output: number[][], pickOneSymbols: number[]): void {
        for (let i = 0; i < output.length; i++) {
            for (let j = 0; j < output[i].length; j++) {
                if (pickOneSymbols.includes(output[i][j])) {
                    output[i][j] = this.removeFirstDigit(output[i][j]);
                }
            }
        }
    }

    private removeFirstDigit(num: number): number {
        const numStr: string = num.toString();
        if (numStr.length >= 2) {
            const newNumStr: string = numStr.slice(1);
            return parseInt(newNumStr);
        }
    }

    public async getHistoryResponse(page: number, perPage:number): Promise<void> {
		const historyResponse = await this.getMyBets(page, perPage);
		const history: History = container.resolve(History);
        history.currentPage = historyResponse.page;
        history.totalPages = historyResponse.totalPages;
        history.entries=[];
		historyResponse.bets.forEach((historyData) => {
			history.entries.push({
				datetime: historyData.createdAt,
				balance: historyData.player.Balance,
				win: Number(historyData.winningAmount) + Number(historyData.freeSpinWinningAmount),
				totalBet: Number(historyData.betAmount),
                betId: historyData.id
			});
		});
        return historyResponse;
	}

	public async getMyBets(page?: number,perPage?:number): Promise<any> {
         const res: AxiosResponse = await this.hx.get('my-bets', {
             params: {
                 page: page ? page : 1,
                 perPage:perPage
             }
         });
         return res.data.data;
     }
}
export type OperatorLoginModel = {
    userName: string,
    currencyCode: string
}
