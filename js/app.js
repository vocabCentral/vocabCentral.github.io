'use-strict';
var progress = 0;
var app = angular.module('VocabApp', ['ngSanitize', 'ui.router', 'ui.bootstrap', 'firebase'])
.config(function($stateProvider, $urlRouterProvider){
	$urlRouterProvider.otherwise('/');
	$stateProvider
		.state('home', {
			url: '/', //"root" directory
			templateUrl: 'partials/home.html',
			controller: 'LoginCtrl'
		})
		.state('signIn', {
			url: '/sign-in',
			templateUrl: 'partials/signIn.html',
			controller: 'LoginCtrl'
		})
		.state('signUp', {
			url:'/sign-up',
			templateUrl: 'partials/signUp.html',
			controller: 'LoginCtrl'
		})
		.state('learnMore', {
			url: '/',
			templateUrl: 'partials/learnMore.html',
			controller: 'LoginCtrl'
		})
		.state('dashboard', {
			url: '/dashboard',
			templateUrl: 'partials/dashboard.html',
			controller: 'LoginCtrl'
		})
		.state('quiz', {
			url: '/quiz',
			templateUrl: 'partials/quiz.html',
			controller: 'LoginCtrl'
		})
})


// Controls the homepage and login/signup screens
.controller('LoginCtrl', ['$scope', '$http', '$firebaseObject','$firebaseArray', '$firebaseAuth','$location', 'quizFactory', function($scope, $http, $firebaseObject,$firebaseArray, $firebaseAuth, $location, quizFactory) {

	/* define reference to your firebase app */


	var ref = new Firebase("https://343-group-project.firebaseio.com/");


	/* define reference to the "users" value in the app */
	var usersRef = ref.child("users");

	/* create a $firebaseObject for the users reference and add to scope (as $scope.users) */
	$scope.users = $firebaseObject(usersRef);

	//for sign-in
	$scope.newUser = {};

	/* Authentication */
	var Auth = $firebaseAuth(ref);

	$scope.signUp = function() {
		//Create user
		Auth.$createUser({
			'email': $scope.newUser.email,
			'password': $scope.newUser.password
		})

		// Once the user is created, call the logIn function
		.then($scope.signIn)

		// Once logged in, set and save the user data
		.then(function(authData) {
			console.log("logged in");

			var newUserInfo = {
				'firstname': $scope.newUser.firstname,
	    		'lastname': $scope.newUser.lastname,
	    		'levelOneScore': 0,
	    		'levelTwoScore': 0,
	    		'levelThreeScore': 0,
	    		'levelFourScore': 0,
	    		'levelFiveScore': 0
			};

			$scope.users[authData.uid] = newUserInfo;

			$scope.userId = authData.uid; //save userId
			$scope.users[authData.uid] = { //set up new information in our users object
				firstname: $scope.newUser.firstname,
	    		lastname: $scope.newUser.lastname,
	    		levelOneScore: 0,
	    		levelTwoScore: 0,
	    		levelThreeScore: 0,
	    		levelFourScore: 0,
	    		levelFiveScore: 0
			}
			//$scope.users[authData.uid] = newUserInfo;
			/* assign authData.uid to $scope.userId for our views to see */
			//$scope.userId = authData.uid;
			/* call .$save() on the $scope.users object to save to the cloud */
			$scope.users.$save();
		})

		//Catch any errors
		.catch(function(error){
			//error handling (called on the promise)
			console.log(error);
		})
	};
	// End signUp

	//LogIn function
	$scope.signIn = function() {
		console.log('log in')
		return Auth.$authWithPassword({
	    	email: $scope.newUser.email,
	    	password: $scope.newUser.password
  		})

		//Catch any errors
		.catch(function(error) {
			console.log(error);
		})
	};
	// End signIn

	//Make LogOut function available to views
	$scope.logOut = function() {
	   Auth.$unauth(); //"unauthorize" to log out
	};
	// End logOut

	$scope.setDifficulty = function(difficulty) {
		console.log("Setting difficulty to " + difficulty + "!");
		quizFactory.setDifficulty(difficulty);
	};

	//Any time auth status updates, set the userId so we know
	Auth.$onAuth(function(authData) {
	   if(authData) { //if we are authorized
	      $scope.userId = authData.uid;
	   }
	   else {
	      $scope.userId = undefined;
	   }
	});

	//Test if already logged in (when page load)
	var authData = Auth.$getAuth(); //get if we're authorized
	if(authData) {
	   $scope.userId = authData.uid;
	}
}])

.directive('nxEqualEx', function() {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, model) {
            if (!attrs.nxEqualEx) {
                console.error('nxEqualEx expects a model as an argument!');
                return;
            }
            scope.$watch(attrs.nxEqualEx, function (value) {
                // Only compare values if the second ctrl has a value.
                if (model.$viewValue !== undefined && model.$viewValue !== '') {
                    model.$setValidity('nxEqualEx', value === model.$viewValue);
                }
            });
            model.$parsers.push(function (value) {
                // Mute the nxEqual error if the second ctrl is empty.
                if (value === undefined || value === '') {
                    model.$setValidity('nxEqualEx', true);
                    return value;
                }
                var isValid = value === scope.$eval(attrs.nxEqualEx);
                model.$setValidity('nxEqualEx', isValid);
                return isValid ? value : undefined;
            });
        }
    };
})

.directive('quiz', ['quizFactory', '$firebaseObject','$firebaseArray', '$firebaseAuth', function(quizFactory, $firebaseObject, $firebaseArray, $firebaseAuth) {

	return {
		restrict: 'AE',
		scope: {},
		templateUrl: 'template.html',
		link: function(scope, elem, attrs) {
			var ref = new Firebase("https://343-group-project.firebaseio.com/");

			/* define reference to the "users" value in the app */
			var usersRef = ref.child("users");

			/* create a $firebaseObject for the users reference and add to scope (as $scope.users) */
			scope.users = $firebaseObject(usersRef);

			scope.start = function() {
				scope.id = 0;
				scope.quizOver = false;
				scope.inProgress = true;
				scope.getQuestion();
			};

			scope.reset = function() {
				scope.inProgress = false;
				scope.score = 0;
				progress = 0;
			}

			scope.getQuestion = function() {
				var q = quizFactory.getQuestion(scope.id);
				if(q) {
					scope.question = q.question;
					scope.options = q.options;
					scope.answer = q.answer;
					scope.answerMode = true;
				} else {
					scope.quizOver = true;
				}
			};

			scope.checkAnswer = function() {
				if(!$('input[name=answer]:checked').length) return;

				var ans = $('input[name=answer]:checked').val();

				if(ans == scope.options[scope.answer]) {
					scope.score++;
					scope.correctAns = true;
				} else {
					scope.correctAns = false;
				}
				progress++;
				console.log(progress);
				scope.answerMode = false;
			};

			scope.nextQuestion = function() {
				scope.id = quizFactory.returnId() + 1;
				scope.getQuestion();
			}

			scope.saveScore = function() {
				var authData = ref.getAuth();
				var quizDifficulty = quizFactory.getDifficulty();
				console.log(quizDifficulty);
				if (quizDifficulty == 1) {

					scope.users[authData.uid].levelOneScore = scope.score;

				} else if (quizDifficulty == 2) {

					scope.users[authData.uid].levelTwoScore = scope.score;

				} else if (quizDifficulty == 3) {

					scope.users[authData.uid].levelThreeScore = scope.score;

				} else if (quizDifficulty == 4) {

					scope.users[authData.uid].levelFourScore = scope.score;

				} else {
					scope.users[authData.uid].levelFiveScore = scope.score;
				}
				scope.users.$save();
			}

			scope.reset();
		}
	}
}]);f

app.factory('quizFactory', function() {

	var quizDifficulty = 1;

	var questions = [
		{
			id: 0,
			question: "Insect",
			options: ["bug", "fish",  "dog"],
			difficulty: 1,
			answer: 0
		},
		{
			id: 1,
			question: "Plant",
			options: ["snake", "flower", "bug"],
			difficulty: 1,
			answer: 1
		},
		{
			id: 2,
			question: "Animal",
			options: ["car", "water", "horse"],
			difficulty: 1,
			answer: 2
		},
		{
			id: 3,
			question: "Dinosaur",
			options: ["leaf", "t-rex", "tree"],
			difficulty: 1,
			answer: 1
		},
		{
			id: 4,
			question: "Vegetable",
			options: ["carrot", "fish", "milk"],
			difficulty: 1,
			answer: 0
		}, //5
		{
			id: 5,
			question: "Trust",
			options: ["an important question at is in dispute and must be settled", "complete confidence in a person", "some situtation that is thought about"],
			difficulty: 2,
			answer: 1
		},
		{
			id: 6,
			question: "Create",
			options: ["discuss pros and cons of an issue", "touch lightly and briefly", "make by artistic means"],
			difficulty: 2,
			answer: 2
		},
		{
			id: 7,
			question: "Expected",
			options: ["dim", "likely", "gracious"],
			difficulty: 2,
			answer: 1
		},
		{
			id: 8,
			question: "Possible",
			options: ["achieveable", "excellent", "desireable"],
			difficulty: 2,
			answer: 0
		},
		{
			id: 9,
			question: "Doubt",
			options: ["degree of exposure to public notice", "state of surviving", "being unsure"],
			difficulty: 2,
			answer: 2
		}, //10
		{
			id: 10,
			question: "Complete",
			options: ["bring to a finish or end", "engage in rehearsal", "make bigger"],
			difficulty: 3,
			answer: 0
		},
		{
			id: 11,
			question: "Remark",
			options: ["obtain", "note", "trade"],
			difficulty: 3,
			answer: 1
		},
		{
			id: 12,
			question: "Success",
			options: ["an event that accomplishes its intended task", "a dispute", "act of gracious kindness"],
			difficulty: 3,
			answer: 0
		},
		{
			id: 13,
			question: "Command",
			options: ["act of forcing out someone", "act of acceding to demands", "power to order others"],
			difficulty: 3,
			answer: 2
		},
		{
			id: 14,
			question: "Evident",
			options: ["acted upon", "clearly revealed to the mind or the senses", "ready and willing or quick to act"],
			difficulty: 3,
			answer: 1
		}, //15
		{
			id: 15,
			question: "Certain",
			options: ["plain and pretentious", "established irrevocably", "regularly and widely used or sold"],
			difficulty: 4,
			answer: 1
		},
		{
			id: 16,
			question: "Solitary",
			options: ["single and isolated from others", "not favored by fortune", "conspicuously and outrageously bad"],
			difficulty: 4,
			answer: 0
		},
		{
			id: 17,
			question: "Concern",
			options: ["direct the course of", "come near in time", "be on the mind of"],
			difficulty: 4,
			answer: 2
		},
		{
			id: 18,
			question: "Surprises",
			options: ["enlightens ", "cautions", "astonishes"],
			difficulty: 4,
			answer: 2
		},
		{
			id: 19,
			question: "Disbanded",
			options: ["stopped functioning or cohering as a unit", "gave a performance", "exhanged information or ideas"],
			difficulty: 4,
			answer: 0
		}, //20
		{
			id: 20,
			question: "Attempted",
			options: ["essayed", "authorized", "experienced"],
			difficulty: 5,
			answer: 0
		},
		{
			id: 21,
			question: "Effect",
			options: ["an addition to the length of something", "the state of something that has been unused", "a phenomenon that is caused by some previous phenomenon"],
			difficulty: 5,
			answer: 2
		},
		{
			id: 22,
			question: "Mere",
			options: ["charming", "boring", "simple"],
			difficulty: 5,
			answer: 2
		},
		{
			id: 23,
			question: "Table",
			options: ["detach", "postpone", "scatter"],
			difficulty: 5,
			answer: 1
		},
		{
			id: 24,
			question: "Grave",
			options: ["displaying great enthusiasm", "dignified and somber in manner or character", "marked by complexity and richness of detail"],
			difficulty: 5,
			answer: 1
		},
		{
			id: 25,
			question: "Fancy",
			options: ["alluring", "modern", "adorned"],
			difficulty: 5,
			answer: 2
		} //25
	];

	var setDifficulty = function(difficulty) {
		quizDifficulty = difficulty;
	};

	var getDifficulty = function() {
		return quizDifficulty;
	};

	var scopeId = 0;

	var getQuestion = function(id) {
		while(id < questions.length) {
			if(questions[id].difficulty == quizDifficulty) {
				scopeId = id;
				return questions[id];
			} else {
				id++;
			}
		}
		return false;
	};

	var returnId = function() {
		return scopeId;
	}

	return {
		getQuestion: getQuestion,
		setDifficulty: setDifficulty,
		getDifficulty: getDifficulty,
		returnId: returnId
	};
});
