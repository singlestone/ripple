(function() {
    $(document).ready(function() {

        var timestampMoment,
            gameEndMoment,
            gameDuration = 120,
            getTimeStampUrl = 'https://0h0dcuripf.execute-api.us-east-1.amazonaws.com/prod/getLatestGameTimeStamp',
            setTimeStampUrl = 'https://0h0dcuripf.execute-api.us-east-1.amazonaws.com/prod/setGameTimeStamp',
            resetUrl = 'https://mzupek0wyg.execute-api.us-east-1.amazonaws.com/prod/scoreclear',
            getScoresUrl = 'https://jbdlsmg8cc.execute-api.us-east-1.amazonaws.com/prod/scorescanner',
            epoch = '1979-12-11 00:00:00';

        initialize();

        function initialize() {
            initializePageState();
            initializeStartButtonBehavior();
            initializeResetButtonBehavior();
        }

        function initializePageState() {
            $.ajax({
                url: getTimeStampUrl,
                type: 'GET',
                success: function(response) {
                    if (response && response !== epoch) {
                        timestampMoment = moment(response + ' +00:00', 'YYYY-MM-DD HH:mm:ss.SSSSSS Z');
                        gameEndMoment = timestampMoment.clone().add(gameDuration, 'seconds');
                        console.log('timestamp', timestampMoment.toString(), 'now', moment().toString());
                        console.log('gameEnd', gameEndMoment.toString(), 'now', moment().toString());

                        if (gameEndMoment.isAfter(moment())) {
                            showScoreboard();
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
                $.ajax({
                    url: setTimeStampUrl,
                    type: 'GET',
                    success: function(response) {
                        initializePageState();
                        //todo: polling
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

        function activateGameCountdown() {

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
    });
})();