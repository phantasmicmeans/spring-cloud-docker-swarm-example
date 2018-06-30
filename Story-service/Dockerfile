FROM openjdk:8-jdk-alpine
VOLUME /tmp
#ARG JAR_FILE
ADD ./target/story-service-0.0.1.jar app.jar
EXPOSE 8768
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-Dspring.profiles.active=docker","-jar","/app.jar"]
#ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]
