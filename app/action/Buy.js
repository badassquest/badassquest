define(['bs', 'Const', 'Util', 'Generator', 'UI', 'action/Base'], function($, Const, Util, Generator, UI, ActionBase) {

    ActionBuy.prototype = Object.create(ActionBase.prototype);

    function ActionBuy(user, game, marker, poiData) {
        ActionBase.call(this, user, game, marker, poiData);
        return this;
    }

    ActionBuy.prototype.getVisibleName = function() {
        return 'Buy it';
    }

    ActionBuy.prototype.poiPrice = null;
    ActionBuy.prototype.poiRevenue = null;

    ActionBuy.prototype.render = function() {

        // Renderer promise.
        var rendererPromise = $.Deferred();

        // Get the header.
        var headerPromise = this.printHeader();

        this.poiPrice = Generator.poiPrice(this.poiData);

        // Not all pois generates revenue.
        this.poiRevenue = Generator.poiRevenues(this.poiData, this.poiPrice);

        var text = 'Soooo, interested in buying isn\'t it? I would not sell it for ' +
            'less than <strong>$' + this.poiPrice + '</strong>.';
        if (this.poiRevenue) {
            text += ' You would get a <strong>$' + this.poiRevenue + ' revenue every ' + Math.round(Const.revenuesInterval / 1000) + ' seconds.</strong>';
        }

        // Once we have the header we concat the body and resolve the renderer promise.
        headerPromise.done(function(html) {
            html = html + '<div id="buy-info" class="info-box">' + text + '</div>' +
            UI.renderActionButtons([
                {
                    id: 'buy',
                    text: 'Buy'
                }, {
                    id: 'cancel',
                    text: 'I don\'t want it'
                }

            ]);
            rendererPromise.resolve(html);
        }.bind(this));

        return rendererPromise;
    };

    ActionBuy.prototype.rendered = function() {

        $('#buy').on('click', function(ev) {

            if (this.user.state.cWealth < this.poiPrice) {
                $('#buy-info').html("<p>You can not afford it mate, get out.</p>");
                return;
            }

            this.closeAction(ev);

            this.user.updateState({
                cWealth: this.user.state.cWealth - this.poiPrice
            });

            // Some experience based on the price, but not much.
            this.user.addExperience(Math.round(this.poiPrice / 100));

            this.user.addProperty({
                poiData: this.poiData,
                marker: this.marker,
                revenue: this.poiRevenue
            });

        }.bind(this));

        $('#cancel').on('click', function(ev) {
            this.closeAction(ev);
        }.bind(this));


    };

    return ActionBuy;
});