var ripple = ripple || {};  // namespace

ripple.organizer = (function () {

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

    // public api
    return {
        initialize: initialize
    };

    function initialize() {
        initializePageState();
        initializeStartButtonBehavior();
        initializeResetButtonBehavior();
    }

    function initializePageState() {
        $.ajax({
            url: getGameUrl,
            type: 'GET',
            success: function (response) {
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
        $(document).on('click.start', '.start-game', function (event) {
            event.preventDefault();
            $('.start').addClass('hide');
            $.ajax({
                url: startGameUrl,
                type: 'POST',
                processData: false,
                data: JSON.stringify({
                    level: 1,
                    duration: 60
                }),
                success: function (response) {
                    initializePageState();
                }
            })
        });
    }

    function initializeResetButtonBehavior() {
        $(document).on('click.reset', '.reset-game', function (event) {
            event.preventDefault();
            $.ajax({
                url: resetUrl,
                type: 'GET',
                success: function (response) {
                    timestampMoment = null;
                    gameEndMoment = null;
                    resetScores();
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

        $.ajax({
            url: getScoresUrl,
            type: 'GET',
            success: function (response) {
                updateResults(response);
                $('.results').removeClass('hide');
            }
        });

        function updateResults(scores) {
            var $turtlesScore = $('.results .team.turtles .score'),
                $frogsScore = $('.results .team.frogs .score'),
                $ducksScore = $('.results .team.ducks .score');

            $turtlesScore.html(getScoreForTeam(scores, 'A'));
            $('.results .team.turtles')
                .removeClass('first second third')
                .addClass(getRankForTeam(scores, 'A'));

            $ducksScore.html(getScoreForTeam(scores, 'B'));
            $('.results .team.ducks')
                .removeClass('first second third')
                .addClass(getRankForTeam(scores, 'B'));

            $frogsScore.html(getScoreForTeam(scores, 'C'));
            $('.results .team.frogs')
                .removeClass('first second third')
                .addClass(getRankForTeam(scores, 'C'));

            function getScoreForTeam(scores, team) {
                var matches = (scores || [])
                    .filter(function (score) {
                        return score.team === team;
                    });

                if (matches.length > 0) {
                    return matches[0].score;
                }
            }

            function getRankForTeam(scores, team) {
                var rankedTeamScores = (scores || [])
                    .sort(function (a, b) {
                        if (a.score > b.score) {
                            return -1;
                        } else if (a.score < b.score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });

                if (rankedTeamScores[0].team === team) {
                    return 'first';
                } else if (rankedTeamScores[1].team === team) {
                    return 'second';
                } else {
                    return 'third';
                }
            }
        }
    }

    function hideAllBut(show) {
        var selectors = ['.start', '.scoreboard', '.results'];

        selectors.forEach(function (selector) {
            if (selector !== show) {
                $(selector).addClass('hide');
            }
        })
    }

    function resetScores() {
        $('.scoreboard .team.turtles .score').html('--');
        $('.scoreboard .team.frogs .score').html('--');
        $('.scoreboard .team.ducks .score').html('--');
    }

    function startScoreboardPolling() {
        scoreboardPolling = setInterval(getScores, 1000);

        function getScores() {
            $.ajax({
                url: getScoresUrl,
                type: 'GET',
                success: function (response) {
                    updateCountdown();
                    updateScores(response);
                    if (gameEndMoment.isBefore(moment())) {
                        clearInterval(scoreboardPolling);
                        showResults();
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

                if (matches.length > 0) {
                    return matches[0].score;
                }
            }
        }
    }
})();