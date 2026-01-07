import {Container, Text} from 'pixi.js';
import {AutospinOption} from '../../../gamma-engine/common/model/AutospinOption';
import {CheckBoxOption} from '../../../gamma-engine/common/view/ui/CheckBoxOption';
import Panel from '../../../gamma-engine/common/view/ui/Panel';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import {UpdateLayoutDescription} from '../../../gamma-engine/core/view/UpdateLayoutDescription';
import {AutoplaySettings} from '../../../gamma-engine/slots/model/Autoplay';
import ControlEvent from '../../../gamma-engine/core/control/event/ControlEvent';
import {UIEvent} from '../../../gamma-engine/slots/control/event/UIEvent';
import {UIPanelEvent} from '../../../gamma-engine/common/control/event/UIPanelEvent';
import {ScreenOrientation} from '../../../gamma-engine/core/view/ScreenOrientation';
import {ToggleButton} from './ToggleButton';
import {AutoplaySlider} from './AutoplaySlider';
import {NumericInputComponent} from '../generic/NumericInputComponent';
import Button from '../../../gamma-engine/core/view/ui/Button';
import { container } from 'tsyringe';
import SlotMachine from '../../../gamma-engine/slots/model/SlotMachine';
import AssetsManager from '../../../gamma-engine/core/assets/AssetsManager';
import SwitchView from '../../../gamma-engine/common/view/ui/SwitchView';
import GameService from '../../services/GameService';

export class AutoplayPanel extends Panel {
	protected checkboxes: Map<AutospinOption, CheckBoxOption> = new Map<AutospinOption, CheckBoxOption>();

	protected spinCountSlider: AutoplaySlider;

	protected defaultOrientation: ScreenOrientation;

	protected basicSettings: Container;

	protected advancedSettings: Container;

	protected autoplayCountMeter: Text;

	protected bonusWonBtn: ToggleButton;

	protected anyWinBtn: ToggleButton;

	protected turboBtn: ToggleButton;

	protected singleWinMtr: NumericInputComponent;

	protected cashBalanceIncreaseMtr: NumericInputComponent;

	protected cashBalanceDecreaseMtr: NumericInputComponent;

	
	private gs: GameService;

	public skipScreenSwitch: SwitchView;

	protected btnConfirm: Button;
	
	protected btnConfirmText: Text;
	
	public skipBtn: ToggleButton;

	constructor(le: LayoutElement) {
		super(le);

		this.spinCountSlider = this['basicSettings']['spinCountContainer']['spinCountSlider'];
		this.autoplayCountMeter = this['basicSettings']['spinCountContainer']['autoplayCountMeter'];
		this.bonusWonBtn = this['advancedSettings']['bonusWonContainer']['bonusWonBtn'];
		this.anyWinBtn = this['advancedSettings']['anyWinContainer']['anyWinBtn'];
		this.singleWinMtr = this['advancedSettings']['singleWinContainer']['singleWinMeter'];
		this.cashBalanceIncreaseMtr = this['advancedSettings']['cashBalanceIncrease']['cashBalanceIncreaseMtr'];
		this.cashBalanceDecreaseMtr = this['advancedSettings']['cashBalanceDecrease']['cashBalanceDecreaseMtr'];
		this.turboBtn = this['basicSettings']['spinContainer']['spinBtn'];
		this.skipBtn = this['basicSettings']['skipScreenContainer']['skipScreenBtn'];
		
		this.btnConfirmText = this['btnConfirm']['normal']['tfText']
		
  		this.gs = container.resolve('GameService');
		
		this.skipScreenSwitchChange();

		this.spinCountSlider.on('update', this.onAutoplayCountUpdated, this);
		const sm = container.resolve(SlotMachine);
		this.turboBtn.setStateView(sm.currentGameSpeedLevel === 1);
		this.skipBtn.on(ToggleButton.STATE_CHANGED,this.skipScreenSwitchChange,this)
		this.turboBtn.on(ToggleButton.STATE_CHANGED, this.onTurboBtnHandler, this);
		this.btnConfirm.on('pointerup', this.onBtnConfirm, this);

		this.onAutoplayCountUpdated();
	}

	protected onTurboBtnHandler(): void {
		if (this.turboBtn.getIsStateOn()) {
			new ControlEvent(UIEvent.GAME_SPEED_LEVEL_UP).dispatch();
		} else {
			new ControlEvent(UIEvent.GAME_SPEED_LEVEL_DOWN).dispatch();
		}
	}

	protected skipScreenSwitchChange():void{
		if(this.skipBtn.getIsStateOn()){
			this.skipBtn.setStateView(true)
			this.gs.settings.skipBigWin = false;
		}else{
			this.skipBtn.setStateView(false)
			this.gs.settings.skipBigWin = true;
		}		
		this.gs.saveSettings();
}

	public override customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;
		switch (le.customClass) {
			case 'ToggleButton':
				instance = new ToggleButton(le);
				break;
			case 'AutoplaySlider':
				instance = new AutoplaySlider(le);
				break;
			case 'NumericInputComponent':
				instance = new NumericInputComponent(le);
				break;
			default:
				instance = super.customClassElementCreate(le);
		}
		return instance;
	}

	protected onAutoplayCountUpdated(): void {
		this.autoplayCountMeter.text = this.spinCountSlider.getAutoplayCount();
		this.btnConfirmText.text = `${AssetsManager.translations.get('autoSpin.tfConfirm')} (${this.autoplayCountMeter.text})`
	}

	public override updateLayout(desc: UpdateLayoutDescription) {
		super.updateLayout(desc);
	}

	private get settings(): AutoplaySettings {
		const data: AutoplaySettings = {
			spinsLeft: this.spinCountSlider.getAutoplayCount(),
		};

		data.onAnyWin = this.anyWinBtn.getIsStateOn();
		data.onBonusGameWon = this.bonusWonBtn.getIsStateOn();
		data.turbo = this.turboBtn.getIsStateOn();

		data.onSingleWinExceed = this.singleWinMtr.getNumericValue() > 0 ? this.singleWinMtr.getNumericValue() : undefined;
		data.onCashBalanceIncreaseBy = this.cashBalanceIncreaseMtr.getNumericValue() > 0 ? this.cashBalanceIncreaseMtr.getNumericValue() : undefined;
		data.onCashBalanceDecreaseBy = this.cashBalanceDecreaseMtr.getNumericValue() > 0 ? this.cashBalanceDecreaseMtr.getNumericValue() : undefined;

		return data;
	}

	private onBtnConfirm(): void {
		new ControlEvent(UIPanelEvent.CLOSE_PANEL).dispatch();
		new ControlEvent(UIEvent.AUTO_SPIN, this.settings).dispatch();
	}
}
