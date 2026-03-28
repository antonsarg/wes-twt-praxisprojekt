## Run in development environment
```
docker compose -f compose.yml -f compose.dev.yml up --build
```

## Run in production
```
docker compose -f compose.yml up --build
```

## Run the database seed
```
go run cmd/seed/main.go
```