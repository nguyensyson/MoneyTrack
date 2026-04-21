# Technology Stack

## Core Framework
- **Spring Boot 4.0.5** - Main application framework
- **Java 17** - Programming language version
- **Maven** - Build system and dependency management

## Key Dependencies
- **Spring Boot Starter Web MVC** - REST API development
- **Spring Boot Starter Data JPA** - Database ORM and data access
- **Spring Boot Starter Security** - Authentication and authorization
- **MySQL Connector** - Database connectivity
- **Lombok** - Code generation for boilerplate reduction

## Database
- **MySQL** - Primary database for data persistence
- **JPA/Hibernate** - ORM for database operations

## Build System
- **Apache Maven** - Dependency management and build automation
- **Maven Wrapper** - Included for consistent builds across environments

## Common Commands

### Development
```bash
# Run the application
./mvnw spring-boot:run

# Run with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Building
```bash
# Clean and compile
./mvnw clean compile

# Package application
./mvnw clean package

# Skip tests during build
./mvnw clean package -DskipTests
```

### Testing
```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=ClassName
```

## Code Style
- Use Lombok annotations to reduce boilerplate code
- Follow Spring Boot conventions for package structure
- Use proper Spring annotations (@RestController, @Service, @Repository, etc.)