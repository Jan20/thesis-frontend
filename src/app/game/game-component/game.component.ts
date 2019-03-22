import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { interval } from "rxjs";
import { Level } from 'src/app/models/level';
import { Option } from 'src/app/models/option';
import { LanguageService } from 'src/app/shared/services/language.service';
import { LevelService } from '../../shared/services/level.service';
import { SessionService } from '../../shared/services/session.service';
import { AudioService } from '../audio/audio.service';
import { initShaders } from '../commons/InitShaders';
import { flatten, mat4, mult, translate, vec3 } from '../commons/MV';
import { WebGLUtils } from '../commons/webgl-utils';
import { GameService } from '../game.service';
import { World } from '../game/world';

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, AfterViewInit {

    ///////////////
    // Variables //
    ///////////////

    // Canvas in which the game is rendered.
    @ViewChild('canvas') canvas: ElementRef
    
    // Declares a variable indicating whether the current 
    // session has been stored at Firestore or not. 
    public isStored: boolean = false

    // 
    public readyForSurvey: boolean = false
    
    // Status variable that can either be 'ready', 'loading',
    // 'running', 'lost' or 'completed'. The status variable
    // is  
    public status: string

    // UI elements
    public time: string = `00000`
    public score: string = `00000`
    public lives: number = this.sessionService.getLives()

    public language: string = 'english'

    public timeString: Option = new Option('Time: ', 'Zeit: ')
    public scoreString: Option = new Option('Score: ', 'Punkte: ')
    public livesString: Option = new Option('Lives: ', 'Leben: ')

    public completedMessage: Option = new Option('Level Completed!', 'Level abgeschlossen!')
    public lostMessage: Option = new Option('Thank you for having played the level!', 'Danke, dass Sie das Level gespielt hast!')
    public waitMessage: Option = new Option('Please wait a second ...', 'Bitte warten Sie eine Sekunde ...')
    public surveyMessage: Option = new Option('Please continue to the survey', 'Bitte fahren Sie mit der Umfrage fort')
    public secondLevelMessage: Option = new Option('Start the Second Level!', 'Fahren Sie mit dem zweiten Level fort!')

    public showDifficulty: boolean = false
    public difficultyClass: Option = new Option('','')
    public showInformation: boolean = false

    //////////////////
    // Constructors //
    //////////////////
    /**
     * 
     * Default constructor
     * 
     */
    public constructor(

        private gameService: GameService,
        private sessionService: SessionService,
        private levelService: LevelService,
        private audioService: AudioService,
        private languageService: LanguageService,
        private router: Router

    ) {

        this.sessionService.readyForSurveySubject.subscribe(readyForSurvey => this.readyForSurvey = readyForSurvey)
        this.sessionService.sessionSubject.subscribe(status => {

            status === 'stored' ? this.isStored = true : this.isStored = false

        })

        this.sessionService.statusSubject.subscribe(status => this.status = status)
        this.sessionService.statusSubject.next('ready')
        
        this.sessionService.timeSubject.subscribe(time => this.time = time)
        this.sessionService.lifeSubject.subscribe(lives => this.lives = lives)
        this.sessionService.scoreSubject.subscribe(score => this.score = score)
        
        // Updates the language variable every time
        // the user changes the language setting.
        this.languageService.languageSubject.subscribe(language => this.language = language)

        // Requests the lanuage service's current language.
        this.languageService.fetchLanguage()

        this.sessionService.showDifficultyClassSubject.subscribe(showDifficulty => this.showDifficulty = showDifficulty)
        this.sessionService.difficultyClassSubject.subscribe(difficultyClass => {
            
            switch(difficultyClass){

                case 50: this.difficultyClass = new Option('You are within the first quintile of all users', 'Sie befinden sich im ersten Quintil aller Benutzer')
                case 75: this.difficultyClass = new Option('You are within the second quintile of all users', 'Sie befinden sich im zweiten Quintil aller Benutzer')
                case 100: this.difficultyClass = new Option('You are within the third quintile of all users', 'Sie befinden sich im dritten Quintil aller Benutzer')
                case 125: this.difficultyClass = new Option('You are within the fourth quintile of all users', 'Sie befinden sich im vierten Quintil aller Benutzer')
                case 150: this.difficultyClass = new Option('You are within the fifth quintile of all users', 'Sie befinden sich im fünften Quintil aller Benutzer')

            }
            
        })
    }

    ngOnInit(): void {

        if (this.sessionService.tutorialHasBeenFinished === true) {

            this.sessionService.tutorialHasBeenFinished = false
            location.reload()
      
        }

        this.startNewLevel()
     
    }

    /**
     * 
     * @param event 
     *
     */
    @HostListener('document:keydown', ['$event'])
    async handleKey(event: KeyboardEvent) {

        event.key === 'Enter' ? this.startNewLevel() : null

    }

    /**
     * 
     * Retrieves 
     * 
     */
    public async startNewLevel(): Promise<void> {

        // Checks whether the user can progress to the survey.
        if (this.readyForSurvey) {

            // 
            this.progressToSurvey()
            return

        }

        // Checks wheather
        if (this.status === 'ready') {

            this.status = 'loading'

            const level: Level = await this.levelService.getLevel()

            this.init(level)

            this.sessionService.statusSubject.next('running')
            this.isStored === true ? location.reload() : null

        }

        if ((this.status === 'completed' || this.status === 'lost') && this.isStored === true) {

            location.reload() 

        }
    
        // If the current session has been stored successfully,
        // a page refresh is performend. 

    }

    public selectActiveKey(keyCode: number): void {

        // Ensures that the user cannot run left and right at the same time.
        keyCode === 39 ? this.sessionService.keyArray[37] = false : null
        keyCode === 37 ? this.sessionService.keyArray[39] = false : null

        this.sessionService.keyArray[keyCode] = true
        this.sessionService.selectActiveKeySubject.next(keyCode)

    }

    public removeActiveKey(keyCode: number): void {

        this.sessionService.keyArray[keyCode] = false

    }

    /**
     * 
     * Directs the user further to the first part of the survey.
     * 
     */
    public progressToSurvey(): void {

        // Changes the current URL to the start of the survey.
        this.router.navigate(['survey/part_1'])

    }

    /**
     * 
     * @param level 
     */
    private async init(level: Level) {

        this.gameService.lightPosition = vec3(0.0, 1.0, 1.0)

        !this.gameService.GL ? alert("WebGL isn't available") : null

        const extension = this.gameService.GL.getExtension('WEBGL_depth_texture');

        !extension ? alert("Depth Texture Extension Not Applicable") : null

        this.gameService.GL.viewport(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        this.gameService.GL.clearColor(1.0, 1.0, 1.0, 1);

        this.gameService.GL.enable(this.gameService.GL.DEPTH_TEST);
        this.gameService.GL.enable(this.gameService.GL.BLEND);
        this.gameService.GL.blendFunc(this.gameService.GL.SRC_ALPHA, this.gameService.GL.ONE_MINUS_SRC_ALPHA);

        //
        //  Load shaders and initialize attribute buffers
        //

        this.gameService.PROGRAM = initShaders(this.gameService.GL, this.vertexShaderText, this.fragmentShaderText)

        this.gameService.GL.useProgram(this.gameService.PROGRAM);

        this.gameService.V_BUFFER = this.gameService.GL.createBuffer();
        this.gameService.T_BUFFER = this.gameService.GL.createBuffer();
        this.gameService.N_BUFFER = this.gameService.GL.createBuffer();
        this.gameService.S_BUFFER = this.gameService.GL.createBuffer();

        this.gameService.UNIFORM_MODEL = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "modelMatrix");
        this.gameService.UNIFORM_PROJECTION = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "perspectiveMatrix");
        this.gameService.UNIFORM_VIEW = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "viewMatrix");
        this.gameService.UNIFORM_LIGHTPOSITION = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "lightPostion");
        this.gameService.UNIFORM_SHININESS = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "shininess");
        this.gameService.UNIFORM_SHADOWMAP = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "shadowMap");
        this.gameService.UNIFORM_SHADOW_VIEW = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "shadowViewMatrix");
        this.gameService.UNIFORM_CAMERA_X = this.gameService.GL.getUniformLocation(this.gameService.PROGRAM, "cameraX");

        // set initial camera position
        this.gameService.CAMERA_POS = this.gameService.INITIAL_CAMERA_POS.slice(0);

        this.gameService.GAMEWORLD = new World(this.gameService, level, this.sessionService, this.levelService, this.audioService)

        this.audioService.playTheme()

        // for hud initialization
        this.sessionService.resetTimer();
        this.sessionService.myTimer();

        this.render();
    }


    public render() {

        interval(1000 / 60).subscribe(() => {

            requestAnimationFrame(() => {

                this.gameService.GL.clear(this.gameService.GL.COLOR_BUFFER_BIT | this.gameService.GL.DEPTH_BUFFER_BIT);

                // Set the perspective
                this.gameService.GL.uniformMatrix4fv(this.gameService.UNIFORM_PROJECTION, false, flatten(this.gameService.PERSPECTIVE));


                this.gameService.GL.uniform1f(this.gameService.UNIFORM_CAMERA_X, -this.gameService.CAMERA_POS[0]);
                // Set the view
                var vtm = mat4();

                // initial CameraPos set in main to (0, 0, -40) to view all cubes
                vtm = mult(vtm, translate(this.gameService.CAMERA_POS));
                this.gameService.GL.uniformMatrix4fv(this.gameService.UNIFORM_VIEW, false, flatten(vtm));


                //  Set lighting
                this.gameService.GL.uniform3fv(this.gameService.UNIFORM_LIGHTPOSITION, flatten(this.gameService.lightPosition));
                this.gameService.GL.uniform1f(this.gameService.UNIFORM_SHININESS, this.gameService.shininess);

                // Draw the world and everything in it    
                this.gameService.GAMEWORLD.draw();
            });


        });


    }

    ngAfterViewInit() {

        this.gameService.GL = new WebGLUtils().setupWebGL(this.canvas)

    }

    public toggleDifficultyInformation(): void {

        this.showInformation ? this.showInformation = false : this.showInformation = true

    }

    /**
     * 
     * Implements 
     * 
     */
    private vertexShaderText = [

        'attribute vec4 vPosition;',
        'attribute vec3 vNormal;',
        'attribute vec2 vTexCoord;',
        '',
        'varying vec2 fTexCoord;',
        'uniform mat4 modelMatrix;',
        'uniform mat4 perspectiveMatrix;',
        'uniform mat4 viewMatrix;',
        'uniform vec3 lightPosition;',
        'uniform float cameraX;',
        '',
        'varying vec3 fL, fE, fH, fN;',
        '',
        'void main() ',
        '{',
        '    vec3 pos = (viewMatrix * modelMatrix * vPosition).xyz;',
        '    fL = normalize((viewMatrix * vec4(cameraX + 50.0, 200.0, -1.0, 1.0)).xyz - pos); ',
        '    fE = normalize(-pos);',
        '    fH = normalize(fL + fE);',
        '    fN = normalize(viewMatrix * modelMatrix * vec4(vNormal, 0.0)).xyz; ',
        '',
        '    fTexCoord = vTexCoord;',
        '    gl_Position = perspectiveMatrix * viewMatrix * modelMatrix * vPosition;',
        '} '
    ].join('\n')

    private fragmentShaderText = [

        'precision mediump float;',
        '',
        'varying vec3 fL, fE, fH, fN;',
        'varying vec2 fTexCoord;',
        '',
        'uniform sampler2D texture;',
        'uniform float shininess;',
        '',
        'void main()',
        '{',
        'float visibility = 1.0;',
        '',
        'vec4 texColor = texture2D(texture, fTexCoord); ',
        'vec4 ambient = 1.0 * texColor;',
        'float kd = max(dot(fL, fN), 0.0);',
        'vec4 diffuse = visibility * kd * 0.2 * texColor;',
        '',
        'float ks = pow(max(dot(fN, fH),0.0), shininess);',
        'vec4 specular = 0.9 * visibility * ks * vec4(1.0, 1.0, 1.0, 1.0);',
        '',
        'vec4 fColor = ambient + diffuse + specular;',
        '',
        'gl_FragColor = fColor;',
        '}'

    ].join('\n')

}
