upLocal:
	docker compose -f compose.yaml --env-file .env.local up -d --build

downLocal:
	docker compose -f compose.yaml --env-file .env.local down

logs:
	docker compose -f compose.yaml --env-file .env.local logs -f backend frontend

contPs:
	docker compose -f compose.yaml --env-file .env.local ps

contLs:
	docker container ls -a

contPrune:
	docker container prune -f
