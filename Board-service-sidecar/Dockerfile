FROM openjdk:8-jdk-alpine
VOLUME /tmp
ADD ./target/board-service-sidecar-0.0.1.jar app.jar
#ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-Dspring.profiles.active=docker","-jar","/app.jar"]

