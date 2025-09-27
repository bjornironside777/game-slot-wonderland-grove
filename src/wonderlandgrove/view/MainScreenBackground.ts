import {Container, DisplayObject, Sprite} from 'pixi.js';
import SoundList from '../../gamma-engine/common/sound/SoundList';
import AssetsManager from '../../gamma-engine/core/assets/AssetsManager';
import Sound from '../../gamma-engine/core/sound/Sound';
import SoundManager from '../../gamma-engine/core/sound/SoundManager';
import {Tweener} from '../../gamma-engine/core/tweener/engineTween';
import IAdjustableLayout from '../../gamma-engine/core/view/IAdjustableLayout';
import {ScreenOrientation} from '../../gamma-engine/core/view/ScreenOrientation';
import {UpdateLayoutDescription} from '../../gamma-engine/core/view/UpdateLayoutDescription';
import SoundListExtended from '../sound/SoundListExtended';
import MainGameScreen from './MainGameScreen';
import {Spine} from '@esotericsoftware/spine-pixi';
import NoSleep from 'nosleep.js';
import { getFromLocalStorage } from '../model/LocalStorageUtils';

export default class MainScreenBackground extends Container implements IAdjustableLayout {
    private static DEFAULT_BACKGROUND_CHANNEL: string = 'ambient';

    private _theme: BackgroundType;
    private backgroundMusic: Sound;

    private currentAnimation: Spine;
    // VISUALS
    private backgroundSpriteNormal: Sprite;
    private mainGameScreen: MainGameScreen;
    public nosleep:NoSleep
    private backgroundSpriteFreegame: Sprite;

    private mainAnimation: Spine;
    private freegameAnimation: Spine;


    constructor() {
        super();
        const asset = AssetsManager.spine.get(BackgroundType.NORMAL);
        this.mainAnimation = Spine.from(asset.skeletonUrl, asset.atlasUrl);
        this.backgroundSpriteNormal = new Sprite(AssetsManager.textures.get(BackgroundType.NORMAL));
        this.backgroundSpriteFreegame = new Sprite(AssetsManager.textures.get(BackgroundType.FREEGAME));
        this.freegameAnimation = Spine.from(asset.skeletonUrl, asset.atlasUrl);
        var self = this
        this.nosleep = new NoSleep()
         if(getFromLocalStorage('settings')?.introScreen )
            {
                this.nosleep.enable();  
                setTimeout(() => {
                    self.updateBackgroundMusic();
              }, 1000);
             } 
         document.body.addEventListener('pointerdown', () => {
            this.nosleep.enable();
            setTimeout(() => {
                  self.updateBackgroundMusic();
            }, 1000);
          }, { once: true });
        document.addEventListener('visibilitychange', () => {
            const { ctx } = Howler;
            if (document.visibilityState !== "hidden") {
                setTimeout(() => {
                    self.updateBackgroundMusic();
                }, 100);
            } 
        });
        document.addEventListener('focus', () => {
            setTimeout(() => {
                self.updateBackgroundMusic();
            }, 100);
        });
        this.setTheme(BackgroundType.NORMAL);
        setTimeout(() => {
            self.updateBackgroundMusic();
        }, 1000)
    }

    public async setTheme(type: BackgroundType) {
        if (this._theme === type) {
            return;
        }

        this._theme = type;

        switch (this._theme) {
            case BackgroundType.NORMAL:
                this.swap(this.mainAnimation,this.backgroundSpriteNormal,'idle',true);
                break;
            case BackgroundType.FREEGAME:
                SoundManager.play(SoundList.TRANSITION);
                this.swap(this.freegameAnimation,this.backgroundSpriteFreegame,'free_spin',true);
                break;
        }
    }

    private swap(animation: Spine, background: Sprite, id: string, loop: boolean): void {
        if (this.children.length === 0) {
            background.pivot.set(background.width / 2, background.height / 2);
            this.addChild(background);
            this.currentAnimation = animation;
            this.addChild(this.currentAnimation);
        } else {
            
            this.removeChildAt(0);
            this.removeChild(this.currentAnimation);
    
           
            background.pivot.set(background.width / 2, background.height / 2);
            this.addChildAt(background, 0); 
            this.currentAnimation = animation;
            this.addChild(this.currentAnimation);
            
    
            if (this.backgroundMusic) {
                Tweener.addTween(this.backgroundMusic, {
                    volume: 0,
                    time: 0.45,
                    transition: 'linear',
                    onComplete: () => {
                        this.updateBackgroundMusic();
                    }
                });
            }
        }
    
        this.currentAnimation.state.setAnimation(0, id, loop);
    }
    

    private updateBackgroundMusic(): void {
        this.backgroundMusic?.stop();
        this.backgroundMusic = SoundManager.loop({
            id: this._theme === BackgroundType.NORMAL ? SoundListExtended.BASEGAME_BACKGROUND : SoundListExtended.FREEGAME_BACKGROUND,
            volume: this._theme === BackgroundType.NORMAL ? 0.1 : 0.2,
            channel: MainScreenBackground.DEFAULT_BACKGROUND_CHANNEL
        });
    }

    public updateLayout(desc: UpdateLayoutDescription) {
        switch (desc.orientation) {
            case ScreenOrientation.HORIZONTAL:
                const xScale: number = desc.currentWidth / desc.baseWidth;
                const yScale: number = desc.currentHeight / desc.baseHeight;
                this.scale.set(xScale > yScale ? xScale : yScale);
                break;
            case ScreenOrientation.VERTICAL:
                this.scale.set((desc.currentHeight / desc.baseHeight) * 2);
                // Keep center after rescaling
                this.pivot.x = (desc.baseWidth / desc.currentWidth);
                // Ordinary offset
                this.x = 120;
                break;
        }

    }
}

export enum BackgroundType {
    NORMAL = 'main-screen-background',
    FREEGAME = 'freegame-screen-background'
}
