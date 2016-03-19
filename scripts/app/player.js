var ripple = ripple || {};  // namespace

ripple.player = (function () {

    var selectedTeam = null,
        selectedTeamName = null,
        gamePolling = null,
        gamePollingLimiter = null,
        timestampMoment,
        gameEndMoment,
        gameDuration,
        gameStartBuffer = 5,
        getGameUrl = 'https://jljbi2jkfj.execute-api.us-east-1.amazonaws.com/prod/game',
        postScoreUrl = 'https://jljbi2jkfj.execute-api.us-east-1.amazonaws.com/prod/score',
        getScoresUrl = 'https://jbdlsmg8cc.execute-api.us-east-1.amazonaws.com/prod/scorescanner',
        epoch = '1979-12-11 00:00:00';

    // public api
    return {
        initialize: initialize
    };

    function initialize() {
        initializeFullScreenMode();
        initializeGamePlay();
        bindStartButtonBehavior();
        bindPickTeamButtonBehavior();
    }

    function bindStartButtonBehavior() {
        $(document).on('click.start', '.splash .start', function (event) {
            event.preventDefault();
            $('.splash').addClass('hide');
            setTimeout(function () {
                if (selectedTeam && selectedTeamName) {
                    $('.button.' + selectedTeamName).addClass('selected')
                    $('.pick').addClass('waiting');
                    startGamePolling();
                }
                $('.pick').removeClass('hide');
            }, 250);
        });
    }

    function bindPickTeamButtonBehavior() {
        $(document).on('click.pick', '.pick .button', function (event) {
            event.preventDefault();
            selectedTeam = $(this).data('team');
            selectedTeamName = $(this).data('teamname');
            $(this).addClass('selected');
            $('.pick').addClass('waiting');
            startGamePolling();
        });
    }

    function startGamePolling() {
        gamePolling = setInterval(checkForGame, 3000);
        gamePollingLimiter = setTimeout(cancelGamePolling, 5*60*1000); // give up after five minutes

        function checkForGame() {
            $.ajax({
                url: getGameUrl,
                type: 'GET',
                success: function (response) {
                    var secondsRemaining;

                    if (response && response.time !== epoch) {
                        timestampMoment = moment(response.time + ' +00:00', 'YYYY-MM-DD HH:mm:ss.SSSSSS Z');
                        gameDuration = response.duration;
                        gameEndMoment = timestampMoment.clone().add(gameStartBuffer + gameDuration, 'seconds');
                        secondsRemaining = gameEndMoment.diff(moment(), 'seconds');

                        if (gameEndMoment.isAfter(moment()) && secondsRemaining <= gameDuration) {
                            clearInterval(gamePolling);
                            clearTimeout(gamePollingLimiter);
                            showGame();
                            setTimeout(showResults, secondsRemaining * 1000);
                        }
                    }
                }
            });
        }

        function cancelGamePolling() {
            clearTimeout(gamePolling);
            resetGame();
        }
    }

    function resetGame(rememberTeamSelection) {
        showSplash();

        if (!rememberTeamSelection) {
            selectedTeam = null;
            selectedTeamName = null;
        }

        $('.pick .button').removeClass('selected');
        $('.pick').removeClass('waiting');
    }

    function showGame() {
        hideAllBut('.play');
    }

    function showSplash() {
        hideAllBut('.splash');
    }

    function showResults() {
        $.ajax({
            url: getScoresUrl,
            type: 'GET',
            success: function (response) {

                if (isWinner(response)) {
                    hideAllBut('.winner.' + selectedTeamName);
                } else {
                    hideAllBut('.loser');
                }

                setTimeout(showSplash, 10000);

                function isWinner(teamScores) {
                    var playerTeamScore = getPlayerTeamScore(teamScores);

                    return (teamScores || [])
                        .filter(function (teamScore) {
                            return teamScore.team !== selectedTeam;
                        })
                        .every(function (teamScore) {
                            return playerTeamScore > 0 && playerTeamScore >= teamScore.score;
                        });
                }

                function getPlayerTeamScore(teamScores) {
                    return (teamScores || [])
                            .filter(function (teamScore) {
                                return teamScore.team === selectedTeam;
                            })
                            .map(function (teamScore) {
                                return teamScore.score;
                            })[0] || 0;
                }
            }
        });
    }

    function hideAllBut(show) {
        var selectors = ['.splash', '.pick', '.play', '.winner.turtles', '.winner.ducks', '.winner.frogs', '.loser'];

        selectors.forEach(function (selector) {
            if (selector !== show) {
                $(selector).addClass('hide');
            }
        });

        $(show).removeClass('hide');
    }

    function initializeFullScreenMode() {
        /* Android Browser hack */
        window.addEventListener('load', function () {
            window.scrollTo(0, 0);
        });

        // use this with care, only if you don't have overflow content to be scrolled.
        $(document).on('touchmove', function (e) {
            e.preventDefault()
        });
    }

    function initializeGamePlay() {
        var validThrow = false;

        // target elements with the "draggable" class
        interact('.draggable')
            .draggable({
                // enable inertial throwing
                inertia: {
                    allowResume: false,
                    resistance: 5,
                    minSpeed: 100,
                    endSpeed: 50
                },
                // keep the element within the area of it's parent
                restrict: {
                    restriction: 'parent',
                    endOnly: true,
                    elementRect: {top: 0, left: 0, bottom: 1, right: 1}
                },
                // call this function on every dragmove event
                onmove: dragMoveListener,
                // call this function on every draginertiastart event
                oninertiastart: dragInertiaStartListener,
                // call this function on every dragend event
                onend: dragEndListener
            });

        function dragMoveListener(event) {
            var target = event.target,
            // keep the dragged position in the data-x/data-y attributes
                x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            // translate the element
            target.style.webkitTransform =
                target.style.transform =
                    'translate(' + x + 'px, ' + y + 'px)';

            // update the position attributes
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);

            if (isInsideTarget('.target.one-point', 100) && !validThrow) {
                $('.target').addClass('too-close');
            } else {
                $('.target').removeClass('too-close');
            }
        }

        function dragInertiaStartListener(event) {
            if (!isInsideTarget('.target.one-point', 100)) {
                validThrow = true;
            }
        }

        function dragEndListener(event) {
            var $stone = $('.stone');

            if (!isOnDock()) {
                $stone.addClass('sink');
                setTimeout(resetStone, 1000);

                if (validThrow) {
                    if (isInsideTarget('.target.three-point')) {
                        $stone.addClass('three');
                        postScore(selectedTeam, 3);
                    } else if (isInsideTarget('.target.two-point')) {
                        $stone.addClass('two');
                        postScore(selectedTeam, 2);
                    } else if (isInsideTarget('.target.one-point')) {
                        $stone.addClass('one');
                        postScore(selectedTeam, 1);
                    }
                }
            }

            function postScore(team, points) {
                $.ajax({
                    url: postScoreUrl,
                    type: 'POST',
                    processData: false,
                    data: JSON.stringify({
                        team: team,
                        score: points
                    })
                });
            }
        }

        function isOnDock() {
            var stone = getCenterCoordinates($('.stone')[0]),
                dock = $('.dock')[0].getBoundingClientRect();

            return stone.x > dock.left && stone.x < dock.right && stone.y > dock.top;
        }

        function isInsideTarget(selector, buffer) {
            var target = getCenterCoordinates($(selector)[0]),
                stone = getCenterCoordinates($('.stone')[0]),
                buffer = buffer || 0;

            return Math.sqrt(Math.pow(stone.x - target.x, 2) + Math.pow(stone.y - target.y, 2)) < target.r + buffer;
        }

        function getCenterCoordinates(element) {
            var rectangle = element.getBoundingClientRect(),
                radius = rectangle.height / 2,
                x = rectangle.left + radius,
                y = rectangle.top + radius;

            return {
                r: radius,
                x: x,
                y: y
            };
        }

        function resetStone() {
            var $stone = $('.stone');

            $stone.css('transform', 'translate(0px, 0px)');
            $stone.attr('data-x', 0);
            $stone.attr('data-y', 0);
            $stone.removeClass('sink');
            $stone.removeClass('one');
            $stone.removeClass('two');
            $stone.removeClass('three');

            $('.target').removeClass('too-close');
            validThrow = false;
        }

        // this is used later in the resizing and gesture demos
        //window.dragMoveListener = dragMoveListener;
    }
})();