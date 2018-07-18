#!/bin/bash

mvn package
docker build -t {YOUR_DOKCER_ID}/eureka-server:latest .
docker push {YOUR_DOCKER_ID}/eureka-server:latest

