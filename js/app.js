// I just kinda stuck the directives here. There's only one and I'm trying to keep files to a minimum.
var directives = angular.module('snake.directives', []);
directives.
directive('keypress', function($document, $rootScope) {
    return {
        restrict: 'A',
        link: function() {
            $document.bind('keydown', function(e) {
                $rootScope.$broadcast('keypress', e, String.fromCharCode(e.which));
            });
        }
    }
});

var snake = angular.module('snake', ['snake.controllers', 'snake.directives', 'ui.bootstrap']);
snake.config([
    function() {}
]);