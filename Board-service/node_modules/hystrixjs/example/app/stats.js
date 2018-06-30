var express = require('express'),
    hystrixStream = require('../../lib/http/HystrixSSEStream'),
    _ = require('lodash');

module.exports = function(config) {
    
    function hystrixStreamResponse(request, response) {
        response.append('Content-Type', 'text/event-stream;charset=UTF-8');
        response.append('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
        response.append('Pragma', 'no-cache');
        console.log("in stats requesting." + hystrixStream.toObservable().subscribe);
        response.write("test");
        return hystrixStream.toObservable().subscribe(
            function onNext(sseData) {
                console.log("in onNext:" + sseData);
                response.write('data: ' + sseData + '\n\n');
            },
            function onError(error) {console.log(error);
            },
            function onComplete() {
                return response.end();
            }
        );

    };

    this.start = function() {
        var app = express();
        app.get('/api/hystrix.stream', hystrixStreamResponse);
        process.title = "node (stats server)";
        var server = app.listen(config.webPort, function() {
            console.log("[%d] STATS listening on %d", process.pid, config.webPort);
        });
    };

};
