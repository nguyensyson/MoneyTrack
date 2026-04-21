# Project Structure

## Root Package
- **Base Package**: `com.money.moneytrack_be`
- **Main Class**: `MoneyTrackBeApplication.java`

## Standard Spring Boot Layout

### Source Structure
```
src/
├── main/
│   ├── java/com/money/moneytrack_be/
│   │   ├── controller/     # REST controllers (@RestController)
│   │   ├── service/        # Business logic (@Service)
│   │   ├── repository/     # Data access layer (@Repository)
│   │   ├── entity/         # JPA entities (@Entity)
│   │   ├── dto/           # Data Transfer Objects
│   │   └── MoneyTrackBeApplication.java
│   └── resources/
│       ├── application.properties
│       ├── static/        # Static web resources
│       └── templates/     # Template files
└── test/
    └── java/com/money/moneytrack_be/
        └── [test classes]
```

## Package Conventions

### Controller Layer (`controller/`)
- REST endpoints and request handling
- Use `@RestController` annotation
- Handle HTTP requests/responses
- Validate input and delegate to services

### Service Layer (`service/`)
- Business logic implementation
- Use `@Service` annotation
- Transaction management
- Coordinate between controllers and repositories

### Repository Layer (`repository/`)
- Data access and persistence
- Use `@Repository` annotation
- Extend Spring Data JPA interfaces
- Custom query methods

### Entity Layer (`entity/`)
- JPA entity classes
- Use `@Entity` annotation
- Database table mappings
- Use Lombok for getters/setters

### DTO Layer (`dto/`)
- Data Transfer Objects
- Request/Response models
- Input validation annotations
- Use Lombok for boilerplate code

## Configuration Files
- **application.properties** - Main configuration
- **pom.xml** - Maven dependencies and build configuration
- Use Spring profiles for environment-specific configs