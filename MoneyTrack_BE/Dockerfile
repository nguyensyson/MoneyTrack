# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy dependency descriptors first for layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/MoneyTrack_BE-0.0.1-SNAPSHOT.jar app.jar

# Environment variable placeholders
ENV SPRING_DATASOURCE_URL=""
ENV SPRING_DATASOURCE_USERNAME=""
ENV SPRING_DATASOURCE_PASSWORD=""
ENV SERVER_PORT=8080
ENV JWT_SECRET=""

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
