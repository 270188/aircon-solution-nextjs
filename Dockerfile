# Imagen única: la página React (Vite + TypeScript) se compila y la sirve el mismo Spring Boot que expone la API.

# ---- 1. Frontend (React + Vite + TypeScript) ----
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- 2. Backend (Spring Boot) ----
FROM maven:3.9-eclipse-temurin-21 AS api
WORKDIR /app
COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
COPY --from=web /web/dist/ ./src/main/resources/static/
RUN mvn -B -q package -DskipTests

# ---- 3. Ejecución ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=api /app/target/airconsolution-api.jar app.jar
USER app
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -XX:TieredStopAtLevel=1"
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s \
  CMD wget -qO- http://localhost:${PORT:-8080}/actuator/health/liveness || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
