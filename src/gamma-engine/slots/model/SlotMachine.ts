import EventEmitter from 'eventemitter3';
import {RuleDescription, SlotMachineDescription} from './SlotMachineDescription';
import {SlotMachineState} from './SlotMachineState';
import {SlotMachineEvent} from './event/SlotMachineEvent';
import {SlotMachineOptions} from './SlotMachineOptions';
import {RoundResult, SpinResult} from './RoundResult';
import Autoplay from './Autoplay';
import {SymbolData} from '../view/SymbolData';

export default class SlotMachine extends EventEmitter {
	readonly defaultDescription: Partial<SlotMachineDescription> = {
		lines: [],
		wildcards: [],
		bigWinMultiplierLevels: [],
	};

	readonly defaultOptions: SlotMachineOptions = {
		gameSpeedLevels: 1,
	};

	readonly description: SlotMachineDescription;

	readonly options: SlotMachineOptions;

	private _currentLineWin: number;

	private _currentState: SlotMachineState = SlotMachineState.NOT_INITIALIZED;

	private _currentBetValue: number;

	private _currentGameSpeedLevel: number = 0;
	public isTransact: boolean = false;
	private _betQuantity: number = 1;

	// TODO: Think about moving these to round object
	// RESETTABLE STATUS VARS
	public showFreeSpinsPopup: boolean = true;

	public reelsStarted: boolean = false;

	public stopRequested: boolean = false;

	public spinTimeLapsed: boolean = false;

	public bigWinShown: boolean = false;

	public bonusGameShown: boolean = false;

	public bonusGameStarted: boolean = false;

	public bonusForLater: {
		bonusGameid: string;
		expiredInMS: number;
		totalCount: number;
		remainingCount: number;
		roundComplete: boolean;
		winAmount: number;
		lineBet: number;
	} = null;

	public initialLineBet: number;

	public _currentError: string = '';

	private _balance: number = 0;

	// public roundResult: RoundResult = null;
	private round_Result: RoundResult = null;

	public previousRoundResult: RoundResult = null;

	public autoplay: Autoplay;
    public  bonusGameClaimdValue:number=0;
	constructor(description: SlotMachineDescription, options: Partial<SlotMachineOptions> = null) {
		super();

		// merge config with default values
		this.description = {...this.defaultDescription, ...description};
		this.options = {...this.defaultOptions, ...options};

		this._currentBetValue = this.description.betLimits[0];

		this.autoplay = new Autoplay();

		document.body.addEventListener('keydown', this.onSpaceClick.bind(this));
	}

	private onSpaceClick(event: KeyboardEvent) {
		this.emit(SlotMachineEvent.KEY_PRESSED, event);
	}

	// PUBLIC API
	public get roundResult(): RoundResult {
		return this.round_Result;
	}

	public set roundResult(value: RoundResult) {
		this.round_Result = value;
	}

	public set betQuantity(value: number) {
		if (this._betQuantity == value || value > 10 || value <= 0) {
			return;
		}
		this._betQuantity = value;
		this.emit(SlotMachineEvent.BET_VALUE_CHANGED);
	}

	public get betQuantity() {
		return this._betQuantity;
	}

	public get currentState(): SlotMachineState {
		return this._currentState;
	}

	public set currentState(value: SlotMachineState) {
		if (this._currentState == value) {
			return;
		}
		const previousState: SlotMachineState = this._currentState;
		this._currentState = value;
		this.emit(SlotMachineEvent.STATE_CHANGED, this._currentState, previousState);
	}

	public get numLines(): number {
		return this.description.lines.length;
	}

	public get combinations(): number {
		return this.description.combinations;
	}

	public get currentBetValue(): number {
		return this._currentBetValue;
	}

	public set currentBetValue(value: number) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = this.description.betLimits[0];
        }
        if (!this._currentBetValue) {
            this._currentBetValue = value;
            this.emit(SlotMachineEvent.BET_VALUE_CHANGED, this._currentBetValue);
            return;
        }
        if (this._currentBetValue === value) {
            return;
        }
        this._currentBetValue = value;
        this.emit(SlotMachineEvent.BET_VALUE_CHANGED, this._currentBetValue);
    }

	public get totalBet(): number {
		return this._currentBetValue * (this.numLines == 0 ? this.combinations : this.numLines) * this.betQuantity;
	}

	public get currentGameSpeedLevel(): number {
		return this._currentGameSpeedLevel;
	}

	public set currentGameSpeedLevel(value: number) {
		if (this._currentGameSpeedLevel == value) {
			return;
		}
		this._currentGameSpeedLevel = value;
		this.emit(SlotMachineEvent.GAME_SPEED_LEVEL_CHANGED, this._currentGameSpeedLevel);
	}

	public get currentSpinResult(): SpinResult {
		if (this.roundResult) {
			return this.roundResult.spins[this.roundResult.spinIndex];
		}
		return null;
	}

	public get nextSpinResult(): SpinResult {
		if (this.roundResult && this.roundResult.spins.length > this.roundResult.spinIndex + 1) {
			return this.roundResult.spins[this.roundResult.spinIndex + 1];
		}
		return null;
	}

	public get previousSpinResult(): SpinResult {
		if (this.roundResult) {
			return this.roundResult.spins[this.roundResult.spinIndex - 1];
		}
		return null;
	}

	public multiWinPattern(spinResult: SpinResult): number[][] {
		// create empty pattern
		const pattern: number[][] = [];
		for (let i = 0; i < spinResult.result.length; i++) {
			pattern.push([]);
			for (let j = 0; j < spinResult.result[i].length; j++) {
				pattern[i].push(0);
			}
		}

		// iterate over line wins and mark winning symbols
		if (spinResult.win.lines) {
			for (const win of spinResult.win.lines) {
				for (let i = 0; i < pattern.length; i++) {
					for (let j = 0; j < pattern[i].length; j++) {
						pattern[i][j] = pattern[i][j] || win.pattern[i][j];
					}
				}
			}
		}
		if (spinResult.win.combinations) {
			// iterate over combination wins and mark winning symbols
			for (const win of spinResult.win.combinations) {
				for (let i = 0; i < pattern.length; i++) {
					for (let j = 0; j < pattern[i].length; j++) {
						pattern[i][j] = pattern[i][j] || win.pattern[i][j];
					}
				}
			}
		}

		if (spinResult.win.scatters) {
			// iterate over scatter wins and mark winning symbols
			for (let i = 0; i < pattern.length; i++) {
				for (let j = 0; j < pattern[i].length; j++) {
					pattern[i][j] = pattern[i][j] || spinResult.win.scatters.pattern[i][j];
				}
			}
		}

		if (spinResult.win.freespins) {
			// iterate over scatter wins and mark winning symbols
			for (let i = 0; i < pattern.length; i++) {
				for (let j = 0; j < pattern[i].length; j++) {
					pattern[i][j] = pattern[i][j] || spinResult.win.freespins.pattern[i][j];
				}
			}
		}

		return pattern;
	}

	public get currentError(): string {
		return this._currentError;
	}

	public set currentError(error: string) {
		this._currentError = error;
	}

	public lineWinValue(spinResult: SpinResult): number {
		return spinResult.win.lines.reduce((totalWin: number, win) => {
			return totalWin + win.winValue;
		}, 0);
	}

	public bigWinLevel(roundResult: RoundResult): number {
		// const winMultiplierRatio: number = roundResult.totalWinValue / roundResult.totalBet;

		const winMultiplierRatio: number = roundResult.accWin / roundResult.totalBet;

		let level: number = -1;
		for (let i = 0; i < this.description.bigWinMultiplierLevels.length; i++) {
			if (winMultiplierRatio >= this.description.bigWinMultiplierLevels[i]) {
				level = i;
			}
		}

		return level;
	}

	public get balance(): number {
		return this._balance;
	}

	public set balance(value: number) {
		if (this._balance === value) {
			return;
		}
		const previousBalance: number = this._balance;
		this._balance = value;
		this.emit(SlotMachineEvent.BALANCE_CHANGED, this._balance, previousBalance);
	}

	public findRule(symbolId: number, symbolCount: number): RuleDescription {
		return this.description.rules.find((rd: RuleDescription): boolean => {
			if (rd.pattern.symbolId == symbolId && rd.pattern.symbolCount.includes(symbolCount)) {
				return true;
			}

			return false;
		});
	}

	public findDoubledSymbol(symbolsToSort: SymbolData[], indexMap: Map<number, number>) {
		return symbolsToSort.sort((a, b) => {
			const indexA: number = indexMap.get(a.id);
			const indexB: number = indexMap.get(b.id);
			if (indexA === undefined || indexB === undefined) {
				return 0;
			}
			return indexA - indexB;
		});
	}

	public set currentLineWin(value: number) {
		this._currentLineWin = value;
		this.emit(SlotMachineEvent.NEW_LINE_SHOW, this.currentLineWin);
	}

	public get currentLineWin(): number {
		return this._currentLineWin;
	}

	//Dummy round result is used for lost connection error when user has no previous data (ERROR -> stop on previous round result)
	public getDummyRoundResult(result: RoundResult = null): RoundResult {
		// create empty pattern
		const pattern: number[][] = [];
		for (let i = 0; i < this.description.reels.regular.reels.length; i++) {
			pattern.push([]);
			for (let j = 0; j < this.description.reels.regular.reels[0].numRows; j++) {
				pattern[i].push(this.description.symbols[Math.floor(Math.random() * this.description.symbols.length)]);
			}
		}

		return {
			id: 0,
			betLines: 0,
			lineBetValue: 0,
			spinIndex: 0,
			spins: [
				{
					result: result ? result.spins[result.spins.length - 1].result : pattern,
					winValue: 0,
					totalWinMultiplier: 1,
					currentTotalWinValue: 0,
				},
			],
			totalBet: 0,
			totalWinValue: 0,
			nextType: result ? result.nextType : null,
			currentType: result ? result.currentType : null,
			complete: false,
			accWin: 0,
			payout: 0,
		};
	}
}
