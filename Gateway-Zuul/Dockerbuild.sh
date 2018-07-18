#!/bin/bash

mvn package
docker build -t {YOUR_DOKCER_ID}/api-gateway:latest .
docker push {YOUR_DOCKER_ID}/api-gateway:latest

