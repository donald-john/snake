angular.module('snake.controllers',[]).controller('SnakeController',['$scope','$rootScope','$timeout','$interval','$modal', function($scope,$rootScope,$timeout,$interval,$modal){
	$rootScope.$on("$routeChangeStart", function(args, to, from){
		// not used here
	});

	var snake,food,moves,direction,growing,timer,state,GRIDSIZE,gameModal,iterations, timeInterval, milliseconds, millisecondTimer;
	$scope.score = 0;
	$scope.time;
	$scope.init = function(){
		snake = [[0,0]];
		food = [];
		moves = ['r'];
		direction = '';
		growing = false;
		state = 'play';
		GRIDSIZE = 25;
		
		clearGrid();		
		timeInterval = 155;
		iterations = 0;
		milliseconds = 0;
		timer = $timeout(gameLoop, timeInterval);
		millisecondTimer = $interval(getTime, 1);
	}

	$rootScope.$on('keypress', function(obj, key){
		if(state == 'play' || key.which == 32){
			switch(key.which) {
		        case 37: // left
		        if(moves[moves.length - 1] != 'l')
				    (moves[moves.length - 1] == 'r' || (moves.length == 0 && direction == 'r')) && snake.length > 1 ? moves.push('r') : moves.push('l');		        
		        break;

		        case 38: // up
		        if(moves[moves.length - 1] != 'u')
   		        	(moves[moves.length - 1] == 'd' || (moves.length == 0 && direction == 'd')) && snake.length > 1 ? moves.push('d') : moves.push('u');
		        break;

		        case 39: // right
		        if(moves[moves.length - 1] != 'r')
		        	(moves[moves.length - 1] == 'l' || (moves.length == 0 && direction == 'l')) && snake.length > 1 ? moves.push('l') : moves.push('r');
		        break;

		        case 40: // down
		        if(moves[moves.length - 1] != 'd')
		        	(moves[moves.length - 1] == 'u' || (moves.length == 0 && direction == 'u')) && snake.length > 1 ? moves.push('u') : moves.push('d');
		        break;

		        case 32: // spacebar
		        pause();
		        break;

		        default: return;
		    }
		}
	});

	var pause = function(){
		if(state == 'paused'){
			gameModal.dismiss();
			millisecondTimer = $interval(getTime, 1);
		}else{
			$interval.cancel(millisecondTimer);
			gameModal = $modal.open({
				templateUrl: 'pause.html',
				size: 'sm',
				controller: pauseController,
				resolve: {
					message: function(){
						return 'Paused!'
					},
					ok: function(){
						return function(){
							// Resume game 							
							state = 'play';
							gameModal.dismiss();
						}
					}
				},
			});
			$timeout.cancel(timer);
			state = 'paused';
			gameModal.result.then(function(){},
				function(){
					// Resume game 
					timer = $timeout(gameLoop, timeInterval);
					state = 'play';
				});

			$rootScope.$broadcast('save-game', {
				snake: snake,
				food: food,
				moves: moves,
				direction: direction,
				growing: growing,
				timer: timer,
				state: state,
				GRIDSIZE: GRIDSIZE,
				score: $scope.score
			});
			// Save game state
			// $scope.$parent.game = {
			// 	snake: snake,
			// 	food: food,
			// 	moves: moves,
			// 	direction: direction,
			// 	growing: growing,
			// 	timer: timer,
			// 	state: state,
			// 	GRIDSIZE: GRIDSIZE,
			// 	score: $scope.score
			// }
		}			
	}

	var clearGrid = function(){
		// Build the gameboard
		$scope.grid = [];
		var temp = [];
		var count = 0;

		for (var i = 0; i < GRIDSIZE; i++) {
			for (var j = 0; j < GRIDSIZE; j++) {
				temp.push({
					id: count,
					type: 'empty'
				});
				count++;
			};
			$scope.grid.push({
				id: i,
				blocks: temp
			});
			temp = [];
		};
	}

	// Start the game loop
	var gameLoop = function(){
		var prev;
		var temp;
		var dir = moves.shift();
		iterations++;
		if(dir != undefined)
			direction = dir;

		for (var i = 0; i < snake.length; i++) {
			if(i == 0){
				prev = [snake[i][0],snake[i][1]];
				if(prev[0] == food[0] && prev[1] == food[1]){ //check for an eat
					growing = true;
					$scope.score ++;
				}

				switch(direction){
					case "r":
						snake[i][1]++;
						break;
					case "d":
						snake[i][0]++;
						break;
					case "l":
						snake[i][1]--;
						break;
					case "u":
						snake[i][0]--;
						break;
					default:
						break;
				}
			}else{
				temp = [snake[i][0],snake[i][1]];
				snake[i] = prev;
				prev = temp;
			}
			if(growing && i == (snake.length - 1)){
				snake.push(prev);
				growing = false;					
				food = [];
			}
		};

		paint();
	}

	var paint = function(){
		if($scope.grid[snake[0][0]] == undefined || $scope.grid[snake[0][0]].blocks[snake[0][1]] == undefined || snake.length > 2 && $scope.grid[snake[0][0]].blocks[snake[0][1]].type == 'snake'){
			// out-of-bounds / intersection
			$scope.stopGame('lost');
		}else{
			clearGrid();
			for(piece in snake){				
				$scope.grid[snake[piece][0]].blocks[snake[piece][1]].type = 'snake';
			}

			function makefood(){
				if(food.length == 0){
					var x = Math.floor(Math.random()*GRIDSIZE-1) + 1;
					var y = Math.floor(Math.random()*GRIDSIZE-1) + 1;

					if($scope.grid[x].blocks[y].type != 'snake')
						food = [x,y];
				}
			}
			
			while(food.length == 0){
				makefood();
			}
			
			$scope.grid[food[0]].blocks[food[1]].type = 'food';
			timer = $timeout(gameLoop, timeInterval);
		}		
	}

	$scope.stopGame = function(reason){
		$timeout.cancel(timer);
		$interval.cancel(millisecondTimer);
		state = 'stop';
		gameModal = $modal.open({
			templateUrl: 'pause.html',
			size: 'sm',
			controller: pauseController,
			resolve: {
				message: function(){
					return 'GAME OVER!'
				},
				ok: function(){
					return function(){
						state = 'play';
						gameModal.dismiss();
						snake = [[0,0]];
						food = [];
						moves = ['r'];
						direction = '';
						growing = false;
						timer = null;
						state = 'play';
						GRIDSIZE = 25;
						$scope.score = 0;
						$scope.init();
					}
				}
			},
		}, function(){});
		gameModal.result.then(function(){},function(){
				// Resume game 
				state = 'play';
			});
	}

	var getTime = function() {
		milliseconds+=5;
		$scope.time = new Date(1970, 0, 1).setMilliseconds(milliseconds);
	}

}]);

var pauseController = function($scope, $modalInstance, message, ok){
	$scope.message = message;
	$scope.ok = ok;
}