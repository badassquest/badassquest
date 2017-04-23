requirejs.config({
    baseUrl: 'app',
    paths: {
        fontawesomeMarkers: '../bower_components/fontawesome-markers/fontawesome-markers.min',
        jquery: '../bower_components/jquery/dist/jquery',
        bs: '../bower_components/bootstrap/dist/js/bootstrap',
        Phaser: '../bower_components/phaser/build/phaser',
        async: '../bower_components/requirejs-plugins/src/async',
        epoly: '../vendor/blackpoolchurch/v3_epoly',
        infobox: '../vendor/google/infobox',
    },
    shim: {
        bs: {
            deps: ['jquery'],
            exports: "$"
        },
        infobox: {
            deps: ['google']
        },
        epoly: {
            deps: ['google']
        }
    }
});

requirejs(['main']);
