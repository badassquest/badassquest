define(['bs', 'Chase', 'UI'], function($, Chase, UI) {

    /**
     * Static var to identify chases.
     *
     * @static
     * @type {!number}
     * @type {User}
     */
    var index = 0;

    var chaseInfoShown = false;

    function ChaseTracker(map, user) {
        this.map = map;
        this.user = user;

        $('#map').on('chase:add', this.addChase.bind(this));
        $('#map').on('chase:remove', this.remove.bind(this));
        $('#map').on('chase:caught', this.caught.bind(this));
    }

    ChaseTracker.prototype = {

        map: null,
        user: null,
        chases: {},

        /**
         * Adds a marker chasing the user.
         *
         * @param {Event} ev
         * @param {Object} chaseData Should include a speed and (duration or reRouteLimit) + a callback if the user is caught.
         */
        addChase: function(ev, chaseData) {

            if (chaseInfoShown === false) {
                var content = '<h1>Tip</h1><p>Police <i class="fa fa-shield" style="color: #4169E1;"></i> is coming to chase you, ' +
                    'better go far from here as soon as possible. You need to level up to run faster.</p>' + UI.renderOkButton('Continue', 'btn btn-warning');
                UI.showModal(content);

                $('#ok').on('click', function(ev) {
                    $('#text-action').modal('hide');
                    this.add(chaseData);
                }.bind(this));

                chaseInfoShown = true;
            } else {

                // Ensure modal window is closed at this stage.
                $('#text-action').modal('hide');
                this.add(chaseData);
            }

        },

        add: function(chaseData) {

            if (typeof chaseData.speed === "undefined") {
                console.error('Chase data should include the speed.');
                return;
            }

            if (typeof chaseData.duration === "undefined" && typeof chaseData.reRouteLimit === "undefined") {
                console.error('Chase data should include the duration or the reRouteLimit.');
                return;
            }

            if (typeof chaseData.caughtCallback === "undefined") {
                console.error('Chase data should include a caughtCallback.');
                return;
            }

            chaseData.id = index;
            var chase = new Chase(this.map, this.user, chaseData);
            chase.start();

            this.chases[index] = chase;

            index++;
        },

        remove: function(ev, id) {
            this.chases[id] = null;
            delete this.chases[id];
        },

        caught: function(ev) {

            // Stop and remove all chases.
            this.user.router.stop();

            for(var id in this.chases) {
                if (this.chases.hasOwnProperty(id)) {
                    this.chases[id].stop();
                    this.chases[id] = null;
                    delete this.chases[id];
                }
            }
        }
    };

    return ChaseTracker;
});
