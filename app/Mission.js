define(['bs', 'InfoWindow'], function($, InfoWindow) {

    function Mission(data) {

        if (data.position) {
            this.position = new google.maps.LatLng(data.position);
        }
        if (data.name) {
            this.name = data.name;
        }
        if (data.icon) {
            this.icon = data.icon;
        }
        if (data.placeid) {
            this.placeid = data.placeid;
        }

        if (data.infoMessage) {
            this.infoMessage = data.infoMessage;
        }
        if (data.doneMessage) {
            this.doneMessage = data.doneMessage;
        }
        if (data.reward) {
            this.reward = data.reward;
        }

        // Info to be displayed, might change during the step life.
        if (data.content) {
            this.content = data.content;
        }

        if (data.cleanMission) {
            this.cleanMission = data.cleanMission;
        }

        if (data.process) {
            this.process = data.process;
        }

        return this;
    }

    Mission.prototype = {

        user: null,
        game: null,
        infoWindow: null,

        // Static data.
        position: null,
        name: null,
        icon: null,
        placeid: null,

        infoMessage: null,
        doneMessage: null,
        reward: null,

        // Mission process, a single function to manage everything, on complex workflows
        // would probably need to set new attributes.
        process: null,

        // Set to true to completely remove the step from the map once finished.
        cleanMission: false,

        // Is the step completed?.
        completed: false,

        // Callback to execute once the step is completed.
        completedCallback: null,

        // Info to display when the user clicks on the marker, this might change during
        // the step depending on its needs. Unset if no content should be displayed.
        content: null,

        setCompletedCallback: function(callback) {
            this.completedCallback = callback;
        },

        setUser: function(user) {
            this.user = user;
        },

        setGame: function(game) {
            this.game = game;
        },

        getContents: function() {
            return this.content;
        },

        execute: function() {
            if (this.process !== null) {
                return this.process(this.complete.bind(this));
            }
            // If the step does not pass any execute function just mark as completed.
            this.complete();
        },

        cleanIt: function() {
            return this.cleanMission;
        },

        complete: function() {
            this.completed = true;

            if (this.reward) {
                this.user.updateState({
                    cWealth: this.user.state.cWealth + parseInt(this.reward)
                });
            }

            this.completedCallback(this);
        },

        isCompleted: function() {
            return this.completed;
        }
    };
    return Mission;
});
