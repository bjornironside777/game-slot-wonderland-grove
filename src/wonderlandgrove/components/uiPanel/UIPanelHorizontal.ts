import {BlurFilter, Circle, Matrix, Sprite, Texture} from 'pixi.js';
import AssetsManager from '../../../gamma-engine/core/assets/AssetsManager';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import Button from '../../../gamma-engine/core/view/ui/Button';
import SlotMachine from '../../../gamma-engine/slots/model/SlotMachine';
import {SlotMachineState} from '../../../gamma-engine/slots/model/SlotMachineState';
import {container} from 'tsyringe';
import ControlEvent from '../../../gamma-engine/core/control/event/ControlEvent';
import {SlotGameEvent} from '../../../gamma-engine/slots/control/event/SlotGameEvent';
import Wallet from '../../../gamma-engine/slots/model/Wallet';
import {WalletEvent} from '../../../gamma-engine/slots/model/event/WalletEvent';
import {UIPanelEvent} from '../../../gamma-engine/common/control/event/UIPanelEvent';
import UIState, {UIPanelType} from '../../../gamma-engine/common/model/UIState';
import {UIEvent} from '../../../gamma-engine/slots/control/event/UIEvent';
import ValueText from '../../../gamma-engine/core/view/text/ValueText';
import PopupState, {PopupType} from '../../../gamma-engine/common/model/PopupState';
import ButtonSpin from '../../../gamma-engine/common/view/ButtonSpin';
import {BottomLayoutContainerComponent} from '../generic/BottomLayoutContainerComponent';
import {ToggleButton} from './ToggleButton';
import {SpinStopButton} from './SpinStopButton';
import SoundManager from '../../../gamma-engine/core/sound/SoundManager';
import SoundList from '../../../gamma-engine/common/sound/SoundList';
import {AutoplayButton} from './AutoplayButton';
import {AutoplayEvent} from '../../../gamma-engine/slots/model/event/AutoplayEvent';
import {SlotMachineEvent} from '../../../gamma-engine/slots/model/event/SlotMachineEvent';
import {MeterComponent} from './MeterComponent';
import ICommonGameService from '../../../gamma-engine/common/services/ICommonGameService';
import {GameServiceEvent} from '../../services/event/GameServiceEvent';
import {BetPanelComponent} from './BetPanelComponent';
import MainGameScreen from '../../view/MainGameScreen';
import {UpdateLayoutDescription} from '../../../gamma-engine/core/view/UpdateLayoutDescription';
import Logger from '../../../gamma-engine/core/utils/Logger';
import GraphicUtils from '../../../gamma-engine/slots/utils/GraphicUtils';
import ButtonSpinAnimation from '../../../gamma-engine/common/view/ButtonSpinAnimation';
import PopupFreespins from '../../../gamma-engine/common/view/popup/PopupFreespins';
import PopupBigWin from '../../../gamma-engine/common/view/popup/PopupBigWin';

export class UIPanelHorizontal extends BottomLayoutContainerComponent {
	protected wallet: Wallet;

	protected slotMachine: SlotMachine;

	protected btnSpin: ButtonSpin;

	protected betPlus: Button;

	protected betMinus: Button;

	protected autoplayBtn: AutoplayButton;

	protected turboBtn: ToggleButton;

	protected winMeter: MeterComponent;

	protected creditMeter: MeterComponent;

	protected betMeter: MeterComponent;

	protected soundBtn: ToggleButton;

	public settingButton: Button;

	public infoButton: Button;

	private gs: ICommonGameService;

	protected mainGameScr: MainGameScreen;

	protected blurBg: Sprite;

	constructor(mainGameScreen: MainGameScreen) {
		super(AssetsManager.layouts.get('uiHorizontal'));

		this.mainGameScr = mainGameScreen;

		this.wallet = container.resolve(Wallet);
		this.slotMachine = container.resolve(SlotMachine);

		this.betMeter = this['betMeterContainer']['betMeter'];
		this.winMeter = this['winMeterContainer']['winMeter'];
		this.creditMeter = this['creditMeterContainer']['creditMeter'];

		this.addButtonHandlers();
		this.addSlotMachineEvents();
		this.addWrapperEvents();
		this.addGenericEvents();
		this.resetForNewSpin();

		document.body.addEventListener('keydown', (e) => this.onSpaceClick(e));
		if(!this.gs.settings.introScreen)
            {
               this.muteonIntro()
            }
	}

	protected override customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			case 'Button':
				instance = new Button(le);
				break;
			case 'ButtonSpin':
				instance = new ButtonSpin(le);
				(instance as Button).hitArea = new Circle(105, 105, 85);
				break;
			case 'ToggleButton':
				instance = new ToggleButton(le);
				break;
			case 'SpinStopButton':
				instance = new SpinStopButton(le);
				break;
			case 'AutoplayButton':
				instance = new AutoplayButton(le);
				break;
			case 'ValueText':
				instance = new ValueText(le);
				break;
			case 'MeterComponent':
				instance = new MeterComponent(le);
				break;
		}

		return instance;
	}

	protected addButtonHandlers(): void {
		this.betPlus.on('pointerup', this.onBtnBetUp, this);
		this.betMinus.on('pointerup', this.onBtnBetDown, this);
		this.btnSpin.on('pointerup', this.onBtnSpinHandler, this);
		this.autoplayBtn.on('pointerup', this.onAutoplayHandler, this);
		this.settingButton.on('pointerup', this.onSettingHandler, this);
		this.infoButton.on('pointerup', this.onInfohandler, this);
		this.soundBtn.on(ToggleButton.STATE_CHANGED, this.onSoundBtnHandler, this);
		this.turboBtn.on(ToggleButton.STATE_CHANGED, this.onQuickSpinHandler, this);
	}

	protected addSlotMachineEvents(): void {
		this.slotMachine.autoplay.on(AutoplayEvent.DISABLED, this.onAutospinDisabled, this);
		this.slotMachine.autoplay.on(AutoplayEvent.SPINS_LEFT_CHANGED, this.onAutospinSpinsLeftChange, this);
		this.onAutospinSpinsLeftChange();

		this.slotMachine.on(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
		this.onBetValueChanged();

		this.slotMachine.on(SlotMachineEvent.GAME_SPEED_LEVEL_CHANGED, this.onGameSpeedChanged, this);
	}

	protected addGenericEvents(): void {
		this.gs = container.resolve<ICommonGameService>('GameService');
		this.gs.on(
			GameServiceEvent.SETTINGS_CHANGED,
			() => {
				this.onSettingsChanged();
			},
			this,
		);
		this.updateSoundBtnState();
		this.onGameSpeedChanged();
	}

	protected addWrapperEvents(): void {
		this.wallet.on(
			WalletEvent.NOT_ENOUGH_BALANCE,
			() => {
				this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.STOP);
			},
			this,
		);

		this.wallet.on(WalletEvent.BALANCE_CHANGED, this.onWalletBalanceChanged, this);
		this.onWalletBalanceChanged();

		this.wallet.on(WalletEvent.COIN_VALUE_CHANGED, this.onBetValueChanged, this);
	}

	protected onBtnSpinHandler(): void {
		if (this.slotMachine.currentState !== SlotMachineState.IDLE && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME_ROUND_START) {
			if (this.slotMachine.stopRequested) return;
			SoundManager.play(SoundList.UI_BUTTON_SPIN_STOP);
			this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.SPIN);
			new ControlEvent(SlotGameEvent.STOP_REQUESTED).dispatch();
			if (!this.slotMachine.autoplay.enabled) {
				this.btnSpin.enabled = false;
			}
		} else {
			SoundManager.play({
				id: SoundList.UI_BUTTON_SPIN_START,
				volume: 0.3,
			});

			this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.SPIN, false, true, false);
			new ControlEvent(SlotGameEvent.SPIN_START).dispatch();
			this.btnSpin.enabled = true;
		}
	}

	protected onBtnBetUp(): void {
		SoundManager.play(SoundList.UI_BUTTON_CLICK);
		new ControlEvent(UIEvent.BET_QUANTITY_UP).dispatch();
		//this.slotMachine.emit('ShowBetPanel');
	}

	private onBtnBetDown(): void {
		SoundManager.play(SoundList.UI_BUTTON_CLICK);
		new ControlEvent(UIEvent.BET_QUANTITY_DOWN).dispatch();
		//this.slotMachine.emit('ShowBetPanel');
	}

	private onBetValueChanged(): void {
		this.betMeter.setCurrencyFormattedValueWithoutDecimals(this.slotMachine.totalBet, true, false, true);
		this.observeAndUpdateBetBtnState();
	}

	protected onAutoplayHandler(): void {
		if (this.slotMachine.autoplay.enabled) {
			new ControlEvent(UIEvent.AUTO_SPIN).dispatch();
		} else {
			new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.AUTOSPIN_SETTINGS).dispatch();
		}
	}

	protected onSettingHandler(): void {
		new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.SYSTEM_SETTINGS).dispatch();
	}

	protected onInfohandler(): void {
		new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.PAYTABLE).dispatch();
	}

	protected onAutospinDisabled(): void {
		if (this.slotMachine.currentState !== SlotMachineState.IDLE) {
			this.autoplayBtn.enabled = false;
			SoundManager.play(SoundList.UI_BUTTON_SPIN_STOP);
			this.btnSpin.enabled = false;
			this.btnSpin.off('pointerup', this.onAutoplayHandler, this);
			this.btnSpin.off('pointerup', this.onBtnSpinHandler, this);
			this.btnSpin.on('pointerup', this.onBtnSpinHandler, this);
		}
	}

	protected onAutospinSpinsLeftChange(): void {
		this.autoplayBtn.updateAutoPlayValue(this.slotMachine.autoplay.spinsLeft);
		this.btnSpin.updateAutoplayCount(this.slotMachine.autoplay.spinsLeft);
	}

	protected onQuickSpinHandler(): void {
		SoundManager.play(SoundList.UI_BUTTON_CLICK);
		if (this.turboBtn.getIsStateOn()) {
			new ControlEvent(UIEvent.GAME_SPEED_LEVEL_UP).dispatch();
		} else {
			new ControlEvent(UIEvent.GAME_SPEED_LEVEL_DOWN).dispatch();
		}
		this.slotMachine.emit('HidePopup');
	}

	protected onSettingsChanged(): void {
		this.updateSoundBtnState();
	}

	protected updateSoundBtnState(): void {
		this.soundBtn.setStateView(this.gs.settings.ambientMusic || this.gs.settings.soundFx);
	}
	protected muteonIntro(): void {
		this.gs.settings.ambientMusic = false;
		this.gs.settings.soundFx = false;
		this.gs.saveSettings();

		SoundManager.getChannel('ambient').mute = !this.gs.settings.ambientMusic;
		SoundManager.getChannel('default').mute = !this.gs.settings.soundFx;
	}
	protected onSoundBtnHandler(): void {
		this.gs.settings.ambientMusic = this.soundBtn.getIsStateOn();
		this.gs.settings.soundFx = this.soundBtn.getIsStateOn();
		this.gs.saveSettings();

		SoundManager.getChannel('ambient').mute = !this.gs.settings.ambientMusic;
		SoundManager.getChannel('default').mute = !this.gs.settings.soundFx;
	}

	private onGameSpeedChanged(): void {
		this.turboBtn.changeState(this.slotMachine.currentGameSpeedLevel === 1);
	}

	public setWinValue(value: number, pulsate: boolean = true): void {
		this.winMeter.setCurrencyFormattedValueWithoutDecimals(value, pulsate, false, true);
	}

	public resetForNewSpin(): void {
		this.winMeter.setCurrencyFormattedValueWithoutDecimals(0, false, false, true);
	}

	private onWalletBalanceChanged(): void {
		this.creditMeter.setCurrencyFormattedValueWithoutDecimals(this.wallet.balance, false, false, true);
	}

	private observeAndUpdateBetBtnState(): void {
		this.betPlus.enabled = false;
		this.betMinus.enabled = false;
		const betLimits: number[] = this.slotMachine.description.betLimits;
		if (betLimits.indexOf(this.slotMachine.currentBetValue) < betLimits.length - 1) {
			this.betPlus.enabled = true;
		}
		if (betLimits.indexOf(this.slotMachine.currentBetValue) > 0) {
			this.betMinus.enabled = true;
		}
	}

	public lock(): void {
		[this.betPlus, this.betMinus, this.settingButton, this.infoButton].forEach((btn: Button) => {
			btn.enabled = false;
		});

		if (this.slotMachine.autoplay.enabled) {
			this.btnSpin.autoplayState();
			this.btnSpin.off('pointerup', this.onBtnSpinHandler, this);
			this.btnSpin.off('pointerup', this.onAutoplayHandler, this);
			this.btnSpin.on('pointerup', this.onAutoplayHandler, this);
		} else {
			this.btnSpin.enabled = false;
			this.autoplayBtn.enabled = false;
		}
	}

	public unlock(bonusGameActive: boolean = false): void {
		if (bonusGameActive) {
			this.btnSpin.enabled = true;
			this.soundBtn.enabled = true;
			this.turboBtn.enabled = true;
		} else {
			[this.btnSpin, this.betPlus, this.betMinus, this.settingButton, this.infoButton].forEach((btn: Button) => {
				btn.enabled = true;
			});
			this.soundBtn.enabled = true;
			this.turboBtn.enabled = true;
			this.autoplayBtn.enabled = true;
		}

		if (!this.slotMachine.autoplay.enabled) {
			this.btnSpin.waitAnimation(ButtonSpinAnimation.WAIT_DELAY);
		}
		clearTimeout(this.btnSpin.stopDelay);
		this.onGameSpeedChanged();
		//this.btnSpin.removeTweens();
	}

	public setFreeSpinsUI(): void {
		this.onGameSpeedChanged();
	}

	public setGenericUI(): void {
		this.betPlus.renderable = this.betMinus.renderable = true;
	}

	private onSpaceClick(event: KeyboardEvent) {
		const uiState: UIState = container.resolve(UIState);
		const popupState: PopupState = container.resolve(PopupState);
		if (event.code === 'Space') {
			if (!uiState.activePanel && (!popupState.activePopup || (popupState.activeType !== PopupType.CONNECTION_LOST && popupState.activeType !== PopupType.FEATURE_BUY && popupState.activeType !== PopupType.BONUS_GAME_INTRO)) && !this.slotMachine.autoplay.enabled && !BetPanelComponent.OPENED && !PopupFreespins.SHOWING && !PopupBigWin.SHOWING) {
				this.onBtnSpinHandler();
				if (this.slotMachine.stopRequested) {
					this.turboBtn.setStateView(true);
				}
			}
		}
	}

	public override updateLayout(desc: UpdateLayoutDescription): void {
		super.updateLayout(desc);
		this.updateBlurBg(desc);
	}

	protected updateBlurBg(desc: UpdateLayoutDescription): void {
		const blurFilter: BlurFilter = new BlurFilter();
		blurFilter.blur = 20;
		blurFilter.quality = 10;

		const matrix = new Matrix();
		matrix.translate((desc.currentWidth - desc.baseWidth) / 2, -(desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2 - 146));

		this.blurBg && this.blurBg.destroy(true);
		this.visible = false;
		const texture: Texture = GraphicUtils.generateFilteredTextureFromContainer(this.mainGameScr, desc.currentWidth, 146, matrix, [blurFilter]);
		this.blurBg = new Sprite(texture);

		this.addChildAt(this.blurBg, 0);

		this.blurBg.x = -(desc.currentWidth - desc.baseWidth) / 2;
		this.blurBg.y = -146;

		this.visible = true;
	}
}
