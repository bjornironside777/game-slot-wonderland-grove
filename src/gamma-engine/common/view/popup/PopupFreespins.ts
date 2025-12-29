import { BitmapText, Container, Text } from 'pixi.js';
import { container } from 'tsyringe';
import AssetsManager from '../../../core/assets/AssetsManager';
import Sound from '../../../core/sound/Sound';
import SoundManager from '../../../core/sound/SoundManager';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import LayoutElement from '../../../core/view/model/LayoutElement';
import Wallet from '../../../slots/model/Wallet';
import SoundList from '../../sound/SoundList';
import { Tweener } from '../../../core/tweener/engineTween';
import { Slot, Spine, TrackEntry } from '@esotericsoftware/spine-pixi';
import { autoscaleText } from '../../../core/utils/TextUtils';
import { SlotMachineEvent } from '../../../slots/model/event/SlotMachineEvent';
import SlotMachine from '../../../slots/model/SlotMachine';

export default class PopupFreespins extends Container {
	public static SHOWING: boolean = false;

	private freespinCountSlot: Slot;

	private type: () => PopupFreespinsType;

	private _value: number;

	private winValue: number;

	// VISUALS
	public animation: Spine;

	public tfAmount: Text;

	public tfCounter: Text | BitmapText;

	private loopedSound: Sound;

	private youHaveWon: Text;

	private freespinCountSlot2: Slot;

	private freespinText: Text;


	constructor(private lang: string, amount: number | (() => number), type: () => PopupFreespinsType, freespinCount?: number, scale?: number) {
		super();
		LayoutBuilder.create(AssetsManager.layouts.get('PopupFreespins'), this, (le: LayoutElement) => {
			return this.customClassElementCreate(le);
		});
		this.type = type;
		this.tfAmount.text = (amount instanceof Function ? amount() : amount).toString();
		this.winValue = amount instanceof Function ? amount() : amount;

		const sm = container.resolve(SlotMachine);

		const youHaveWonSlot = this.animation.skeleton.findSlot('YOU HAVE WON');
		youHaveWonSlot?.setAttachment(null);

		if (sm.currentSpinResult.freespins.remainingCount < sm.currentSpinResult.freespins.totalCount) {
			this["introContainer"]["youHaveWon"].text = AssetsManager.translations.get("freeSpins.youHaveLeft")

		} else {
			this["introContainer"]["youHaveWon"].text = AssetsManager.translations.get("freeSpins.youHaveWon")

		}

		const pressAnywhareSlot = this.animation.skeleton.findSlot('PRESS ANYWHERE TO CONTINUE');
		pressAnywhareSlot?.setAttachment(null);

		this.freespinCountSlot = this.animation.skeleton.findSlot('FREESPINS');
		this.freespinCountSlot?.setAttachment(null);

		if (this.type() == 'end') {
			const wallet: Wallet = container.resolve(Wallet);
			this.tfAmount.text = wallet.getCurrencyValue(this.winValue, true);

			this["outroContainer"]["inFreespins"].text = `${AssetsManager.translations.get('bonusSpins.in')} ${freespinCount} ${AssetsManager.translations.get('freeSpins.freeSpinEnd')}`;

			this["introContainer"].visible = false;
			this["outroContainer"].visible = true;

			if (AssetsManager.translations.get("bonusSpins.in") === "") {
				this["outroContainer"]["youHaveWon"].y = 110;
				this["outroContainer"]["inFreespins"].y = -100;
			}

		} else {
			this["introContainer"].visible = true;
			this["outroContainer"].visible = false;
		}

		if (this.freespinCountSlot2) {
			this.animation.addSlotObject(this.freespinCountSlot2, this.freespinText);
		}

		autoscaleText(this.tfAmount, 130, 450, 130);

		if (scale) this.animation.scale.set(scale);

		this.on('added', this.onAdded, this);
		this.on('removed', this.onRemoved, this);
	}

	// PRIVATE API
	private customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			case 'FreespinsAnimation':
				const asset = AssetsManager.spine.get('freespins_popup');
				instance = Spine.from(asset.skeletonUrl, asset.atlasUrl);
				break;
		}

		return instance;
	}

	public get value(): number {
		return this._value;
	}

	public set value(value: number) {
		this._value = value;
		const wallet: Wallet = container.resolve(Wallet);
		if (this.tfCounter != undefined) {
			this.tfCounter.text = wallet.getCurrencyValue(value, false);
		}
	}

	private onAdded(): void {
		const type = this.type();
        this.animation.state.setAnimation(0, `${animationNames[this.lang].in}`, false);
		Tweener.addCaller(this, {
			count: 1,
			time: 0.2,
			onComplete: () => {
                this.animation.state.setAnimation(0, `${animationNames[this.lang].loop}`, true);
			},
		});
	}

	private onRemoved(): void {
		if (this.loopedSound) this.loopedSound.stop();

		Tweener.removeTweens(this);
		if (this.freespinCountSlot) {
			Tweener.removeTweens(this.freespinCountSlot.color);
			Tweener.removeTweens(this.freespinCountSlot.bone);
		}

		this.animation.state.setEmptyAnimations(0);
		this.animation.state.clearListeners();
		this.animation['lastTime'] = null;
	}

	public show(): void {
		PopupFreespins.SHOWING = true;
	}

	public hide(): void {
		PopupFreespins.SHOWING = false;
	}
}

export enum PopupFreespinsType {
	START = 'start',
	END = 'end',
}
const animationNames = {
    "EN": {
    in: 'in',
    loop: 'loop',
    out: 'out',
    },
    "TR": {
    in: 'in_turkish',
    loop: 'loop_turkish',
    out: 'out_turkish',
    },
};
