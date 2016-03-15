(function() {
    $(document).ready(function() {

        var selectedTeam = null,
            gamePolling = null,
            timestampMoment,
            gameEndMoment,
            gameDuration,
            gameStartBuffer = 5,
            getGameUrl = 'https://jljbi2jkfj.execute-api.us-east-1.amazonaws.com/prod/game',
            postScoreUrl = 'https://jljbi2jkfj.execute-api.us-east-1.amazonaws.com/prod/score',
            getScoresUrl = 'https://jbdlsmg8cc.execute-api.us-east-1.amazonaws.com/prod/scorescanner',
            epoch = '1979-12-11 00:00:00';

        $(document).on('click.start', '.splash .start', function(event) {
            event.preventDefault();
            $('.splash').addClass('hide');
            setTimeout(function() {
                $('.pick').removeClass('hide');
            }, 250);
        });

        $(document).on('click', '.pick .button', function(event) {
            event.preventDefault();
            selectedTeam = $(this).data('team');
            $(this).addClass('selected');
            $('.pick').addClass('waiting');
            startGamePolling();
        });

        initializeGame();

        function startGamePolling() {
            gamePolling = setInterval(checkForGame, 1000);

            function checkForGame() {
                $.ajax({
                    url: getGameUrl,
                    type: 'GET',
                    success: function(response) {
                        var secondsRemaining;

                        if (response && response.time !== epoch) {
                            clearTimeout(gamePolling);
                            timestampMoment = moment(response.time + ' +00:00', 'YYYY-MM-DD HH:mm:ss.SSSSSS Z');
                            gameDuration = response.duration;
                            gameEndMoment = timestampMoment.clone().add(gameStartBuffer + gameDuration, 'seconds');
                            secondsRemaining = gameEndMoment.diff(moment(), 'seconds');

                            if (gameEndMoment.isAfter(moment()) && secondsRemaining <= gameDuration) {
                                showGame();
                                setTimeout(showResults, secondsRemaining * 1000);
                            } else {
                                showResults();
                            }
                        }
                    }
                });
            }
        }

        function showGame() {
            hideAllBut('.play');
            $('.play').removeClass('hide');
        }

        function showResults() {
            hideAllBut('.results');
            $('.results').removeClass('hide');
        }

        function hideAllBut(show) {
            var selectors = ['.splash', '.pick', '.play', '.results'];

            selectors.forEach(function (selector) {
                if (selector !== show) {
                    $(selector).addClass('hide');
                }
            });
        }

        function initializeGame() {
            // target elements with the "draggable" class
            interact('.draggable')
                .draggable({
                    // enable inertial throwing
                    inertia: true,
                    // keep the element within the area of it's parent
                    restrict: {
                        restriction: "parent",
                        endOnly: true,
                        elementRect: {top: 0, left: 0, bottom: 1, right: 1}
                    },
                    // enable autoScroll
                    autoScroll: true,

                    // call this function on every dragmove event
                    onmove: dragMoveListener,
                    // call this function on every dragend event
                    onend: function (event) {
                        var $stone = $('.stone');

                        $stone.addClass('sink');
                        setTimeout(resetStone, 2000);

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

                        function isInsideTarget(selector) {
                            var target = getCenterCoordinates($(selector)[0]),
                                stone = getCenterCoordinates($('.stone')[0]);

                            return Math.sqrt(Math.pow(stone.x - target.x, 2) + Math.pow(stone.y - target.y, 2)) < target.r;
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

                // update the posiion attributes
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
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
            }

            // this is used later in the resizing and gesture demos
            window.dragMoveListener = dragMoveListener;
        }

    });
})();