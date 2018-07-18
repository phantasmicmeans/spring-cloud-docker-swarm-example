#!/bin/bash

mvn package
docker build -t {YOUR_DOKCER_ID}/board-service-sidecar:latest .
docker push {YOUR_DOKCER_ID}/board-service-sidecar:latest

