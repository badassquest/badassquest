define(['bs', 'Const', 'Util'], function($, Const, Util) {

    // Bunch of static methods.
    return {

        /**
         * This returns a promise in case we want to use an external service in future.
         * @return Promise
         */
        getRandomPersonImage: function() {
            var promise = new $.Deferred();
            var index = Util.getRandomIndex(Const.picsNum);
            promise.resolve('img/people/' + index + '.jpg');
            return promise;
        },

        /**
         * @return Promise
         */
        getWikipediaInfo: function(name) {
            var promise = new $.Deferred();

            $.getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&callback=?&exintro=&explaintext=1&exsentences=3&titles=' + name)
                .done(function(data) {
                    var pageKey = Object.keys(data.query.pages)[0];
                    if (pageKey === "-1") {
                        // This page does not have a wikipedia page.
                        promise.reject();
                        return;
                    }

                    // Skip disambiguations.
                    if (data.query.pages[pageKey].extract.indexOf('may refer to') === -1) {
                        promise.reject();
                        return;
                    }

                    promise.resolve(data.query.pages[pageKey].extract);
                    return;
                });

            return promise;
        },

        getStreetViewImage: function(position, width, height) {

            if (!width || !height) {
                var size = Util.getImageSize();

                if (!width) {
                    width = size.width;
                }
                if (!height) {
                    height = size.height;
                }
            }

            return 'https://maps.googleapis.com/maps/api/streetview?size=' + width + 'x' + height + '&location=' + position + '&pitch=10'
        }
    }
});
