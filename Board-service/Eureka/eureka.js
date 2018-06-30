const Eureka = require('eureka-js-client').Eureka;

const Eurekaclient = new Eureka({

    instance: {
        app: 'Board-Service',
        hostName: '127.0.0.1',
        ipAddr: '127.0.0.1',
        vipAddress: 'jq.test.something.com',
        statusPageUrl: 'http://127.0.0.1:3000/bss',
        port: {
            '$': 3000,
            '@enabled': 'true',
        },
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name : 'MyOwn',
        },
    },
    eureka: {
        //eureka server 
        host: '127.0.0.1',
        port: 8761,
        servicePath: '/eureka/apps'
    },
});

module.exports = Eurekaclient;

