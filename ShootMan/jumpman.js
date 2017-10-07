    function init() {
    // caution: 'game' is global
    game = new Phaser.Game(400, 408, Phaser.AUTO, 'Jump Man', {
        preload: preload,
        create: create,
        update: update
    });
};

function preload() {
    // load level stuff
    // game.load.tilemap('level0Tilemap', 'SpriteSheets/Level0.json', null,
        // Phaser.Tilemap.TILED_JSON);
    // game.load.image('level0Image', 'SpriteSheets/Level0SpriteSheet.png');
    game.load.tilemap('level0Tilemap', 'SpriteSheets/NewLevel1.json', null,
        Phaser.Tilemap.TILED_JSON);
    game.load.image('level0Image', 'SpriteSheets/Level0SpriteSheet.png');

    // load player sprite sheet
    game.load.spritesheet('PlayerCharacter', 'SpriteSheets/JumpManSpriteSheet.png',
        32, 32, 9);

    game.load.spritesheet('Enemy', 'SpriteSheets/EnemySpriteSheet.png',
        32, 32, 9);

    // load weapon projectile sprite sheet
    game.load.spritesheet('Projectile', 'SpriteSheets/JumpManSpriteSheet.png',
        32, 32, 9);

    game.load.image('arrowButton', 'SpriteSheets/arrow.png');
    game.load.image('fireButton', 'SpriteSheets/aButton.png');
};


function create() {
    // create level stuff
    // caution all globals
    level = game.add.tilemap('level0Tilemap');
    // level.addTilesetImage('DummyTileset', 'level0Image');
    level.addTilesetImage('terrain', 'level0Image');
    layer = level.createLayer(0);
    layer.resizeWorld();
    level.setCollisionBetween(0, 9);

    // create input method
    cursors = game.input.keyboard.createCursorKeys();
    spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);

    // touch input
    var yOffset = 330;
    leftButton = game.add.button(30, 30 + yOffset, 'arrowButton', null);
    leftButton.anchor.setTo(0.5, 0.5);
    rightButton = game.add.button(90, 30 + yOffset, 'arrowButton', null);
    rightButton.anchor.setTo(0.5, 0.5);
    rightButton.angle = 180;
    downButton = game.add.button(60, 60 + yOffset, 'arrowButton', null);
    downButton.anchor.setTo(0.5, 0.5);
    downButton.angle = 270;
    fireButton = game.add.button(350, 40 + yOffset, 'fireButton', null);
    fireButton.anchor.set(0.5, 0.5);
    fireButton.scale.setTo(32/50, 32/50);

    leftButton.fixedToCamera = true;
    rightButton.fixedToCamera = true;
    downButton.fixedToCamera = true;
    fireButton.fixedToCamera = true;

    // FIXME: this needs refactoring
    leftButton.onInputDown.add(function () {
        leftButton.isDown = true;
    });
    leftButton.onInputUp.add(function () {
        leftButton.isDown = false;
    });
    rightButton.onInputDown.add(function () {
        rightButton.isDown = true;
    });
    rightButton.onInputUp.add(function () {
        rightButton.isDown = false;
    });
    downButton.onInputDown.add(function () {
        downButton.isDown = true;
    });
    downButton.onInputUp.add(function () {
        downButton.isDown = false;
    });
    fireButton.onInputUp.add(function () {
        fireButton.isDown = true;
    });
    fireButton.onInputDown.add(function () {
        fireButton.isDown = false;
    });

    // create weapon
    weapon = game.add.weapon(1, 'Projectile');
    weapon.setBulletFrames(2, 2, true);
    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    weapon.bulletSpeed = 800;
    weapon.fireRate = 50;
    weapon.bulletGravity.y = -1100;
    weapon.fireAngle = Phaser.ANGLE_RIGHT;

    // create player
    player = new PlayerCharacter(50, 40);
    game.add.existing(player);
    //game.add.sprite(10, 10, 'PlayerCharacter');
    weapon.trackSprite(player, 0, 0, false);


    // create enemies
    enemies = game.add.group();
    enemies.enableBody = true;
    enemy = enemies.create(100, 100, 'Enemy');
    configureConcreteEnemy(enemy);

    // init physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 1100;

    game.camera.flash('#000000');
    game.stage.backgroundColor = 0xFFFFFF;
    console.log(game.stage.backgroundColor);
};

//TODO: move this
var killBullets = function (bullet, layer) {
    bullet.kill();
};

function update() {
    game.physics.arcade.collide(weapon.bullets, layer, killBullets, null, this);
};

function PlayerCharacter(x, y) {
    var acceleration = 700;
    var deceleration = 700;
    var maxSpeed = 300;
    var jumpAcceleration = -30000;
    var shotAcceleration = 1000;
    var playerState = PlayerState.idle;

    var sprite = new Phaser.Sprite(game, x, y, 'PlayerCharacter');
    sprite.animations.add('idle', [0]);
    sprite.animations.add('run', [0, 1], 4, true);
    //sprite.animations.add('right', [0, 1], 4, true);
    sprite.animations.add('jump', [0, 1, 1, 1, 0], 3, false);
    sprite.animations.add('pointWeaponDown', [6], 1, false);
    sprite.animations.add('dead', [8], 3, false);
    sprite.animations.play('idle');
    sprite.anchor.set(0.5, 0.5);

    game.physics.enable(sprite);
    //sprite.body.collideWorldBounds = true;
    sprite.body.maxVelocity.x = maxSpeed;
    sprite.body.drag.x = deceleration;
    game.camera.follow(sprite);


    var move = function(direction) {
        sprite.body.acceleration.x = direction * acceleration;
        sprite.body.acceleration.y = 0;

        if (direction !== 0 && !PlayerState.jump) {
            if (playerState !== PlayerState.running) {
                if (sprite.body.velocity.x < 0) {
                    // sprite.animations.play('left');
                    weapon.fireAngle = Phaser.ANGLE_LEFT;
                    sprite.scale.x = -1;
                } else if (sprite.body.velocity.x > 0) {
                    weapon.fireAngle = Phaser.ANGLE_RIGHT;
                    // sprite.animations.play('right');
                    sprite.scale.x = 1;
                }
                sprite.animations.play('run');
                playerState = PlayerState.running;
            }
        }
        if (sprite.body.velocity.x === 0 && sprite.body.velocity.y == 0
            && playerState !== PlayerState.dead) {
            sprite.animations.play('idle');
            playerState = PlayerState.idle;
        }
    };

    var jump = function() {
        var canJump = sprite.body.blocked.down;
        if (canJump) {
            sprite.body.acceleration.y = jumpAcceleration;
            sprite.animations.play('jump');
            playerState = PlayerState.jump;
        }
    };

    var fire = function() {
        var sign = weapon.fireAngle === Phaser.ANGLE_RIGHT ? -1 : 1;
        sprite.body.acceleration.x += sign*shotAcceleration;
        weapon.fire();
    };

    var dead = function() {
        sprite.animations.play('dead');
        playerState = PlayerState.dead;
        sprite.body.enable = false;
        game.input.enabled = false;
    }

    var update = function() {
        game.physics.arcade.collide(sprite, layer);
        game.physics.arcade.collide(sprite, enemies, dead);

        // if (cursors.left.isDown) {
            // move(-1);
        // } else if (cursors.right.isDown) {
            // move(1);
        // } else {
            // move(0);
        // }
        // if (cursors.up.isDown) {
            // jump();
        // }

        if (leftKey.isDown || leftButton.isDown) {
            move(-1);
        } else if (rightKey.isDown || rightButton.isDown) {
            move(1);
        } else {
            move(0);
        }

        if (downKey.isDown || downButton.isDown) {
            sprite.animations.play('pointWeaponDown');
        }
        if (spaceKey.isDown || fireButton.isDown) {
            if (downKey.isDown || downButton.isDown) {
                weapon.fireAngle = Phaser.ANGLE_DOWN;
                jump();
            }
            fire();
        }
    };

    sprite.move = move;
    sprite.jump = jump;
    sprite.fire = fire;
    sprite.update = update;

    return sprite;
};

var PlayerState = {
    idle: 0,
    running: 1,
    jumping: 2,
    firing: 3,
    dead: 4
};


function configureConcreteEnemy(sprite) {
    var speed = 100;
    sprite.body.velocity.x = speed;
    sprite.anchor.set(0.5, 0.5);
    sprite.animations.add('walk', [0, 0, 0, 1, 1, 1], 6, true);
    sprite.animations.add('dead', [8], 1, false);
    sprite.animations.play('walk');

    var dead = function() {
        sprite.animations.play('dead');
        sprite.body.velocity.x = 0;
        sprite.body.velocity.y = 0;
        sprite.body.enable = false;
    }

    sprite.update = function () {
        game.physics.arcade.collide(sprite, layer);
        game.physics.arcade.collide(sprite, weapon.bullets, dead);

        if (sprite.body.blocked.right) {
            sprite.body.velocity.x = -speed;
            sprite.scale.x = -1;
        } else if(sprite.body.blocked.left) {
            sprite.body.velocity.x = speed;
            sprite.scale.x = 1;
        }
    };
};


// TODO: implement create player as decorator to sprite
// TODO: extract weapon code and inject to player, done but still bad...
// TODO: too many globals
