# =============================================================================
# MoneyTrack Backend — Production Dockerfile
# Tech: Spring Boot 3.3.5 / Java 17 / Maven / AWS DynamoDB
# =============================================================================

# ─── Stage 1: Dependency cache ───────────────────────────────────────────────
# Download all Maven dependencies into a dedicated layer.
# This layer is only re-downloaded when pom.xml changes.
FROM maven:3.9-eclipse-temurin-17-alpine AS deps

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -q --no-transfer-progress

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Reuse the cached local Maven repository from the deps stage
COPY --from=deps /root/.m2 /root/.m2

# Copy project files
COPY pom.xml .
COPY src ./src

# Build fat JAR, skip tests (tests run in CI pipeline separately)
RUN mvn clean package -DskipTests -q --no-transfer-progress

# Rename JAR to a fixed name so the runtime stage is version-independent
RUN cp target/*.jar target/app.jar

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Install curl for HEALTHCHECK; clean up in the same layer to keep image small
RUN apk add --no-cache curl

WORKDIR /app

# Create a non-root user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the built JAR from the builder stage
COPY --from=builder --chown=appuser:appgroup /app/target/app.jar app.jar

# Switch to non-root user
USER appuser

# ─── JVM tuning for containers ────────────────────────────────────────────────
# JAVA_TOOL_OPTIONS is read by the JVM automatically — no shell wrapper needed.
# -XX:+UseContainerSupport        : respect cgroup CPU/memory limits (default JDK 11+)
# -XX:MaxRAMPercentage=75.0       : use 75 % of container memory for heap
# -XX:+ExitOnOutOfMemoryError     : crash fast instead of limping along
# -Djava.security.egd=...         : faster SecureRandom startup (important for JWT)
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+ExitOnOutOfMemoryError \
  -Djava.security.egd=file:/dev/./urandom"

# ─── Application environment variables ───────────────────────────────────────
# All sensitive values (JWT_SECRET, AWS credentials) MUST be injected at
# runtime via docker run -e, docker-compose environment, or ECS task definition.
# NEVER bake secrets into the image.
ENV PORT=8080
ENV AWS_REGION=ap-southeast-1
ENV DYNAMODB_ENDPOINT=""
ENV DYNAMODB_TABLE_USERS=moneytrack-users
ENV DYNAMODB_TABLE_CATEGORIES=moneytrack-categories
ENV DYNAMODB_TABLE_TRANSACTIONS=moneytrack-transactions
ENV JWT_EXPIRATION_MS=86400000

EXPOSE 8080

# Health check — Spring Boot Actuator health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# exec form — no shell wrapper, signals forwarded correctly to the JVM
ENTRYPOINT ["java", "-jar", "app.jar"]
