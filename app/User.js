define(['bs', 'Const', 'Generator', 'Router', 'Controls', 'Notifier', 'PissedOffPeople'], function($, Const, Generator, Router, Controls, Notifier, PissedOffPeople) {

    function User(map, playerName, playerPhoto) {

        this.map = map;
        this.playerName = playerName;
        this.photo = playerPhoto;

        this.state = {
            cHealth: 80,
            cFood: 2000,
            cWealth: 20,
            experience: 10,
            level: 1
        };

        this.attrs = {
            tHealth: Const.initHealth,
            tFood: Const.initFood,
            speed: Const.initSpeed,
            attack: Const.initAttack,
            defense: Const.initDefense
        };

        this.router = new Router(this.map);

        // Custom controls.
        this.controls = new Controls(this.map);
        this.controls.init(this);

        // Notifications service.
        this.notifier = new Notifier(this.map, this.controls);

        // People you piss off while playing.
        this.pissedOff = new PissedOffPeople(this.map, this);

        // TODO A pause feature should stop this timer.
        this.foodTimeTimer = setInterval(this.breathDropFood.bind(this), Const.breathDropInterval);
    }

    User.prototype = {

        // @type {string}
        playerName: null,

        // @type {string}
        photo: null,

        // @type {object}
        state: {},

        // @type {object}
        attrs: {},

        // @type {google.maps.Map}
        map: null,

        // @type {google.maps.Marker}
        marker: null,

        // @type {Router}
        router: null,

        // @type {Notifier}
        notifier: null,

        // @type {PissedOffPeople}
        pissedOff: null,

        foodTimeTimer: null,

        setInitialPosition: function(position) {

            if (!position) {
                console.error('The selected story is not defining a initialPosition');
                return;
            }

            // Add the user marker to the specified position.
            var title = 'I\'m ' + this.playerName + '\n(don\'t click on me, click on the map instead)';
            this.marker = new google.maps.Marker({
                position: position,
                map: this.map,
                icon: {
                    url: this.photo,
                    scaledSize: new google.maps.Size(40, 40),
                },
                title: title,
                zIndex: 9
            });
        },

        breathDropFood: function() {
            this.updateState({
                cFood: this.state.cFood - Const.breathDropAmount
            });
        },

        passingBy: function() {

            // This runs for each step on the map, so every 50 milisecs.
            this.updateState({
                cFood: this.state.cFood - 1
            });

            // People shouts at you where you annoyed them.
            this.pissedOff.shout();
        },

        attackTurn: function(game, callback) {
            setTimeout(function() {
                callback();
            }.bind(this), Const.userAttackTime);
        },

        damageFoe: function(foe) {

            // Randomize the received damage a bit (+-2).
            var damagePoints = Generator.randomInteger(this.attrs.attack, 2);

            foe.state.cHealth = foe.state.cHealth - damagePoints;

            // Return the inflicted damage.
            return damagePoints;
        },

        moveTo: function(position, destinationCallback) {

            var destinationReachedCallback = function(reachedPosition) {

                // Execute the provided callback.
                if (typeof destinationCallback !== "undefined") {
                    destinationCallback(reachedPosition);
                }

                // We trigger the event, PoisManager will decide if nearby points should be fetched or not.
                $('#map').trigger('pois:get');
            }
            this.router.route(this.marker, position, this.passingBy.bind(this), destinationReachedCallback, this.attrs.speed);
        },

        addExperience: function(points) {

            this.state.experience = this.state.experience + points;

            // Update level if required.
            var leveledUp = false;
            for (var i = 0; i < Const.levels.length; i++) {

                if (this.state.experience < Const.levels[i]) {

                    if (this.state.level === i) {
                        // No level change.
                        break;
                    }

                    // Bump level.
                    leveledUp = true;
                    this.levelUp(i);

                    // Update the controls.
                    this.controls.update(this.state, this.attrs);
                    break;
                }
            }

            // Popover depends on whether the user leveled up or not.
            var popoverContent = null;
            if (leveledUp === true) {
                popoverContent = "<h4>Level up!</h4>"
            } else {
                popoverContent = "+ " + points + " experience points"
            }
            $('#level').popover({
                content: popoverContent,
                html: true,
                delay: {show: 1500, hide: 1000},
                placement: 'bottom',
                trigger: 'manual'
            });
            $('#level').popover('show');
            setTimeout(function() {
                $('#level').popover('destroy');
            }, 4000);
        },

        levelUp: function(level) {

            this.state.level = level;

            // Update user attrs. Here we multiply and allow floats,
            // but should be rounded when showing it.
            this.attrs.tHealth = this.attrs.tHealth * Const.levelIncrement;
            this.attrs.tFood = this.attrs.tFood * Const.levelIncrement;
            this.attrs.speed = this.attrs.speed * Const.levelIncrement;
            this.attrs.attack = this.attrs.attack * Const.levelIncrement;
            this.attrs.defense = this.attrs.defense * Const.levelIncrement;

            $('#map').trigger('user:levelup', [level]);
        },

        updateState: function(params) {
            // This updates the current values.

            // Limited to tFood.
            if (typeof params.cFood !== "undefined") {
                this.state.cFood = params.cFood;
                if (this.state.cFood > this.attrs.tFood) {
                    this.state.cFood = this.attrs.tFood;
                    // TODO popover if life starts draining.
                }
            }

            // Limited to tHealth.
            if (typeof params.cHealth !== "undefined") {
                this.state.cHealth = params.cHealth;
                if (this.state.cHealth > this.attrs.tHealth) {
                    this.state.cHealth = this.attrs.tHealth;
                }
            }

            // Food and health zero limits.
            if (this.state.cFood < 0) {
                this.state.cFood = 0;
                this.state.cHealth--;
            }
            if (this.state.cHealth <= 0) {
                this.state.cHealth = 0;
                this.dead();
            }

            // Limited to 0.
            // TODO Prevent buying stuff if 0 money.
            if (typeof params.cWealth !== "undefined") {
                this.state.cWealth = params.cWealth;
                if (this.state.cWealth < 0) {
                    this.state.cWealth = 0;
                }
            }

            this.controls.update(this.state, this.attrs);
        },

        isDead: function() {
            if (this.state.cHealth <= 0) {
                return true;
            }
            return false;
        },

        dead: function() {
            this.router.clearRoute();
            clearInterval(this.foodTimeTimer);
            $('#status-title').html('Game over');
            $('#status-content').html('You died! Try again loser.');
            $('#status').modal('show');
        }

    };

    return User;
});
