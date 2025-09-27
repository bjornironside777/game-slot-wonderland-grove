import {AnimatedSprite, Graphics, Sprite} from 'pixi.js';
import AssetsManager from '../../core/assets/AssetsManager';
import { Tweener } from '../../core/tweener/engineTween';
import LayoutBuilder from '../../core/utils/LayoutBuilder';
import AdjustableLayoutContainer from '../../core/view/AdjustableLayoutContainer';
import LayoutElement from '../../core/view/model/LayoutElement';
import { UpdateLayoutDescription } from '../../core/view/UpdateLayoutDescription';
import { MaxFitContainerComponent } from '../../../wonderlandgrove/components/generic/MaxFitContainerComponent';


export class LoadingScreen extends AdjustableLayoutContainer {
	// VIEWS
	public loadingLogo: AnimatedSprite;

	public barMask: Sprite;

	private progressMask: Graphics;

	private poweredByMask: Graphics;

	private poweredByShown: boolean = false;

	constructor() {
		super(AssetsManager.layouts.get('loading-screen'));

		LayoutBuilder.create(this.layout, this, (le: LayoutElement) => {
			return this.customClassElementCreate(le);
		});

		this.progressMask = this['darphaLogoContainer']['mask'];

		this.poweredByMask = this['poweredByContainer']['mask'];

		
	}

	private customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			case 'MaxFitContainerComponent':
				instance = new MaxFitContainerComponent(le, 1920, 1080);
				break;
		}
		return instance;
	}

	public setProgress(progress: number): void {
		this.progressMask.x = 30 + (620 / 100) * progress;

		if(progress > 50 && !this.poweredByShown) {
			Tweener.addTween(this.poweredByMask, {
				x: 0,
				transition: 'easeoutsine',
				time: 0.5
			});
			this.poweredByShown = true
		}
	}

	public updateLayout(desc: UpdateLayoutDescription) {
		super.updateLayout(desc);
	}
}
