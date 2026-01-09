import { Container, Sprite } from 'pixi.js';

export class SlantProgressBar extends Container {
    private bg: Sprite;
    private progressValueBg: Sprite;
    private fill: Sprite;
    private maskSprite: Sprite;

    private _progress = 0;
    private maxWidth: number;

    constructor() {
        super();

        // Background
        this.bg = Sprite.from('loader-bcg');
        this.addChild(this.bg);

        // Fill
        this.fill = Sprite.from('loader-fill');
        this.fill.scale.x = 1.03;
        this.fill.x = 15;
        this.fill.y = 12;
        this.addChild(this.fill);

        // Progress value bg
        this.progressValueBg = Sprite.from('progress-text-bg');
        this.progressValueBg.anchor.set(1, 0);
        this.progressValueBg.position.set(this.bg.width - 11, 13);
        this.addChild(this.progressValueBg);

        // Mask sprite
        this.maskSprite = Sprite.from('maskSprite');
        this.maskSprite.scale.x = 1.08;
        this.maskSprite.position.set(this.fill.x, this.fill.y);

        this.addChild(this.maskSprite);

        this.fill.mask = this.maskSprite;

        this.maxWidth = this.fill.width;

        this.updateMaskPosition();
    }

    set progress(value: number) {
        this._progress = Math.max(0, Math.min(100, value));
        this.updateMaskPosition();
    }

    get progress() {
        return this._progress;
    }
    // Move mask sprite based on progress
    private updateMaskPosition() {
        const visibleWidth = (this._progress / 100) * this.maxWidth;

        this.maskSprite.x = visibleWidth - this.maxWidth;
    }
}
