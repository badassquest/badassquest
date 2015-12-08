define(['Phaser', 'Const', 'Util', 'External'], function(Phaser, Const, Util, External) {

    var game = null;

    var particlesManager = null;
    var emitter = null;

    function StateFight(appGame) {
        game = appGame;
    }

    StateFight.prototype = {

        characters: [],

        foeSprites: {},

        finished: false,

        init: function(args) {

            // Clean up from last use.
            this.characters = [];
            this.foeSprites = {};
            this.finished = false;

            // Required params.
            this.user = args.user;
            this.foes = args.foes;
            for (var i in this.foes) {
                // We need to set the user so they can attack it.
                this.foes[i].setUser(this.user);
            }

            // Optional params.
            this.location = args.location;
            this.wonCallback = args.wonCallback;

            this.establishTurnsOrder();
        },

        establishTurnsOrder: function() {

            // Foes.
            for (var i in this.foes) {
                var character = this.foes[i];
                character.prepareTurn = this.removeFoesHits.bind(this);
                character.counter = 0;
                character.type = 'foe';

                this.characters.push(character);
            }

            // The player.
            var player = this.user;
            player.prepareTurn = this.enableFoesHits.bind(this);
            player.counter = 0;
            player.type = 'player';
            this.characters.push(player);

            // The one with more speed starts and one turn each after that.
            this.characters.sort(function(c1, c2) {
                return c2.attrs.speed - c1.attrs.speed;
            });
        },

        preload: function() {

            for (var i in this.foes) {
                this.foes[i].preloadAssets(game);
            }

            // Particle.
            game.load.image('particle', 'img/pixel2x2_red.png');

            // Same size than the whole game canvas.
            game.load.image('background', this.getBackground());
        },

        getBackground: function() {
            var size = Util.getGameSize();

            var img = 'img/default-battlefield.png';
            if (this.location) {
                img = External.getStreetViewImage(this.location, size.width, size.height);
            }
            game.load.image('background', img);
        },

        create: function() {

            var background = game.add.sprite(game.world.centerX, game.world.centerY, 'background');
            background.anchor.set(0.5);

            // Hit particles stuff.
            game.physics.startSystem(Phaser.Physics.ARCADE);
            emitter = game.add.emitter(0, 0, 100);
            emitter.makeParticles('particle');
            emitter.gravity = 200;

            // Depends on the number of foes we have.
            var foeSpacing = game.world.width / this.foes.length;

            // To center it (although it should consider the foe width.
            var foeX = foeSpacing / 2;

            // Some top spacing.
            var foeY = 150;

            for (var i in this.foes) {
                var foeSprite = this.foes[i].createSprite(game, foeX, foeY);

                foeSprite.inputEnabled = true;

                // Add them to the list so later we can play with them, same index than in foes.
                this.foeSprites[i] = foeSprite;

                foeX = foeX + foeSpacing;
            }

            // Start the next turn.
            this.getNextTurn();
        },

        getNextTurn: function() {

            // Prevent race condition. Fight might be over and next callback is still executed.
            if (this.finished) {
                return;
            }

            // Finish if the player is dead.
            if (this.user.isDead()) {
                return;
            }

            // Finish if all foes are dead.
            var anyAlive = false;
            for (var i in this.foes) {
                var isDead = this.foes[i].isDead();
                if (!isDead) {
                    anyAlive = true;
                } else if (isDead) {
                    // If the foe sprite still exists remove it.
                    this.foeSprites[i].destroy();
                }
            }
            if (anyAlive === false) {
                this.userWins();
                return;
            }

            // 0 index by default.
            var nextIndex = null;
            var nextCounter = 999999;

            // characters is sorted by attack order.
            for (var i in this.characters) {
                var character = this.characters[i];
                if (!character.isDead() && character.counter < nextCounter) {
                    // Following the order that was set, so an equals returns the lower index.
                    nextIndex = Number.parseInt(i);
                    nextCounter = this.characters[nextIndex].counter;
                }
            }

            if (nextIndex === null) {
                console.error('No next index!');
                return;
            }

            // Increment the counter for that index.
            this.characters[nextIndex].counter++;

            // Execute the character-type specific stuff and init the turn.
            this.characters[nextIndex].prepareTurn();
            this.characters[nextIndex].attackTurn(game, this.getNextTurn.bind(this));
        },

        enableFoesHits: function() {
            for (var i in this.foeSprites) {
                if (this.foeSprites.hasOwnProperty(i)) {
                    // We attach the foe index.
                    this.foeSprites[i].events.onInputDown.add(this.hit.bind(this), this, 0, i);
                }
            }

            // Notify that your turn starts.
            var text = game.add.text(game.world.centerX, 50, 'Your turn! Hit them!');
            this.formatText(text);

            // Show it while the user can attack.
            setTimeout(function() {
                text.destroy();
            }, Const.userAttackTime);
        },

        removeFoesHits: function() {
            for (var i in this.foeSprites) {
                if (this.foeSprites.hasOwnProperty(i)) {
                    if (this.foeSprites[i].events.onInputDown.getNumListeners() > 0) {
                        this.foeSprites[i].events.onInputDown.removeAll();
                    }
                }
            }
        },

        update: function() {
            for (var i in this.foes) {
                if (!this.foes[i].isDead()) {
                    this.foes[i].updateCanvas(game);
                }
            }
        },

        hit: function(foeSprite, pointer, foeIndex) {

            var damagePoints = this.user.damageFoe(this.foes[foeIndex]);

            // Blood.
            emitter.x = pointer.x;
            emitter.y = pointer.y;
            emitter.start(true, 3000, null, 20);

            // Notify the damage points.
            var text = game.add.text(pointer.x, pointer.y, damagePoints);
            this.formatText(text, 20);

            // Show it while the user can attack.
            setTimeout(function() {
                text.destroy();
            }, 500);
        },

        /**
         * Show you won + add experience.
         */
        userWins: function() {

            var experience = 0;
            for (var i in this.foes) {
                var foe = this.foes[i];
                experience = experience + foe.attrs.attack + foe.attrs.defense + foe.attrs.tHealth;
            }
            this.user.addExperience(experience);

            // You won info.
            setTimeout(function() {
                var text = game.add.text(game.world.centerX, game.world.centerY - 50, 'You won!');
                this.formatText(text);
            }.bind(this), 500);

            setTimeout(function() {
                var text = game.add.text(game.world.centerX, game.world.centerY + 50, 'Experience: ' + experience);
                this.formatText(text);
            }.bind(this), 1500);

            // And finally the callback if it was defined.
            if (this.wonCallback) {
                setTimeout(function() {
                    this.wonCallback();
                }.bind(this), 2500);
            }
        },

        finishFight: function() {
            this.finished = true;
        },

        formatText: function(text, size) {

            // Big one if undefined.
            if (typeof size === "undefined") {
                size = Util.getGameFontSize();
            }

            text.anchor.set(0.5);
            text.align = 'center';

            //	Font style
            text.font = 'Arial Black';
            text.fontSize = size;
            text.fontWeight = 'bold';

            //	Stroke color and thickness
            text.stroke = '#000000';
            text.strokeThickness = 6;
            text.fill = '#43d637';
        }
    }

    return StateFight;
});
