#!/bin/bash

#mvn package
docker build -t phantasmicmeans/board-service-sidecar:latest .
docker push phantasmicmeans/board-service-sidecar:latest

