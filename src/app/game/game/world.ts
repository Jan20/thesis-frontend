import { Level } from 'src/app/models/level';
import { LevelService } from '../../shared/services/level.service';
import { SessionService } from '../../shared/services/session.service';
import { AudioService } from '../audio/audio.service';
import { Background } from './Background';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { Stage } from './Stage';
import { GameService } from '../game.service';
import { Textures } from '../commons/textures';

export class World {

    ///////////////
    // Variables //
    ///////////////
    public xBoundLeft: number
    public xBoundRight: number
    public drawBound: number
    public enemies: Enemy[] = []
    public deadEnemies: Enemy[] = []
    public items = []
    public projectiles  = []
    public player: Player
    public stage: Stage
    public background: Background

    public levelTextures: any
    public level: string[][]

    public hasFinished: boolean = false

    //////////////////
    // Constructors //
    //////////////////
    public constructor(
        
        private gameService: GameService,
        level: Level, 
        private sessionService: SessionService, 
        private levelService: LevelService,
        private audioService: AudioService
        
    ) {

        this.sessionService = sessionService
        this.audioService = audioService
        this.level = level.representation

        this.xBoundLeft = this.gameService.INITIAL_WORLD_BOUND_LEFT
        this.xBoundRight = this.gameService.INITIAL_WORLD_BOUND_RIGHT
        this.drawBound = this.gameService.DRAW_BOUND

        //
        // need to do this before constructing the stage
        //
        this.generateEnemies()
        this.player = new Player(this.gameService, this.sessionService, this.levelService, this.audioService)
        this.stage = new Stage(this.gameService, level.representation)

        this.background = new Background(this.gameService)

        this.levelTextures =
        
        {
            'player': {
                'fileNames': [
                    "/assets/Images/tux/Char/idle.png",
                    "/assets/Images/tux/Char/idleback.png",
                    "/assets/Images/tux/Char/walk1.png",
                    "/assets/Images/tux/Char/walk1back.png",
                    "/assets/Images/tux/Char/walk2.png",
                    "/assets/Images/tux/Char/walk2back.png",
                    "/assets/Images/tux/Char/walk3.png",
                    "/assets/Images/tux/Char/walk3back.png",
                    "/assets/Images/tux/Char/walk4.png",
                    "/assets/Images/tux/Char/walk4back.png",
                    "/assets/Images/tux/Char/walk5.png",
                    "/assets/Images/tux/Char/walk5back.png",
                    "/assets/Images/tux/Char/jump.png",
                    "/assets/Images/tux/Char/jumpback.png"
                ],
                'textures': []
            },
            'enemies': [
                {
                    'fileNames': [
                        "/assets/Images/tux/Enemies/Crawler/idle.png",
                        "/assets/Images/tux/Enemies/Crawler/idleback.png",
                        "/assets/Images/tux/Enemies/Crawler/walk1.png",
                        "/assets/Images/tux/Enemies/Crawler/walk1back.png",
                        "/assets/Images/tux/Enemies/Crawler/walk2.png",
                        "/assets/Images/tux/Enemies/Crawler/walk2back.png",
                        "/assets/Images/tux/Enemies/Crawler/walk3.png",
                        "/assets/Images/tux/Enemies/Crawler/walk3back.png",
                    ],
                    'textures': []
                },
                {
                    'fileNames': [
                        "/assets/Images/tux/Enemies/Jumper/idle.png",
                        "/assets/Images/tux/Enemies/Jumper/idleback.png"
                    ],
                    'textures': []
                },
                {
                    'fileNames': [
                        "/assets/Images/tux/Enemies/Flyer/fly1.png",
                        "/assets/Images/tux/Enemies/Flyer/fly1back.png",
                        "/assets/Images/tux/Enemies/Flyer/fly2.png",
                        "/assets/Images/tux/Enemies/Flyer/fly2back.png",
                    ],
                    'textures': []
                },
                {
                    'fileNames': [
                        "/assets/Images/tux/Enemies/Flyer/fly1.png",
                        "/assets/Images/tux/Enemies/Flyer/fly1back.png",
                        "/assets/Images/tux/Enemies/Flyer/fly2.png",
                        "/assets/Images/tux/Enemies/Flyer/fly2back.png",
                    ],
                    'textures': []
                }
            ],
            'projectile': {
                'fileNames': [
                    "/assets/Images/tux/projectile.png"
                ],
                'textures': []
            },
            'item': {
                'fileNames': [
                    "/assets/Images/tux/Power-ups/coin.png",
                    "/assets/Images/tux/Power-ups/life.png",
                    "/assets/Images/tux/Power-ups/fireball.png",
                    "/assets/Images/tux/Power-ups/star.png",
                    "/assets/Images/tux/Power-ups/wings.png"
                ],
                'textures': []
            },
            'background': {
                'fileNames': [
                    "/assets/Images/tux/background.png"
                ],
                'textures': []
            },
            'stage': {
                'fileNames': [
                    "/assets/Images/tux/Stage/groundblock.png",
                    "/assets/Images/tux/Stage/brickblock.png",
                    "/assets/Images/tux/Stage/itemblock.png",
                    "/assets/Images/tux/Stage/coinblock.png",
                    "/assets/Images/tux/Stage/blockblock.png",
                    "/assets/Images/checkerboard.jpg"
                ],
                'textures': []
            }
        }

        //
        // Mechanism to facilitate movements, by catching key events
        // and mapping such events to a an array storing active key
        // strokes.
        // 
        document.addEventListener('keydown', (event: KeyboardEvent) => {

            // Enables the use of 'a', 'w' and 'd' keys instead of 
            // the usual arrow keys.
            switch(event.key) {
                case 'a': this.sessionService.keyArray[37] = true; break
                case 'w': this.sessionService.keyArray[38] = true; break
                case 'd': this.sessionService.keyArray[39] = true; break
            }
            
            // 
            this.sessionService.keyArray[event.keyCode] = true

            event.key === 'ArrowLeft' || event.key === 'a' ? this.player.texDir = 1 : null
            event.key === 'ArrowRight' || event.key === 'd'  ? this.player.texDir = 0 : null
         
        })

        document.addEventListener('keyup', (event: KeyboardEvent) => {
            
                        // Enables the use of 'a', 'w' and 'd' keys instead of 
            // the usual arrow keys.
            switch(event.key) {
                case 'a': this.sessionService.keyArray[37] = false; break
                case 'w': this.sessionService.keyArray[38] = false; break
                case 'd': this.sessionService.keyArray[39] = false; break
            }

            this.sessionService.keyArray[event.keyCode] = false

        })

        this.sessionService.selectActiveKeySubject.subscribe(keyCode => {

            keyCode === 37 ? this.player.texDir = 1 : null
            keyCode === 39 ? this.player.texDir = 0 : null

        })

        this.loadTextures()
            
    }

    ngOnInit(): void {}

    ///////////////
    // Functions //
    ///////////////

    /**
     * 
     * 
     * 
     */
    public loadTextures(): void {

        for (let key in this.levelTextures) {

            if (!Array.isArray(this.levelTextures[key])) {

                new Textures(this.gameService).loadImages(this.levelTextures[key].fileNames, this.levelTextures[key].textures);

            } else {

                for (let j = 0; j < this.levelTextures[key].length; j++) {

                    new Textures(this.gameService).loadImages(this.levelTextures[key][j].fileNames, this.levelTextures[key][j].textures);

                }
            }
        }

    }

    public draw(): void {

        // Returns true if the player has reached
        // the end of the level.
        if (this.player.pos[0] > this.stage.finishLine) {
            
            this.sessionService.finishSubject.next(true)
            this.sessionService.tutorialHasBeenFinished = true
            
            this.audioService.stopMusic()
            this.sessionService.setProgress(this.player.pos[0])
            this.audioService.playFinished()
            // Stores all collected gameplay information
            // of the current session at Firestore.
            this.player.resetToDefault()
            this.player.restartLevel()
            this.hasFinished = true
            this.sessionService.storeSession('completed')

        }
        
        //
        //
        //
        this.background.draw()
        this.stage.draw()

        !this.hasFinished? this.player.draw() : null

        /////////////////
        /// Todo ////////
        /////////////////
        for (var i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i].pos[0] + 1 > this.xBoundLeft && this.enemies[i].pos[0] - 1 < this.xBoundRight)
                this.enemies[i].draw();
        }

        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].lives == 0) {
                this.items.splice(i, 1);
                i--;
            }
            else
                this.items[i].draw();
        }

        for (var i = 0; i < this.projectiles.length; i++) {
            if (this.projectiles[i].lives == 0) {
                this.projectiles.splice(i, 1);
                i--;
            }
            else
                this.projectiles[i].draw();
        }

        // Update drawing boundaries based on player pos
        // Also need to adjust the CAMERA_POS variable from webgl js
        // Adjust Screen Right
        var playerEdgeDist = this.player.pos[0] - (this.xBoundRight - this.drawBound);
        
        if (playerEdgeDist > 0) {
            this.xBoundRight += playerEdgeDist;
            this.xBoundLeft += playerEdgeDist;
        }
        
        // Adjust Screen Left, only after it has moved right
        if (this.xBoundLeft > 0) {
            var playerEdgeDist = (this.xBoundLeft + this.drawBound) - this.player.pos[0];
            if (playerEdgeDist > 0) {
                this.xBoundRight -= playerEdgeDist;
                this.xBoundLeft -= playerEdgeDist;
            }
        }

        // set camera pos
        this.gameService.CAMERA_POS[0] = -((this.gameService.INITIAL_WORLD_BOUND_RIGHT + 1 - this.gameService.INITIAL_WORLD_BOUND_LEFT) / 2 + this.xBoundRight - this.gameService.INITIAL_WORLD_BOUND_RIGHT);
        this.gameService.lightPosition[0] = this.xBoundRight;

    }

    /**
     * 
     * 
     * 
     */
    public generateEnemies(): void {

        // Go through stage and create enemies
        // Might want to store the stages themselves somewhere
        // TODO store the stages somwhere
        for (let i = 0; i < this.level[0].length; i++) {
            for (let j = 0; j < this.level.length; j++) {

                let stage = this.level
                let currentSquare = stage[j][i];
                
                if (currentSquare == 'C') {
                
                    stage[j][i] = '.'
                    
                    let xMin: number = 0;
                    let xMax = Math.ceil(this.level[0].length);
                    //min
                    for (let k = i - 1; k >= 0; k--){
                        
                        if (stage[j][k] != '.' || stage[j + 1][k] == '.') {
                            xMin = k + 1;
                            break;
                        }
                    }
                    
                    // max
                    for (var k = i + 1; k < Math.ceil(this.level[0].length); k++){

                        if (stage[j][k] != '.' || stage[j + 1][k] == '.') {
                            xMax = k - 1;
                            break;
                        }
                    
                    }
                        
                    this.enemies.push(new Enemy(this.gameService, [i, 14 - j, this.gameService.ENEMY_ALPHA_DEPTH += .00001], xMin, xMax, 14 - j, 14 - j, currentSquare));
                    stage[j][i] = '.';
                
                }
                else if (currentSquare == 'J') {
                    this.enemies.push(new Enemy(this.gameService, [i, 14 - j, this.gameService.ENEMY_ALPHA_DEPTH += .00001], i, i, 14 - j, (14 - j) + 2, currentSquare));
                    stage[j][i] = '.';
                }
                else if (currentSquare == 'F') {
                    this.enemies.push(new Enemy(this.gameService, [i, 14 - j, this.gameService.ENEMY_ALPHA_DEPTH += .00001], i, i, 14 - (j + 3), 14 - j, currentSquare));
                    stage[j][i] = '.';
                }
            }
        }
    }



}
