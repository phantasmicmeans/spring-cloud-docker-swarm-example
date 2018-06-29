#!/bin/bash

mvn package
#mvn dockerfile:build
docker build -t phantasmicmeans/auth-service:latest .
docker push phantasmicmeans/auth-service:latest

