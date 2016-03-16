(function() {
    $(document).ready(function() {

        var timestampMoment,
            gameEndMoment,
            gameDuration,
            gameStartBuffer = 5,
            getGameUrl = 'https://jljbi2jkfj.execute-api.us-east-1.amazonaws.com/prod/game',
            startGameUrl = 'https://jljbi2jkfj.execute-api.us-east-1.amazonaws.com/prod/start',
            resetUrl = 'https://mzupek0wyg.execute-api.us-east-1.amazonaws.com/prod/scoreclear',
            getScoresUrl = 'https://jbdlsmg8cc.execute-api.us-east-1.amazonaws.com/prod/scorescanner',
            scoreboardPolling,
            epoch = '1979-12-11 00:00:00';

        initialize();

        function initialize() {
            initializePageState();
            initializeStartButtonBehavior();
            initializeResetButtonBehavior();
        }

        function initializePageState() {
            $.ajax({
                url: getGameUrl,
                type: 'GET',
                success: function(response) {
                    if (response && response.time !== epoch) {
                        timestampMoment = moment(response.time + ' +00:00', 'YYYY-MM-DD HH:mm:ss.SSSSSS Z');
                        gameDuration = response.duration;
                        gameEndMoment = timestampMoment.clone().add(gameStartBuffer + gameDuration, 'seconds');

                        if (gameEndMoment.isAfter(moment())) {
                            showScoreboard();
                            startScoreboardPolling();
                        } else {
                            showResults();
                        }
                    } else {
                        showStart();
                    }
                }
            });
        }

        function initializeStartButtonBehavior() {
            $(document).on('click.start', '.start-game', function(event) {
                event.preventDefault();
                $('.start').addClass('hide');
                $.ajax({
                    url: startGameUrl,
                    type: 'POST',
                    processData: false,
                    data: JSON.stringify({
                        level: 1,
                        duration: 120
                    }),
                    success: function(response) {
                        initializePageState();
                    }
                })
            });
        }

        function initializeResetButtonBehavior() {
            $(document).on('click.reset', '.reset-game', function(event) {
                event.preventDefault();
                $.ajax({
                    url: resetUrl,
                    type: 'GET',
                    success: function(response) {
                        timestampMoment = null;
                        gameEndMoment = null;
                        showStart();
                    }
                })
            });
        }

        function showStart() {
            hideAllBut('.start');
            $('.start').removeClass('hide');
        }

        function showScoreboard() {
            hideAllBut('.scoreboard');
            $('.scoreboard').removeClass('hide');
        }

        function showResults() {
            hideAllBut('.results');
            $('.results').removeClass('hide');
        }

        function hideAllBut(show) {
            var selectors = ['.start', '.scoreboard', '.results'];

            selectors.forEach(function (selector) {
                if (selector !== show) {
                    $(selector).addClass('hide');
                }
            })
        }

        function startScoreboardPolling() {
            scoreboardPolling = setInterval(getScores, 1000);

            function getScores() {
                $.ajax({
                    url: getScoresUrl,
                    type: 'GET',
                    success: function(response) {
                        updateCountdown();
                        updateScores(response);
                        if (gameEndMoment.isBefore(moment())) {
                            clearInterval(scoreboardPolling);
                        }
                    }
                });
            }

            function updateCountdown() {
                var $countdown = $('.scoreboard .countdown span'),
                    secondsRemaining = gameEndMoment.diff(moment(), 'seconds'),
                    displayMinutes = '00',
                    displaySeconds = '00';

                secondsRemaining = secondsRemaining > gameDuration ? gameDuration : secondsRemaining;

                if (secondsRemaining >= 0) {
                    displayMinutes = padNumber(parseInt(secondsRemaining / 60));
                    displaySeconds = padNumber(parseInt(secondsRemaining % 60));
                }

                $countdown.html(displayMinutes + ':' + displaySeconds);

                function padNumber(number) {
                    return ('' + number).length < 2 ? '0' + number : number;
                }
            }

            function updateScores(scores) {
                var $turtlesScore = $('.scoreboard .team.turtles .score'),
                    $frogsScore = $('.scoreboard .team.frogs .score'),
                    $ducksScore = $('.scoreboard .team.ducks .score');

                $turtlesScore.html(getScoreForTeam(scores, "A"));
                $ducksScore.html(getScoreForTeam(scores, "B"));
                $frogsScore.html(getScoreForTeam(scores, "C"));

                function getScoreForTeam(scores, team) {
                    var matches = (scores || [])
                        .filter(function (score) {
                            return score.team === team;
                    });

                    if (matches.length > 0){
                        return matches[0].score;
                    }
                }



            }
        }
    });
})();