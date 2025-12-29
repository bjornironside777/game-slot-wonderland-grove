import AssetsManager from '../../gamma-engine/core/assets/AssetsManager';
import { Spine, TrackEntry } from '@esotericsoftware/spine-pixi';
import {Container} from 'pixi.js';


export class GameTransitionAnimation extends Container {
    private lastAlpha: number = 0;
    private spine: Spine;

    
    private animationChances: {
        animation: string,
        chance: number
    }[] = [
        {
            animation: 'idle',
            chance: 100,
        }
    ];


    constructor() {
        
        super();
        const asset = AssetsManager.spine.get('transition_animation');
        this.spine = Spine.from(asset.skeletonUrl, asset.atlasUrl);

        this.addChild(this.spine);
        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
        this.alpha = 0;
    }

    private onAdded(): void {
        this.alpha = this.lastAlpha;
    }

    private onRemoved(): void {
        this.lastAlpha = this.alpha;
    }

    public setTransition(transitionName: string): Promise<void> {
        this.spine.state.setEmptyAnimations(0);
        this['lastTime'] = null;
        return new Promise((resolve) => {
            this.spine.state.setAnimation(0, transitionName, false);
            this.alpha = 1;
            this.spine.state.addListener({
                complete: (entry: TrackEntry) => {
                    if (entry.animation.name === transitionName) {
                        resolve();
                        this.alpha = 0;
                    }
                }
            });
        });
    }
}