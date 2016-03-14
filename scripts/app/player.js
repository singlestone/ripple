(function() {
    $(document).ready(function() {

        var selectedTeam = null,
            gamePolling = null,
            timestampMoment,
            gameEndMoment,
            gameDuration = 120,
            gameStartBuffer = 5,
            getTimeStampUrl = 'https://0h0dcuripf.execute-api.us-east-1.amazonaws.com/prod/getLatestGameTimeStamp',
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
                    url: getTimeStampUrl,
                    type: 'GET',
                    success: function(response) {
                        var secondsRemaining;

                        if (response && response !== epoch) {
                            clearTimeout(gamePolling);
                            timestampMoment = moment(response + ' +00:00', 'YYYY-MM-DD HH:mm:ss.SSSSSS Z');
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
            console.log('showResults is executing');
            hideAllBut('.results');
            $('.results').removeClass('hide');
        }

        function hideAllBut(show) {
            var selectors = ['.splash', '.pick', '.play', '.results'];

            selectors.forEach(function (selector) {
                if (selector !== show) {
                    $(selector).addClass('hide');
                }
            })
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
                        var textEl = event.target.querySelector('p');

                        //textEl && (textEl.textContent =
                        //    'moved a distance of '
                        //    + (Math.sqrt(event.dx * event.dx +
                        //        event.dy * event.dy)|0) + 'px');
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

            // this is used later in the resizing and gesture demos
            window.dragMoveListener = dragMoveListener;
        }

    });
})();