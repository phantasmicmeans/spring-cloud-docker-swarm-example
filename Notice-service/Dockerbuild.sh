#!/bin/bash

mvn package
docker build -t {YOUR_DOKCER_ID}/notice-service:latest .
docker push {YOUR_DOKCER_ID}/notice-service:latest


