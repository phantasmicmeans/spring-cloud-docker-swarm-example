#!/bin/bash

mvn package
docker build -t phantasmicmeans/story-service:latest .
docker push phantasmicmeans/story-service:latest


