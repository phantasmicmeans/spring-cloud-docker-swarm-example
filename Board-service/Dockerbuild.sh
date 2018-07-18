#!/bin/bash

mvn package
docker build -t {YOUR_DOKCER_ID}/board-service:latest .
docker push {YOUR_DOCKER_ID}/board-service:latest

