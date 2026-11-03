upLocal:
	docker compose -f compose.yaml --env-file .env up -d

downLocal:
	docker compose -f compose.yaml --env-file .env down

logs:
	docker compose -f compose.yaml --env-file .env logs -f

contPs:
	docker compose -f compose.yaml --env-file .env.local ps

contLs:
	docker container ls -a

contPrune:
	docker container prune -f
