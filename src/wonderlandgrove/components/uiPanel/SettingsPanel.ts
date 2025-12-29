import { container } from 'tsyringe';
import Panel from '../../../gamma-engine/common/view/ui/Panel';
import ControlEvent from '../../../gamma-engine/core/control/event/ControlEvent';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import { ScreenOrientation } from '../../../gamma-engine/core/view/ScreenOrientation';
import { UIEvent } from '../../../gamma-engine/slots/control/event/UIEvent';
import SlotMachine from '../../../gamma-engine/slots/model/SlotMachine';
import { MeterComponent } from './MeterComponent';
import { ToggleButton } from './ToggleButton';
import { getFromLocalStorage, saveToLocalStorage } from '../../../gamma-engine/common/model/LocalStorageUtils';
import { UpdateLayoutDescription } from '../../../gamma-engine/core/view/UpdateLayoutDescription';
import Button from '../../../gamma-engine/core/view/ui/Button';
import { SlotMachineEvent } from '../../../gamma-engine/slots/model/event/SlotMachineEvent';
import { UIPanelEvent } from '../../../gamma-engine/common/control/event/UIPanelEvent';
import { UIPanelType } from '../../../gamma-engine/common/model/UIState';
import SoundManager from '../../../gamma-engine/core/sound/SoundManager';
import ICommonGameService from '../../../gamma-engine/common/services/ICommonGameService';
import { IDestroyOptions } from 'pixi.js';
import { GameServiceEvent } from '../../services/event/GameServiceEvent';
import SoundList from '../../../gamma-engine/common/sound/SoundList';
import { SettingsType } from '../../../gamma-engine/common/model/SettingsType';

export class SettingsPanel extends Panel {
	protected defaultOrientation: ScreenOrientation;

	protected quickSpinBtn: ToggleButton;

	protected ambientMusicBtn: ToggleButton;

	protected soundFXBtn: ToggleButton;

	protected introScreenBtn: ToggleButton;

	protected lowPowerBtn: ToggleButton;

	protected totalBetPlusBtn: Button;

	protected totalBetMinusBtn: Button;

	protected historyBtn: Button;

	protected totalBetMeter: MeterComponent;

	protected sm: SlotMachine;

	private gs: ICommonGameService;

	constructor(le: LayoutElement, orientation: ScreenOrientation) {
		super(le);

		this.defaultOrientation = orientation;

		this.sm = container.resolve(SlotMachine);
		this.gs = container.resolve<ICommonGameService>('GameService');

		this.assignComponents();
		this.bindButtonsHandler();
		this.addSlotMachineEvents();

		this.on('added', this.onAdded, this);
	}

	public override customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;
		switch (le.customClass) {
			case 'ToggleButton':
				instance = new ToggleButton(le);
				break;
			case 'MeterComponent':
				instance = new MeterComponent(le);
				break;
			default:
				instance = super.customClassElementCreate(le);
		}
		return instance;
	}

	protected onAdded(): void {
		this.setInitialSettings();
		this.off('added', this.onAdded, this);
	}

	protected addSlotMachineEvents(): void {
		this.sm.on(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
		this.gs.on(GameServiceEvent.SETTINGS_CHANGED, this.onSettingsChanged, this);
		this.updateSoundBtnState();
		/* this.sm.on(UIPanelActions.LOCK_UI, this.lock, this);
		this.sm.on(UIPanelActions.UNLOCK_UI, this.unlock, this); */
	}

	public override updateLayout(desc: UpdateLayoutDescription) {
		super.updateLayout(desc);

		if (this.defaultOrientation === ScreenOrientation.VERTICAL) {
			// To keep panel at the bottom
			if (desc.baseHeight < desc.currentHeight) {
				this.y = desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2;
			} else {
				this.y = desc.baseHeight;
			}
		}

		this.setInitialSettings();
	}

	protected setInitialSettings(): void {
		//Settings
		this.quickSpinBtn.setStateView(this.sm.currentGameSpeedLevel === 1);
		this.updateSoundBtnState();
		this.introScreenBtn.setStateView(getFromLocalStorage('settings')?.showIntro ?? false);
		this.lowPowerBtn.setStateView(getFromLocalStorage('settings')?.batterySaver??false);        // console.log('initial after',this.lowPowerBtn.getIsStateOn());
		
		//Bet Settings - Total Bet
		this.totalBetMeter.setCurrencyFormattedValueWithoutDecimals(this.sm.totalBet, false, false, true);
		
		this.off('added', this.setInitialSettings);
	}

	protected assignComponents(): void {
		//Settings
		this.quickSpinBtn = this['settingsContainer']['quickSpinContainer']['quickSpinBtn'];
		this.ambientMusicBtn = this['settingsContainer']['ambientMusicContainer']['ambientMusicBtn'];
		this.soundFXBtn = this['settingsContainer']['soundFxContainer']['soundFxBtn'];
		this.introScreenBtn = this['settingsContainer']['introScreenContainer']['introScreenBtn'];
		this.lowPowerBtn = this['settingsContainer']['lowPowerContainer']['lowPowerBtn'];

		//Bet Settings - Total Bet
		this.totalBetPlusBtn = this['betSettingsContainer']['totalBetContainer']['totalBetPlus'];
		this.totalBetMinusBtn = this['betSettingsContainer']['totalBetContainer']['totalBetMinus'];
		this.totalBetMeter = this['betSettingsContainer']['totalBetContainer']['totalBetMeter'];
	}

	protected bindButtonsHandler(): void {
		//Settings
		this.quickSpinBtn.on(ToggleButton.STATE_CHANGED, this.onQuickSpinHandler, this);
		this.soundFXBtn.on(ToggleButton.STATE_CHANGED, this.onSoundFxHandler, this);
		this.ambientMusicBtn.on(ToggleButton.STATE_CHANGED, this.onAmbientMusicHandler, this);
		this.introScreenBtn.on(ToggleButton.STATE_CHANGED, this.onIntroScreenHandler, this);
		this.lowPowerBtn.on(ToggleButton.STATE_CHANGED, this.onBatterySaverHandler, this);
		//Bet Settings - Total Bet
		this.totalBetPlusBtn.on('pointerup', this.onBtnBetUp, this);
		this.totalBetMinusBtn.on('pointerup', this.onBtnBetDown, this);

		this.historyBtn.on('pointerup', this.onHistoryHandler, this);
	}

	protected onMuteStateChanged(): void {
		this.soundFXBtn.changeState(getFromLocalStorage('settings')?.soundFx ?? true);
		this.ambientMusicBtn.changeState(getFromLocalStorage('settings')?.ambientMusic ?? true);
	}

	protected onQuickSpinHandler(): void {
		SoundManager.play(SoundList.UI_BUTTON_CLICK);
		if (this.quickSpinBtn.getIsStateOn()) {
			const setting: SettingsType = this.gs.settings
			setting.quickSpin = true;
			saveToLocalStorage('settings', setting);
			new ControlEvent(UIEvent.GAME_SPEED_LEVEL_UP).dispatch();
		} else {
			const setting: SettingsType = this.gs.settings
			setting.quickSpin = false;
			saveToLocalStorage('settings', setting);
			new ControlEvent(UIEvent.GAME_SPEED_LEVEL_DOWN).dispatch();
		}
	}

	protected onBtnBetUp(): void {
		SoundManager.play(SoundList.UI_BUTTON_CLICK);
		new ControlEvent(UIEvent.BET_UP).dispatch();
	}

	protected onBtnBetDown(): void {
		SoundManager.play(SoundList.UI_BUTTON_CLICK);
		new ControlEvent(UIEvent.BET_DOWN).dispatch();
	}

	protected onBetValueChanged(): void {
		this.totalBetMeter.setCurrencyFormattedValueWithoutDecimals(this.sm.totalBet, true, false, true);
		this.observeAndUpdateBetBtnState();
	}

	private observeAndUpdateBetBtnState(): void {
		this.totalBetPlusBtn.enabled = false;
		this.totalBetMinusBtn.enabled = false;
		const betLimits: number[] = this.sm.description.betLimits;
		if (betLimits.indexOf(this.sm.currentBetValue) < betLimits.length - 1) {
			this.totalBetPlusBtn.enabled = true;
		}
		if (betLimits.indexOf(this.sm.currentBetValue) > 0) {
			this.totalBetMinusBtn.enabled = true;
		}
	}

	protected onSoundFxHandler(): void {
		this.gs.settings.soundFx = this.soundFXBtn.getIsStateOn();
		if (!this.ambientMusicBtn.getIsStateOn()) {
			this.gs.saveSettings();
		}
		if (this.soundFXBtn.getIsStateOn()) {
			this.gs.saveSettings();
		}
		const setting: SettingsType = getFromLocalStorage('settings')??this.gs.settings;
		setting.soundFx = this.soundFXBtn.getIsStateOn();
		saveToLocalStorage('settings', setting);

		SoundManager.getChannel('default').mute = !this.gs.settings.soundFx;
	}

	protected onAmbientMusicHandler(): void {
		this.gs.settings.ambientMusic = this.ambientMusicBtn.getIsStateOn();
		if (!this.soundFXBtn.getIsStateOn()) {
			this.gs.saveSettings();
		}
		if (this.ambientMusicBtn.getIsStateOn()) {
			this.gs.saveSettings();
		}
		const setting: SettingsType = getFromLocalStorage('settings')??this.gs.settings;
		setting.ambientMusic = this.ambientMusicBtn.getIsStateOn();
		saveToLocalStorage('settings', setting);

		SoundManager.getChannel('ambient').mute = !this.gs.settings.ambientMusic;
	}

	protected onSettingsChanged(): void {
		this.updateSoundBtnState();
	}

	protected updateSoundBtnState(): void {
		this.soundFXBtn.setStateView(this.gs.settings.soundFx);
		this.ambientMusicBtn.setStateView(this.gs.settings.ambientMusic);
	}

	protected onIntroScreenHandler(): void {
		this.gs.saveSettings();
		//SoundManagerEnhanced.play(SoundListExtended.TOGGLE_CLICK);
		const setting: SettingsType = getFromLocalStorage('settings')??this.gs.settings;
		setting.showIntro = this.introScreenBtn.getIsStateOn();
		saveToLocalStorage('settings', setting);
	}
	protected onBatterySaverHandler(): void {
		const setting: SettingsType = this.gs.settings
		if (this.lowPowerBtn.getIsStateOn()) {
			setting.batterySaver = true;
			this.lowPowerBtn.setStateView(this.gs.settings.batterySaver);
		} else {
			setting.batterySaver = false;
			this.lowPowerBtn.setStateView(this.gs.settings.batterySaver);
		}
		saveToLocalStorage('settings', setting);
	}

	protected onHistoryHandler(): void {
		new ControlEvent(UIPanelEvent.CLOSE_PANEL).dispatch();
		//SoundManagerEnhanced.play(SoundListExtended.UI_CLICK);
		new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.HISTORY).dispatch();
	}

	public override destroy(options?: IDestroyOptions | boolean): void {
		this.sm.off(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
		this.gs.off(GameServiceEvent.SETTINGS_CHANGED, this.onSettingsChanged, this);
		super.destroy(options);
	}

	/* public override hidden(): void {
		super.hidden();
		this.sm.off(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
		this.sm.off(UIPanelActions.LOCK_UI, this.lock, this);
		this.sm.off(UIPanelActions.UNLOCK_UI, this.unlock, this);
	} */

	/* 	public lock(): void {
		this.lineBetPlusBtn.enabled = false;
		this.lineBetMinusBtn.enabled = false;
		this.totalBetPlusBtn.enabled = false;
		this.totalBetMinusBtn.enabled = false;
		this.maxBetBtn.enabled = false;
		this.historyBtn.enabled = false;
	}

	public unlock(): void {
		if (this.sm.roundResult.currentType === GameModeTypes.BaseGame) {
			this.lineBetPlusBtn.enabled = true;
			this.lineBetMinusBtn.enabled = true;
			this.totalBetPlusBtn.enabled = true;
			this.totalBetMinusBtn.enabled = true;
			this.maxBetBtn.enabled = true;
			this.historyBtn.enabled = true;
		}
	} */
}
