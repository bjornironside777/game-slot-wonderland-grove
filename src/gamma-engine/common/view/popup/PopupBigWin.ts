import {Slot, Spine, TrackEntry} from '@esotericsoftware/spine-pixi';
import {BitmapText, Container, Text} from 'pixi.js';
import {container} from 'tsyringe';
import AssetsManager from '../../../core/assets/AssetsManager';
import Sound from '../../../core/sound/Sound';
import SoundManager from '../../../core/sound/SoundManager';
import {Tweener} from '../../../core/tweener/engineTween';
import Wallet from '../../../slots/model/Wallet';
import SoundList from '../../sound/SoundList';

export default class PopupBigWin extends Container {
	public static SHOWING: boolean = false;

	private levelAnimationNames: string[] = ['big', 'mega', 'super', 'grand'];

	private animations: Spine[];

	private levelAnimationDurations: number[] = [1, 1, 1, 1];

	readonly level: number | (() => number);

	private winValue: number | (() => number);

	private _value: number;

	// VISUALS
	public animation: Spine;

	public tfAmount: Text | BitmapText;

	private loopedSound: Sound;

	constructor(level: number | (() => number), winValue: number | (() => number), amountText: Text | BitmapText, scale?: number) {
		super();

		// DisplayShortcuts.init();
		this.winValue = winValue;
		this.on('added', this.onAdded, this);
		this.level = level;
		const asset = AssetsManager.spine.get('celebration_wins') ?? this.levelAnimationNames.map((name) => AssetsManager.spine.get(`${name }_win`));

		this.animations = asset instanceof Array ? asset.map((data) => Spine.from(data.skeletonUrl, data.atlasUrl)) : [Spine.from(asset.skeletonUrl, asset.atlasUrl)];

		this.tfAmount = new Text(amountText.text, {
            fontFamily: AssetsManager.webFonts.get("NewRocker").family,
            fontSize:80,
			fill:["#FFF4B0", "#FCE154", "#E85E07"],
			stroke: "#590D0D",
			strokeThickness: 3,
        })
		this.tfAmount.anchor.set(0.5, 2.2);
		this.tfAmount.scale.y = -1;
		if (scale) this.animations.forEach((animation) => animation.scale.set(scale));

		this.on('removed', this.onRemoved, this);
	}

	// PUBLIC API
	public get value(): number {
		return this._value;
	}

	public set value(value: number) {
		this._value = value;

		this.tfAmount.text = Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(value));
	}

	private get levelValue() {
		return this.level instanceof Function ? this.level() : this.level;
	}

	private onAdded(): void {
		if (this.levelValue == -1) {
			throw new Error('Big win level not set');
		}

		this.removeChild(this.animation);
		this.animation = this.animations[this.levelValue] ?? this.animations[0];
		this.addChild(this.animation);
		const counterContainer: Slot = this.animation.skeleton.findSlot('counter');
		counterContainer.setAttachment(null);
		this.animation.addSlotObject(counterContainer, this.tfAmount);
		const levelAnimationName: string = this.levelAnimationNames[this.levelValue];
		const levelAnimationDuration: number = this.levelAnimationDurations[this.levelValue];

		// spec says 5 secs animating, so we put 4 + 1 in + 1 out
		const numLoopAnimations: number = Math.ceil(5 / levelAnimationDuration);

		this.animation.state.setEmptyAnimations(0);
		const countUpDuration: number = 4;
		this.animation.state.addListener({
			start: (entry: TrackEntry) => {
				if (entry.animation.name.includes('_win_in')) {
					counterContainer.color.a = 0;
					Tweener.addTween(counterContainer.color, {
						a: 1,
						time: 0.3,
						transition: 'easeOutQuad',
						delay: 0.3,
					});

					counterContainer.bone.scaleX = 0.3;
					counterContainer.bone.scaleY = -0.3;
					Tweener.addTween(counterContainer.bone, {
						scaleX: 1,
						scaleY: -6,
						time: countUpDuration / 8,
						transition: 'easeOutBack',
						delay: 0.3,
					});
				} else if (entry.animation.name.includes('_win_out')) {
					Tweener.addTween(counterContainer.color, {
						a: 0,
						time: 0.5,
						transition: 'easeInQuad',
					});
				}
			},
		});

		this.value = 0;
		Tweener.addTween(this, {
			value: this.winValue instanceof Function ? this.winValue() : this.winValue,
			time: countUpDuration,
			transition: 'easeInOutQuad',
			onStart: () => {
				this.loopedSound = SoundManager.loop({
					id: SoundList.COUNTER_LOOP,
					volume: 0.25,
				});
			},
			onComplete: () => {
				this.loopedSound.stop();
				SoundManager.play({
					id: SoundList.COUNTER_END,
					volume: 0.4,
				});
			},
		});

		this.animation.state.data.setMix(`${levelAnimationName}_win_in`, `${levelAnimationName}_win_loop`, 0.7);
		this.animation.state.setAnimation(0, `${levelAnimationName}_win_in`, false);
		for (let i = 0; i < numLoopAnimations; i++) {
			this.animation.state.addAnimation(0, `${levelAnimationName}_win_loop`, false, 0);
		}
		this.animation.state.addAnimation(0, `${levelAnimationName}_win_out`, false, 0);
	}

	private onRemoved(): void {
		if (this.loopedSound) this.loopedSound.stop();
		Tweener.removeTweens(this);
		const counterContainer: Slot = this.animation.skeleton.findSlot('counter');
		Tweener.removeTweens(counterContainer.bone);
		Tweener.removeTweens(counterContainer.color);
		this.animations.forEach((animation) => {
			animation.state.setEmptyAnimations(0);
			animation.state.clearListeners();
			animation['lastTime'] = null;
		});
	}

	public hideWithDelay(): void {
		Tweener.removeTweens(this);
		this.value = this.winValue instanceof Function ? this.winValue() : this.winValue;
	}

	public show(): void {
		PopupBigWin.SHOWING = true;
	}

	public hide(): void {
		PopupBigWin.SHOWING = false;
	}
}
